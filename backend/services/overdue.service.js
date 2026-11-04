// Overdue detection.
//
// Rule: a task is overdue when its due date/time is strictly before "now" (UTC)
// and its status is not DONE. Date-only due dates count as the END of that day.
//
// The scanner creates ONE in-app notification per task for its assignee the
// first time it is found overdue (tracked with Task.overdueNotifiedAt, which is
// reset when the due date changes). It runs on an interval from server.js and
// can be triggered manually with POST /api/notifications/scan-overdue.
const prisma = require("../lib/prisma");
const { notifyUsers } = require("./notification.service");
const { logActivity } = require("./activity.service");

async function scanOverdueTasks({ organizationId, now = new Date() } = {}) {
    const tasks = await prisma.task.findMany({
        where: {
            ...(organizationId ? { organizationId } : {}),
            dueDate: { lt: now },
            status: { not: "DONE" },
            overdueNotifiedAt: null,
            assigneeId: { not: null }
        },
        select: {
            id: true,
            title: true,
            organizationId: true,
            projectId: true,
            assigneeId: true,
            dueDate: true
        }
    });

    let notified = 0;

    for (const task of tasks) {
        // Claim the task so concurrent scans cannot notify twice.
        const claimed = await prisma.task.updateMany({
            where: { id: task.id, overdueNotifiedAt: null },
            data: { overdueNotifiedAt: now }
        });

        if (claimed.count !== 1) {
            continue;
        }

        await notifyUsers({
            organizationId: task.organizationId,
            userIds: [task.assigneeId],
            type: "TASK_OVERDUE",
            message: `Task "${task.title}" is overdue (due ${task.dueDate.toISOString()})`,
            taskId: task.id,
            projectId: task.projectId
        });

        await logActivity({
            organizationId: task.organizationId,
            projectId: task.projectId,
            taskId: task.id,
            actorId: null,
            type: "TASK_OVERDUE",
            message: `Task "${task.title}" became overdue`
        });

        notified += 1;
    }

    return { checked: tasks.length, notified };
}

module.exports = { scanOverdueTasks };
