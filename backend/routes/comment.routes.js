// Comments. Mounted at /api (paths are explicit) BEFORE the task router.
const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const { HttpError } = require("../lib/errors");
const { getAuthorizedTask, assertId } = require("../lib/access");
const { requireString, parsePagination } = require("../lib/validation");
const { logActivity } = require("../services/activity.service");
const { notifyUsers } = require("../services/notification.service");

const router = express.Router();

const guard = [authenticateToken, requireOrganization];
const authorSummary = { select: { id: true, name: true } };

// Loads a comment in the user's organization and checks access to its task.
async function getAuthorizedComment(req) {
    const id = assertId(req.params.commentId, "Comment ID");

    const comment = await prisma.comment.findFirst({
        where: { id, organizationId: req.organizationId }
    });

    if (!comment) {
        throw new HttpError(404, "Comment not found or access denied");
    }

    try {
        const task = await getAuthorizedTask(req, comment.taskId);
        return { comment, task };
    } catch (error) {
        if (error instanceof HttpError && error.statusCode === 404) {
            throw new HttpError(404, "Comment not found or access denied");
        }

        throw error;
    }
}

// GET /api/tasks/:taskId/comments - oldest first
router.get("/tasks/:taskId/comments", ...guard, async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.taskId);
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 100, maxSize: 200 });

    const where = { taskId: task.id, organizationId: req.organizationId };

    const [total, comments] = await Promise.all([
        prisma.comment.count({ where }),
        prisma.comment.findMany({
            where,
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            skip,
            take,
            include: { author: authorSummary }
        })
    ]);

    return res.json({ status: "OK", count: comments.length, total, page, pageSize, comments });
});

// POST /api/tasks/:taskId/comments { body }
router.post("/tasks/:taskId/comments", ...guard, async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.taskId);
    const body = requireString((req.body || {}).body, "Comment", { max: 2000 });

    const comment = await prisma.comment.create({
        data: {
            organizationId: req.organizationId,
            taskId: task.id,
            authorId: req.userId,
            body
        },
        include: { author: authorSummary }
    });

    await logActivity({
        organizationId: req.organizationId,
        projectId: task.projectId,
        taskId: task.id,
        actorId: req.userId,
        type: "COMMENT_ADDED",
        message: `${req.userName} commented on "${task.title}"`,
        metadata: { commentId: comment.id }
    });

    await notifyUsers({
        organizationId: req.organizationId,
        userIds: [task.assigneeId, task.createdById],
        type: "COMMENT_ADDED",
        message: `${req.userName} commented on "${task.title}"`,
        taskId: task.id,
        projectId: task.projectId,
        excludeUserId: req.userId
    });

    return res.status(201).json({
        status: "OK",
        message: "Comment added successfully",
        comment
    });
});

// PATCH /api/comments/:commentId { body } - author only
router.patch("/comments/:commentId", ...guard, async (req, res) => {
    const { comment } = await getAuthorizedComment(req);

    if (comment.authorId !== req.userId) {
        throw new HttpError(403, "Only the author can edit this comment");
    }

    const body = requireString((req.body || {}).body, "Comment", { max: 2000 });

    const updated = await prisma.comment.update({
        where: { id: comment.id },
        data: { body, isEdited: true },
        include: { author: authorSummary }
    });

    return res.json({
        status: "OK",
        message: "Comment updated successfully",
        comment: updated
    });
});

// DELETE /api/comments/:commentId - author, or an owner/manager (moderation)
router.delete("/comments/:commentId", ...guard, async (req, res) => {
    const { comment } = await getAuthorizedComment(req);

    if (comment.authorId !== req.userId && !req.isManager) {
        throw new HttpError(403, "Only the author or a manager can delete this comment");
    }

    await prisma.comment.delete({ where: { id: comment.id } });

    return res.json({ status: "OK", message: "Comment deleted successfully" });
});

module.exports = router;
