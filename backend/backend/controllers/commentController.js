const prisma = require("../config/prisma");
const { logActivity } = require("../services/activity.service");
const { createNotification } = require("../services/notification.service");

// Helper to determine user role
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

// GET /api/tasks/:taskId/comments
async function getComments(req, res, next) {
  try {
    const { taskId } = req.params;
    const organizationId = req.organizationId;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || task.organizationId !== organizationId) {
      return res.status(404).json({ error: "Task not found in this organization" });
    }

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
        organizationId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    res.json({
      status: "OK",
      count: comments.length,
      data: comments,
      comments
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/tasks/:taskId/comments
async function createComment(req, res, next) {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const organizationId = req.organizationId;
    const userId = getUserId(req);

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task || task.organizationId !== organizationId) {
      return res.status(404).json({ error: "Task not found in this organization" });
    }

    const comment = await prisma.comment.create({
      data: {
        organizationId,
        taskId,
        userId,
        content: content.trim(),
        isEdited: false
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // 1. Log Activity
    const preview = content.trim().length > 60 ? content.trim().substring(0, 60) + "..." : content.trim();
    await logActivity({
      organizationId,
      taskId,
      userId,
      type: "COMMENT_ADDED",
      description: `commented: "${preview}"`,
      newValue: comment.id
    });

    // 2. Dispatch Notification to task assignee (if not self)
    const authorName = comment.user?.name || req.user?.name || "A team member";
    if (task.assigneeId && task.assigneeId !== userId) {
      await createNotification({
        organizationId,
        recipientId: task.assigneeId,
        actorId: userId,
        type: "COMMENT_ADDED",
        title: `New Comment on ${task.title}`,
        message: `${authorName} commented: "${preview}"`,
        taskId: task.id,
        projectId: task.projectId
      });
    }

    res.status(201).json({
      status: "OK",
      data: comment,
      ...comment
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/comments/:commentId
async function updateComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const organizationId = req.organizationId;
    const userId = getUserId(req);

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment || comment.organizationId !== organizationId) {
      return res.status(404).json({ error: "Comment not found in this organization" });
    }

    // Role and ownership check: Only the author can edit their own comment
    if (comment.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: You can only edit your own comments" });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log Activity
    await logActivity({
      organizationId,
      taskId: comment.taskId,
      userId,
      type: "COMMENT_EDITED",
      description: "edited a comment",
      newValue: commentId
    });

    res.json({
      status: "OK",
      data: updated,
      ...updated
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/comments/:commentId
async function deleteComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const organizationId = req.organizationId;
    const userId = getUserId(req);
    const role = getUserRole(req);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment || comment.organizationId !== organizationId) {
      return res.status(404).json({ error: "Comment not found in this organization" });
    }

    // Authorization: Author can delete, Manager/Owner can moderate, other Employee blocked
    const isAuthor = comment.userId === userId;
    const isModerator = role === "OWNER" || role === "MANAGER";

    if (!isAuthor && !isModerator) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    // Log Activity
    await logActivity({
      organizationId,
      taskId: comment.taskId,
      userId,
      type: "COMMENT_DELETED",
      description: isModerator && !isAuthor ? "moderated/deleted a comment" : "removed a comment"
    });

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};
