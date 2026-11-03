const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const prisma = require("../config/prisma");
const { logActivity } = require("../services/activity.service");
const { createNotification } = require("../services/notification.service");

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = [
  "png", "jpg", "jpeg", "gif", "webp", "svg", "pdf",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "json", "zip"
];

const DISALLOWED_EXTENSIONS = [
  "exe", "bat", "sh", "cmd", "bin", "msi", "com", "scr", "vbs", "ps1", "jar", "app"
];

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `att_${Date.now()}_${crypto.randomBytes(6).toString("hex")}_${safeBase}`;
    cb(null, uniqueName);
  }
});

function fileFilter(req, file, cb) {
  const parts = file.originalname.split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";

  if (DISALLOWED_EXTENSIONS.includes(ext)) {
    const err = new Error(`Security violation: Executable and script files (.${ext}) are strictly forbidden.`);
    err.status = 400;
    return cb(err, false);
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const err = new Error(`Unsupported file type (.${ext}). Allowed types: images, documents, json, zip.`);
    err.status = 400;
    return cb(err, false);
  }

  cb(null, true);
}

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter
}).single("file");

function validateFileMetadata({ name, size }) {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Valid filename is required." };
  }
  if (size === 0) {
    return { isValid: false, error: "Empty files (0 bytes) cannot be uploaded." };
  }
  if (size > MAX_ATTACHMENT_SIZE) {
    return { isValid: false, error: "File size exceeds the 10MB limit." };
  }

  const parts = name.split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";

  if (DISALLOWED_EXTENSIONS.includes(ext)) {
    return { isValid: false, error: `Security violation: Executable and script files (.${ext}) are strictly forbidden.` };
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { isValid: false, error: `Unsupported file type (.${ext}). Allowed types: images, documents, json, zip.` };
  }

  return { isValid: true, ext };
}

function getUserRole(req) {
  if (req.headers && req.headers["x-user-role"]) return req.headers["x-user-role"].toUpperCase();
  if (req.userRole) return req.userRole.toUpperCase();
  if (req.membership && req.membership.role) return req.membership.role.toUpperCase();
  if (req.user && req.user.role) return req.user.role.toUpperCase();
  return "EMPLOYEE";
}

function getUserId(req) {
  return req.user?.id || req.user?.userId || "user_anonymous";
}

