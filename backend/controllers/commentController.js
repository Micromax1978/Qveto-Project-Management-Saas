const prisma = require("../config/prisma");

const MAX_COMMENT_LENGTH = 5000;

function getInitials(name) {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function enrichComment(comment) {
    if (!comment) return null;
    const author = comment.author || {
        id: comment.authorId,
        name: "Unknown User",
        email: "unknown@example.com"
    };

    return {
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        organizationId: comment.organizationId,
        text: comment.text,
        createdAt: comment.createdAt,
        author: {
            id: author.id,
            name: author.name,
            email: author.email,
            initials: getInitials(author.name)
        }
    };
}

/**
 * GET /api/tasks/:taskId/comments
 * Retrieve all comments for a specific task in oldest-first order.
 */
async function getComments(req, res, next) {
    try {
        const taskId = req.params.taskId || req.params.id;
        const organizationId = req.organizationId;

        if (!taskId || typeof taskId !== "string" || taskId.trim() === "") {
            return res.status(400).json({ error: "Task ID is required" });
        }

        // Verify task exists in the current organization
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                organizationId
            }
        });

        if (!task) {
            return res.status(404).json({
                error: `Task not found with id: ${taskId} in the current organization`
            });
        }

        const comments = await prisma.comment.findMany({
            where: {
                taskId,
                organizationId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: "asc" // Oldest-first order requirement
            }
        });

        const enrichedComments = comments.map(enrichComment);

        res.json({
            count: enrichedComments.length,
            taskId,
            organizationId,
            comments: enrichedComments
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tasks/:taskId/comments
 * Create a new comment on a task.
 */
async function createComment(req, res, next) {
    try {
        const taskId = req.params.taskId || req.params.id;
        const organizationId = req.organizationId;
        const user = req.user;
        const { text } = req.body || {};

        if (!user || !user.id) {
            return res.status(401).json({
                error: "Unauthorized: You must be logged in to post comments."
            });
        }

        if (!taskId || typeof taskId !== "string" || taskId.trim() === "") {
            return res.status(400).json({ error: "Task ID is required" });
        }

        // Verify task exists in the current organization
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                organizationId
            }
        });

        if (!task) {
            return res.status(404).json({
                error: `Task not found with id: ${taskId} in the current organization`
            });
        }

        // Validate comment text
        if (typeof text !== "string" || text.trim() === "") {
            return res.status(400).json({
                error: "Comment text cannot be empty"
            });
        }

        if (text.length > MAX_COMMENT_LENGTH) {
            return res.status(400).json({
                error: `Comment text exceeds maximum allowed length of ${MAX_COMMENT_LENGTH} characters`
            });
        }

        // Ensure author user exists in database
        let authorId = user.id;
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!existingUser) {
            // For synthetic tokens / test accounts, ensure user record exists
            try {
                const upserted = await prisma.user.upsert({
                    where: { email: user.email || `${user.id}@example.com` },
                    update: {},
                    create: {
                        id: user.id,
                        name: user.name || "Test User",
                        email: user.email || `${user.id}@example.com`
                    }
                });
                authorId = upserted.id;
            } catch (userErr) {
                console.warn("[CommentController] Author user check warning:", userErr.message);
            }
        }

        const comment = await prisma.comment.create({
            data: {
                taskId,
                authorId,
                organizationId,
                text: text.trim()
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        const enriched = enrichComment(comment);

        // Activity event recording hook (Week 3 Day 5 integration)
        if (req.recordCommentActivity) {
            try {
                req.recordCommentActivity({
                    actor: { id: authorId, name: user.name, email: user.email },
                    task: { id: task.id, title: task.title, projectId: task.projectId },
                    organizationId,
                    comment: enriched,
                    eventType: "COMMENT_CREATED",
                    timestamp: enriched.createdAt
                });
            } catch (actErr) {
                console.warn("[CommentController] Activity record warning:", actErr.message);
            }
        }

        res.status(201).json(enriched);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/comments/:id
 * Optional deletion endpoint for author or managers.
 */
async function deleteComment(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;
        const user = req.user;

        const comment = await prisma.comment.findFirst({
            where: { id, organizationId }
        });

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Only author or organization manager/owner can delete
        const isAuthor = user && user.id === comment.authorId;
        const isManager = req.userRole === "OWNER" || req.userRole === "MANAGER";

        if (!isAuthor && !isManager) {
            return res.status(403).json({
                error: "Forbidden: You are not authorized to delete this comment."
            });
        }

        await prisma.comment.delete({
            where: { id }
        });

        res.json({
            message: "Comment deleted successfully",
            id
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getComments,
    createComment,
    deleteComment,
    enrichComment,
    MAX_COMMENT_LENGTH
};
