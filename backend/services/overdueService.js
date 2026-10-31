const prisma = require("../config/prisma");
const notificationService = require("./notificationService");
const activityService = require("./activityService");

/**
 * Overdue Detection Service
 * Week 3 Requirements:
 * - Day 3: Overdue detection. Agreed date and timezone rule: UTC (Coordinated Universal Time).
 * - Day 4: Do not create the same notification again and again (daily dedupKey: overdue:{taskId}:{YYYY-MM-DD}).
 */

// Agreed Timezone Standard: UTC
const TIMEZONE_RULE = "UTC";

/**
 * Format a Date object to YYYY-MM-DD in UTC
 */
function getUtcDateKey(date = new Date()) {
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
}

/**
 * Detect overdue tasks in an organization and create notifications for their assignees.
 * A task is overdue if:
 * 1. dueDate < referenceUtc
 * 2. status NOT IN ("DONE", "CANCELLED")
 * 3. task is in the specified organization
 * 
 * @param {Object} options
 * @param {string} options.organizationId - Target organization
 * @param {Date|string} [options.referenceDate] - Comparison point in UTC (defaults to current UTC time)
 */
async function detectAndNotifyOverdueTasks({ organizationId, referenceDate = new Date() }) {
    const nowUtc = new Date(referenceDate);
    const dateKey = getUtcDateKey(nowUtc);

    // Find all overdue tasks for this organization
    const overdueTasks = await prisma.task.findMany({
        where: {
            organizationId,
            dueDate: {
                lt: nowUtc,
                not: null
            },
            status: {
                notIn: ["DONE", "CANCELLED"]
            }
        },
        include: {
            assignee: {
                select: { id: true, name: true, email: true }
            },
            project: {
                select: { id: true, name: true }
            }
        }
    });

    const results = {
        organizationId,
        timezoneRule: TIMEZONE_RULE,
        checkedAtUtc: nowUtc.toISOString(),
        dateKey,
        totalOverdue: overdueTasks.length,
        notificationsCreated: 0,
        duplicatesSuppressed: 0,
        tasks: []
    };

    for (const task of overdueTasks) {
        const dueDateString = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "N/A";
        const taskInfo = {
            id: task.id,
            title: task.title,
            status: task.status,
            dueDateUtc: task.dueDate ? task.dueDate.toISOString() : null,
            assigneeId: task.assigneeId,
            assigneeName: task.assignee?.name || null,
            projectName: task.project?.name || null
        };

        // If the task has an assignee, notify them
        if (task.assigneeId) {
            // Day 4: Deduplication Key ensures only 1 notification per day per task
            const dedupKey = `overdue:${task.id}:${dateKey}`;

            const notification = await notificationService.createNotification({
                organizationId,
                userId: task.assigneeId,
                taskId: task.id,
                type: "TASK_OVERDUE",
                title: `Task Overdue: ${task.title}`,
                message: `Task "${task.title}" was due on ${dueDateString} (UTC) and is currently overdue.`,
                dedupKey
            });

            if (notification && notification.duplicateSuppressed) {
                results.duplicatesSuppressed++;
                taskInfo.notificationStatus = "SUPPRESSED_DUPLICATE";
            } else if (notification) {
                results.notificationsCreated++;
                taskInfo.notificationStatus = "CREATED";

                // Record activity log for overdue event
                await activityService.recordActivity({
                    organizationId,
                    projectId: task.projectId,
                    taskId: task.id,
                    action: "TASK_UPDATED",
                    details: {
                        event: "OVERDUE_ALERT",
                        dueDateUtc: task.dueDate.toISOString(),
                        alertDateUtc: dateKey
                    }
                });
            }
        } else {
            taskInfo.notificationStatus = "SKIPPED_UNASSIGNED";
        }

        results.tasks.push(taskInfo);
    }

    return results;
}

/**
 * Query overdue tasks for listing without necessarily triggering new notifications.
 */
async function getOverdueTasks({ organizationId, referenceDate = new Date() }) {
    const nowUtc = new Date(referenceDate);

    const overdueTasks = await prisma.task.findMany({
        where: {
            organizationId,
            dueDate: {
                lt: nowUtc,
                not: null
            },
            status: {
                notIn: ["DONE", "CANCELLED"]
            }
        },
        orderBy: { dueDate: "asc" },
        include: {
            assignee: {
                select: { id: true, name: true, email: true }
            },
            project: {
                select: { id: true, name: true }
            }
        }
    });

    return {
        organizationId,
        timezoneRule: TIMEZONE_RULE,
        referenceUtc: nowUtc.toISOString(),
        count: overdueTasks.length,
        tasks: overdueTasks.map((t) => {
            const diffMs = nowUtc.getTime() - new Date(t.dueDate).getTime();
            const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            return {
                ...t,
                overdueDays: Math.max(0, overdueDays)
            };
        })
    };
}

module.exports = {
    detectAndNotifyOverdueTasks,
    getOverdueTasks,
    TIMEZONE_RULE,
    getUtcDateKey
};