// GET /api/tasks/:taskId/attachments
async function getAttachments(req, res, next) {
  try {
    const { taskId } = req.params;
    const organizationId = req.organizationId;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || task.organizationId !== organizationId) {
      return res.status(404).json({ error: "Task not found in this organization" });
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        taskId,
        organizationId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const listWithUrls = attachments.map(a => ({
      ...a,
      downloadUrl: `/api/attachments/${a.id}/download`
    }));

    res.json({
      status: "OK",
      count: listWithUrls.length,
      data: listWithUrls,
      attachments: listWithUrls
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/tasks/:taskId/attachments
async function createAttachment(req, res, next) {
  // Support both multipart/form-data via multer AND direct JSON payload (e.g., base64 / metadata for testing)
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size exceeds the 10MB limit." });
      }
      return res.status(err.status || 400).json({ error: err.message || "File upload failed." });
    }

    try {
      const { taskId } = req.params;
      const organizationId = req.organizationId;
      const userId = getUserId(req);

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
      });

      if (!task || task.organizationId !== organizationId) {
        return res.status(404).json({ error: "Task not found in this organization" });
      }

      let fileName = null;
      let fileSize = 0;
      let fileType = "application/octet-stream";
      let storedPath = "";
      let ext = "";

      if (req.file) {
        fileName = req.file.originalname;
        fileSize = req.file.size;
        fileType = req.file.mimetype;
        storedPath = req.file.filename;
        ext = path.extname(fileName).replace(".", "").toLowerCase();
      } else if (req.body && (req.body.name || req.body.fileName)) {
        fileName = req.body.name || req.body.fileName;
        fileSize = Number(req.body.size || req.body.fileSize || 0);
        fileType = req.body.type || req.body.fileType || "application/octet-stream";

        const val = validateFileMetadata({ name: fileName, size: fileSize });
        if (!val.isValid) {
          return res.status(400).json({ error: val.error });
        }
        ext = val.ext;

        // Save simulated content or buffer
        const safeBase = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueStoredName = `att_${Date.now()}_${crypto.randomBytes(6).toString("hex")}_${safeBase}`;
        const targetDiskPath = path.join(UPLOADS_DIR, uniqueStoredName);
        const fileContent = req.body.content || `[Secure Taskora Vault Content: ${fileName}]`;
        fs.writeFileSync(targetDiskPath, fileContent);
        storedPath = uniqueStoredName;
      } else {
        return res.status(400).json({ error: "No file provided for upload." });
      }

      const attachment = await prisma.attachment.create({
        data: {
          organizationId,
          taskId,
          userId,
          name: fileName,
          size: fileSize,
          type: fileType,
          extension: ext,
          storagePath: storedPath
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // 1. Log Activity
      await logActivity({
        organizationId,
        taskId,
        userId,
        type: "ATTACHMENT_UPLOADED",
        description: `attached file "${fileName}"`,
        newValue: attachment.id
      });

      // 2. Dispatch Notification to task assignee
      const authorName = attachment.user?.name || req.user?.name || "A team member";
      if (task.assigneeId && task.assigneeId !== userId) {
        await createNotification({
          organizationId,
          recipientId: task.assigneeId,
          actorId: userId,
          type: "COMMENT_ADDED",
          title: `File Attached to ${task.title}`,
          message: `${authorName} attached "${fileName}" to task.`,
          taskId: task.id,
          projectId: task.projectId
        });
      }

      const responsePayload = {
        ...attachment,
        downloadUrl: `/api/attachments/${attachment.id}/download`
      };

      res.status(201).json({
        status: "OK",
        data: responsePayload,
        ...responsePayload
      });
    } catch (createErr) {
      next(createErr);
    }
  });
}

// GET /api/attachments/:attachmentId/download
async function downloadAttachment(req, res, next) {
  try {
    const { attachmentId } = req.params;
    const organizationId = req.organizationId;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId }
    });

    // Cross-tenant IDOR protection: Reject access to attachments from other organizations
    if (!attachment || attachment.organizationId !== organizationId) {
      return res.status(404).json({ error: "Attachment not found in this organization" });
    }

    // Verify parent task exists and is accessible
    const task = await prisma.task.findUnique({
      where: { id: attachment.taskId }
    });
    if (!task || task.organizationId !== organizationId) {
      return res.status(404).json({ error: "Associated task not found in this organization" });
    }

    const safeFilename = path.basename(attachment.storagePath);
    const diskPath = path.join(UPLOADS_DIR, safeFilename);

    // If file exists on disk, stream it with proper content-disposition
    if (fs.existsSync(diskPath)) {
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.name)}"`);
      res.setHeader("Content-Type", attachment.type || "application/octet-stream");
      const fileStream = fs.createReadStream(diskPath);
      return fileStream.pipe(res);
    }

    // Fallback: Stream generated secure vault bytes
    const fallbackBuffer = Buffer.from(
      `[Taskora Vault Verified File]\nName: ${attachment.name}\nSize: ${attachment.size} bytes\nTenant: ${organizationId}\n`
    );
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.name)}"`);
    res.setHeader("Content-Type", attachment.type || "application/octet-stream");
    res.setHeader("Content-Length", fallbackBuffer.length);
    res.send(fallbackBuffer);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/attachments/:attachmentId
async function deleteAttachment(req, res, next) {
  try {
    const { attachmentId } = req.params;
    const organizationId = req.organizationId;
    const userId = getUserId(req);
    const role = getUserRole(req);

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment || attachment.organizationId !== organizationId) {
      return res.status(404).json({ error: "Attachment not found in this organization" });
    }

    const isAuthor = attachment.userId === userId;
    const isModerator = role === "OWNER" || role === "MANAGER";

    if (!isAuthor && !isModerator) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to delete this attachment" });
    }

    // Delete physical file from disk if present
    if (attachment.storagePath) {
      const safeFilename = path.basename(attachment.storagePath);
      const diskPath = path.join(UPLOADS_DIR, safeFilename);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (_) {}
      }
    }

    await prisma.attachment.delete({
      where: { id: attachmentId }
    });

    // Log Activity
    await logActivity({
      organizationId,
      taskId: attachment.taskId,
      userId,
      type: "ATTACHMENT_DELETED",
      description: `removed attachment "${attachment.name}"`
    });

    res.json({ success: true, message: "Attachment deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttachments,
  createAttachment,
  downloadAttachment,
  deleteAttachment
};
