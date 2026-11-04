// Attachments. Mounted at /api (paths are explicit) BEFORE the task router.
//
// Security: access is checked BEFORE the upload body is parsed, the file type
// and content are validated, files are stored under a random name outside the
// web root, and downloads only happen through the authorized route below.
const express = require("express");
const multer = require("multer");
const prisma = require("../lib/prisma");
const logger = require("../lib/logger");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const { HttpError } = require("../lib/errors");
const { getAuthorizedTask, assertId } = require("../lib/access");
const {
    MAX_ATTACHMENT_BYTES,
    MAX_ATTACHMENTS_PER_TASK,
    validateUpload,
    saveAttachmentFile,
    removeStoredFile,
    resolveStoredPath,
    contentDisposition
} = require("../lib/storage");
const { logActivity } = require("../services/activity.service");
const { notifyUsers } = require("../services/notification.service");

const router = express.Router();

const guard = [authenticateToken, requireOrganization];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1, fields: 5, parts: 10 }
});

function uploadSingle(req, res, next) {
    upload.single("file")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return next(new HttpError(413, "File exceeds the 10 MB limit"));
            }

            return next(new HttpError(400, "Invalid upload. Send one file in the 'file' field."));
        }

        // Malformed multipart bodies (e.g. "Unexpected end of form") are client errors.
        return next(new HttpError(400, "Invalid multipart upload"));
    });
}

async function authorizeTask(req, res, next) {
    req.task = await getAuthorizedTask(req, req.params.taskId);
    next();
}

function serializeAttachment(attachment) {
    // storedName (the storage location) is never exposed to clients.
    const { storedName, ...rest } = attachment;

    return { ...rest, downloadUrl: `/api/attachments/${attachment.id}/download` };
}

async function getAuthorizedAttachment(req) {
    const id = assertId(req.params.attachmentId, "Attachment ID");

    const attachment = await prisma.attachment.findFirst({
        where: { id, organizationId: req.organizationId }
    });

    if (!attachment) {
        throw new HttpError(404, "Attachment not found or access denied");
    }

    try {
        const task = await getAuthorizedTask(req, attachment.taskId);
        return { attachment, task };
    } catch (error) {
        if (error instanceof HttpError && error.statusCode === 404) {
            throw new HttpError(404, "Attachment not found or access denied");
        }

        throw error;
    }
}

// GET /api/tasks/:taskId/attachments
router.get("/tasks/:taskId/attachments", ...guard, authorizeTask, async (req, res) => {
    const attachments = await prisma.attachment.findMany({
        where: { taskId: req.task.id, organizationId: req.organizationId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { uploadedBy: { select: { id: true, name: true } } }
    });

    return res.json({
        status: "OK",
        count: attachments.length,
        attachments: attachments.map(serializeAttachment)
    });
});

// POST /api/tasks/:taskId/attachments (multipart/form-data, field name: file)
router.post("/tasks/:taskId/attachments", ...guard, authorizeTask, uploadSingle, async (req, res) => {
    const task = req.task;
    const { ext, mime, originalName } = validateUpload(req.file);

    const existingCount = await prisma.attachment.count({ where: { taskId: task.id } });

    if (existingCount >= MAX_ATTACHMENTS_PER_TASK) {
        throw new HttpError(400, `A task can have at most ${MAX_ATTACHMENTS_PER_TASK} attachments`);
    }

    const storedName = await saveAttachmentFile(req.organizationId, ext, req.file.buffer);

    let attachment;

    try {
        attachment = await prisma.attachment.create({
            data: {
                organizationId: req.organizationId,
                taskId: task.id,
                uploadedById: req.userId,
                originalName,
                storedName,
                mimeType: mime,
                sizeBytes: req.file.buffer.length
            },
            include: { uploadedBy: { select: { id: true, name: true } } }
        });
    } catch (error) {
        // Do not leave an orphan file behind if the database write fails.
        await removeStoredFile(storedName).catch(() => {});
        throw error;
    }

    await logActivity({
        organizationId: req.organizationId,
        projectId: task.projectId,
        taskId: task.id,
        actorId: req.userId,
        type: "ATTACHMENT_ADDED",
        message: `${req.userName} attached "${attachment.originalName}" to "${task.title}"`,
        metadata: { attachmentId: attachment.id }
    });

    await notifyUsers({
        organizationId: req.organizationId,
        userIds: [task.assigneeId, task.createdById],
        type: "ATTACHMENT_ADDED",
        message: `${req.userName} attached "${attachment.originalName}" to "${task.title}"`,
        taskId: task.id,
        projectId: task.projectId,
        excludeUserId: req.userId
    });

    return res.status(201).json({
        status: "OK",
        message: "Attachment uploaded successfully",
        attachment: serializeAttachment(attachment)
    });
});

// GET /api/attachments/:attachmentId/download
router.get("/attachments/:attachmentId/download", ...guard, async (req, res, next) => {
    const { attachment } = await getAuthorizedAttachment(req);

    const absolutePath = resolveStoredPath(attachment.storedName);

    res.set({
        "Content-Type": attachment.mimeType,
        "Content-Disposition": contentDisposition(attachment.originalName),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store"
    });

    res.sendFile(absolutePath, { dotfiles: "allow", cacheControl: false }, (error) => {
        if (!error || res.headersSent) {
            return undefined;
        }

        if (error.code === "ENOENT" || error.status === 404) {
            logger.error("Attachment file missing on disk", { attachmentId: attachment.id });
            return next(new HttpError(404, "Attachment file is missing"));
        }

        return next(error);
    });
});

// DELETE /api/attachments/:attachmentId - uploader or owner/manager
router.delete("/attachments/:attachmentId", ...guard, async (req, res) => {
    const { attachment, task } = await getAuthorizedAttachment(req);

    if (attachment.uploadedById !== req.userId && !req.isManager) {
        throw new HttpError(403, "Only the uploader or a manager can delete this attachment");
    }

    await prisma.attachment.delete({ where: { id: attachment.id } });

    try {
        await removeStoredFile(attachment.storedName);
    } catch (error) {
        logger.error("Failed to remove attachment file", { storedName: attachment.storedName, error });
    }

    await logActivity({
        organizationId: req.organizationId,
        projectId: task.projectId,
        taskId: task.id,
        actorId: req.userId,
        type: "ATTACHMENT_REMOVED",
        message: `${req.userName} removed "${attachment.originalName}" from "${task.title}"`,
        metadata: { attachmentId: attachment.id }
    });

    return res.json({ status: "OK", message: "Attachment deleted successfully" });
});

module.exports = router;
