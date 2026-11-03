const prisma = require("../config/prisma");
const { checkOverdueTasks } = require("../services/notification.service");

function getUserId(req) {
  return req.user?.id || req.user?.userId || "user_anonymous";
}

// GET /api/notifications
async function getNotifications(req, res, next) {
  try {
    const organizationId = req.organizationId;
    const userId = getUserId(req);
    const { category, unreadOnly } = req.query;

    // Check and generate overdue alerts for this user safely without duplicate spam
    await checkOverdueTasks(organizationId, userId);

    // CRITICAL SECURITY: Strictly scoped to recipientId === userId and organizationId
    const where = {
      organizationId,
      recipientId: userId
    };

    if (category && category !== "ALL") {
      where.type = category;
    }

    if (unreadOnly === "true" || unreadOnly === true) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      status: "OK",
      count: notifications.length,
      data: notifications,
      notifications
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/notifications/unread-count
async function getUnreadCount(req, res, next) {
  try {
    const organizationId = req.organizationId;
    const userId = getUserId(req);

    const count = await prisma.notification.count({
      where: {
        organizationId,
        recipientId: userId,
        isRead: false
      }
    });

    res.json({
      status: "OK",
      unreadCount: count,
      count
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/notifications/:notificationId/read
async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    const organizationId = req.organizationId;
    const userId = getUserId(req);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    // Security check: Must belong to requesting user and organization
    if (!notification || notification.organizationId !== organizationId || notification.recipientId !== userId) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
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

// PATCH /api/notifications/read-all
async function markAllAsRead(req, res, next) {
  try {
    const organizationId = req.organizationId;
    const userId = getUserId(req);

    const result = await prisma.notification.updateMany({
      where: {
        organizationId,
        recipientId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      status: "OK",
      success: true,
      updatedCount: result.count
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
