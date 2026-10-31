const prisma = require("../config/prisma");

/**
 * Record an activity event in the database.
 * Supports task lifecycle events: creation, assignment, status change, comments, updates, deletion.
 */
async function recordActivity({ organizationId, projectId, taskId, userId, action, details }) {
    try {
        if (!organizationId) {
            console.warn("[ActivityService] Missing organizationId when recording activity");
            return null;
        }

        const detailsString = typeof details === "object" ? JSON.stringify(details) : (details || null);

        const activity = await prisma.activity.create({
            data: {
                organizationId,
                projectId: projectId || null,
                taskId: taskId || null,
                userId: userId || null,
                action: action || "TASK_CREATED",
                details: detailsString
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                task: {
                    select: { id: true, title: true, status: true }
                }
            }
        });

        return activity;
    } catch (err) {
        console.error("[ActivityService] Failed to record activity:", err.message);
        // Fail-safe: recording activity must never crash core business flow
        return null;
    }
}

/**
 * Retrieve activities for an organization, optionally filtered by task, project, user, or action.
 */
async function getActivities({ organizationId, projectId, taskId, userId, action, limit = 50, offset = 0 }) {
    const where = { organizationId };

    if (projectId) where.projectId = projectId;
    if (taskId) where.taskId = taskId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const [total, activities] = await Promise.all([
        prisma.activity.count({ where }),
        prisma.activity.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: Number(limit) || 50,
            skip: Number(offset) || 0,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                },
                task: {
                    select: { id: true, title: true, status: true, priority: true }
                },
                project: {
                    select: { id: true, name: true }
                }
            }
        })
    ]);

    // Parse JSON details if stored as JSON
    const parsedActivities = activities.map((act) => {
        let parsedDetails = act.details;
        try {
            if (act.details && (act.details.startsWith("{") || act.details.startsWith("["))) {
                parsedDetails = JSON.parse(act.details);
            }
        } catch (_) {
            // keep as string
        }
        return {
            ...act,
            details: parsedDetails
        };
    });

    return {
        total,
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        activities: parsedActivities
    };
}

module.exports = {
    recordActivity,
    getActivities
};
