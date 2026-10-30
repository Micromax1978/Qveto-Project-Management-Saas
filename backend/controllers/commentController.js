const prisma = require("../config/prisma");
const activityService = require("../services/activityService");

const MAX_COMMENT_LENGTH = 5000;

function isValidTaskId(id) {
    if (!id || typeof id !== "string") return false;
    const clean = id.trim();
    if (clean.length === 0) return false;
    if (/\s/.test(clean)) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) return false;
    return true;
}

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
 * Verify task authorization:
 * - Checks if task ID is syntactically valid
 * - Checks if task exists within the organization
 * - If user is an EMPLOYEE, verifies project membership if project membership is restricted
 */
async function verifyTaskAccess(taskId, organizationId, user, userRole) {
    if (!isValidTaskId(taskId)) {
        return { error: "Invalid task ID format", status: 400 };
    }

    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            organizationId
        }
    });

    if (!task) {
        return {
            error: `Task not found with id: ${taskId} in the current organization`,
            status: 404
        };
    }

    if (user && user.id && userRole === "EMPLOYEE") {
        try {
            const totalProjectMembers = await prisma.projectMember.count({
                where: { projectId: task.projectId }
            });

            if (totalProjectMembers > 0) {
                const isMember = await prisma.projectMember.findFirst({
                    where: {
                        projectId: task.projectId,
                        userId: user.id
                    }
                });

                if (!isMember) {
                    return {
                        error: "Forbidden: You do not have access to tasks in this project",
                        status: 403
                    };
                }
            }
        } catch (memberErr) {
            console.warn("[CommentController] Project membership verification warning:", memberErr.message);
        }
    }

    return { task };
}

/**
 * GET /api/tasks/:taskId/comments
 * Retrieve all comments for a specific task in oldest-first order.
 */
async function getComments(req, res, next) {
    try {
        const taskId = req.params.taskId || req.params.id;
        const organizationId = req.organizationId;
        const user = req.user;
        const userRole = req.userRole;

        const access = await verifyTaskAccess(taskId, organizationId, user, userRole);
        if (access.error) {
            return res.status(access.status).json({ error: access.error });
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
        const userRole = req.userRole;
        const { text } = req.body || {};

        if (!user || !user.id) {
            return res.status(401).json({
                error: "Unauthorized: You must be authenticated to post comments."
            });
        }

        // Validate comment text
        if (text === undefined || text === null || typeof text !== "string" || text.trim() === "") {
            return res.status(400).json({
                error: "Comment text cannot be empty"
            });
        }

        if (text.length > MAX_COMMENT_LENGTH) {
            return res.status(400).json({
                error: `Comment text exceeds maximum allowed length of ${MAX_COMMENT_LENGTH} characters`
            });
        }

        const access = await verifyTaskAccess(taskId, organizationId, user, userRole);
        if (access.error) {
            return res.status(access.status).json({ error: access.error });
        }

        const task = access.task;

        // Ensure author user exists in database
        let authorId = user.id;
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!existingUser) {
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

        // Activity event recording (Week 3 Day 5 integration)
        try {
            activityService.recordCommentActivity({
                actor: { id: authorId, name: user.name || "User", email: user.email || "" },
                task: { id: task.id, title: task.title, projectId: task.projectId },
                organizationId,
                comment: enriched,
                eventType: "COMMENT_CREATED",
                timestamp: enriched.createdAt
            });
        } catch (actErr) {
            console.warn("[CommentController] Activity record warning:", actErr.message);
        }

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
            } catch (customActErr) {
                console.warn("[CommentController] Custom activity handler warning:", customActErr.message);
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
    isValidTaskId,
    MAX_COMMENT_LENGTH
};
