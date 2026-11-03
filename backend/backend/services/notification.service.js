const prisma = require("../config/prisma");
const { sendNotificationEmail } = require("./email.service");

/**
 * In-App & Email Notification Service (Phase 5 & 6)
 */
async function createNotification({
  organizationId,
  recipientId,
  actorId = null,
  type,
  title,
  message,
  taskId = null,
  projectId = null
}) {
  try {
    if (!organizationId || !recipientId) return null;

    // Do not notify a user for their own action
    if (actorId && recipientId === actorId) {
      return null;
    }

    // Check for duplicate unread notification of the same type for the same task
    if (taskId) {
      const existingUnread = await prisma.notification.findFirst({
        where: {
          recipientId,
          taskId,
          type,
          isRead: false
        }
      });
      if (existingUnread) {
        return existingUnread;
      }
    }

    const notification = await prisma.notification.create({
      data: {
        organizationId,
        recipientId,
        actorId: actorId || null,
        type,
        title,
        message,
        taskId: taskId || null,
        projectId: projectId || null,
        isRead: false
      }
    });

    // Lookup recipient email for optional email dispatch
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      });
      if (recipient && recipient.email) {
        sendNotificationEmail({
          to: recipient.email,
          subject: title,
          body: message,
          metadata: { taskId, projectId, type }
        }).catch(() => {});
      }
    } catch (_) {}

    return notification;
  } catch (err) {
    console.warn("[NotificationService] Failed to create notification:", err.message);
    return null;
  }
}

/**
 * Overdue task check and notification generator (Phase 6)
 * Safely generates single non-duplicated overdue alerts for assigned users.
 */
async function checkOverdueTasks(organizationId, targetUserId = null) {
  try {
    if (!organizationId) return [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const where = {
      organizationId,
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: { lt: startOfToday }
    };

    if (targetUserId) {
      where.assigneeId = targetUserId;
    }

    const overdueTasks = await prisma.task.findMany({
      where,
      include: { assignee: true, project: true }
    });

    const generated = [];
    for (const task of overdueTasks) {
      if (task.assigneeId) {
        // Prevent duplicate unread notification
        const existing = await prisma.notification.findFirst({
          where: {
            recipientId: task.assigneeId,
            taskId: task.id,
            type: "TASK_OVERDUE",
            isRead: false
          }
        });

        if (!existing) {
          const dueStr = task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toISOString().split("T")[0] : String(task.dueDate).split("T")[0]) : 'previously';
          const notif = await createNotification({
            organizationId: task.organizationId,
            recipientId: task.assigneeId,
            actorId: null,
            type: "TASK_OVERDUE",
            title: `Overdue Alert: ${task.title}`,
            message: `Task "${task.title}" is overdue (was due ${dueStr}).`,
            taskId: task.id,
            projectId: task.projectId
          });
          if (notif) generated.push(notif);
        }
      }
    }

    return generated;
  } catch (err) {
    console.warn("[NotificationService] Failed to check overdue tasks:", err.message);
    return [];
  }
}

module.exports = {
  createNotification,
  checkOverdueTasks
};
