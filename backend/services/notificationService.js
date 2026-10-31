const prisma = require("../config/prisma");
const emailService = require("./emailService");

/**
 * Create a notification record for a user in an organization.
 * Implements Week 3 duplicate prevention (Day 4):
 * - If dedupKey is specified, checks if a notification with that key already exists for the user.
 * - If already exists, skips insertion and returns existing record.
 */
async function createNotification({
    organizationId,
    userId,
    taskId = null,
    type,
    title,
    message,
    dedupKey = null
}) {
    if (!organizationId || !userId || !type || !title || !message) {
        console.warn("[NotificationService] Missing required parameters for createNotification");
        return null;
    }

    try {
        // Day 4: Duplicate Prevention
        if (dedupKey) {
            const existing = await prisma.notification.findFirst({
                where: {
                    organizationId,
                    userId,
                    dedupKey
                }
            });

            if (existing) {
                // If already present, avoid creating duplicate notification
                return {
                    ...existing,
                    duplicateSuppressed: true
                };
            }
        }

        // Additional safeguard for unread duplicate notifications
        if (!dedupKey && taskId) {
            const existingUnread = await prisma.notification.findFirst({
                where: {
                    organizationId,
                    userId,
                    taskId,
                    type,
                    read: false
                }
            });

            if (existingUnread) {
                return {
                    ...existingUnread,
                    duplicateSuppressed: true
                };
            }
        }

        const notification = await prisma.notification.create({
            data: {
                organizationId,
                userId,
                taskId: taskId || null,
                type,
                title,
                message,
                read: false,
                dedupKey: dedupKey || null
            },
            include: {
                task: {
                    select: { id: true, title: true, status: true, priority: true }
                }
            }
        });

        // Day 6: Email dispatch (SIMULATED)
        try {
            const recipientUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true }
            });

            if (recipientUser && recipientUser.email) {
                await emailService.sendSimulatedEmail({
                    to: recipientUser.email,
                    subject: `[Qveto] ${title}`,
                    body: `Hi ${recipientUser.name || "there"},\n\n${message}\n\n- The Qveto Team`,
                    metadata: {
                        notificationId: notification.id,
                        taskId,
                        type,
                        organizationId
                    }
                });
            }
        } catch (mailErr) {
            console.warn("[NotificationService] Simulated email failed:", mailErr.message);
        }

        return notification;
    } catch (err) {
        // In case of unique constraint race condition
        if (err.code === "P2002") {
            const existing = await prisma.notification.findFirst({
                where: { organizationId, userId, dedupKey }
            });
            return {
                ...(existing || {}),
                duplicateSuppressed: true
            };
        }
        console.error("[NotificationService] Error creating notification:", err.message);
        return null;
    }
}

/**
 * Retrieve notifications for a specific user in an organization (Day 5).
 * Strictly isolated: users can only see their own notifications within their organization.
 */
async function getUserNotifications({ organizationId, userId, read, type, limit = 50, offset = 0 }) {
    const where = {
        organizationId,
        userId
    };

    if (read !== undefined && read !== null) {
        where.read = read === true || read === "true";
    }

    if (type) {
        where.type = type;
    }

    const [total, unreadCount, notifications] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: {
                organizationId,
                userId,
                read: false
            }
        }),
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: Number(limit) || 50,
            skip: Number(offset) || 0,
            include: {
                task: {
                    select: { id: true, title: true, status: true, priority: true, dueDate: true }
                }
            }
        })
    ]);

    return {
        total,
        unreadCount,
        limit: Number(limit) || 50,
        offset: Number(offset) || 0,
        notifications
    };
}

/**
 * Mark a single notification as read for a user (Day 5).
 * Validates ownership.
 */
async function markAsRead({ organizationId, userId, notificationId }) {
    const notification = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            organizationId,
            userId
        }
    });

    if (!notification) {
        return null;
    }

    const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
            read: true,
            readAt: new Date()
        }
    });

    return updated;
}

/**
 * Mark all unread notifications as read for a user (Day 5).
 */
async function markAllAsRead({ organizationId, userId }) {
    const result = await prisma.notification.updateMany({
        where: {
            organizationId,
            userId,
            read: false
        },
        data: {
            read: true,
            readAt: new Date()
        }
    });

    return {
        updatedCount: result.count
    };
}

/**
 * Get unread notification count for badge display.
 */
async function getUnreadCount({ organizationId, userId }) {
    const count = await prisma.notification.count({
        where: {
            organizationId,
            userId,
            read: false
        }
    });

    return { unreadCount: count };
}

/**
 * Delete a notification with ownership validation.
 */
async function deleteNotification({ organizationId, userId, notificationId }) {
    const notification = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            organizationId,
            userId
        }
    });

    if (!notification) {
        return null;
    }

    await prisma.notification.delete({
        where: { id: notificationId }
    });

    return true;
}

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification
};
