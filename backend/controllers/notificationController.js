const notificationService = require("../services/notificationService");
const overdueService = require("../services/overdueService");
const emailService = require("../services/emailService");

/**
 * Helper to extract current userId from request (token user, header, or query)
 */
function getRequestUserId(req) {
    if (req.user && req.user.id) return req.user.id;
    if (req.headers["x-user-id"]) return req.headers["x-user-id"];
    if (req.query.userId) return req.query.userId;
    return null;
}

/**
 * GET /api/notifications
 * Users see ONLY their own notifications in their organization (Day 5).
 */
async function getNotifications(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const userId = getRequestUserId(req);

        if (!userId) {
            return res.status(401).json({
                error: "User identity required. Provide Bearer token or 'x-user-id' header."
            });
        }

        const { read, type, limit = 50, offset = 0 } = req.query;

        const result = await notificationService.getUserNotifications({
            organizationId,
            userId,
            read,
            type,
            limit: parseInt(limit, 10) || 50,
            offset: parseInt(offset, 10) || 0
        });

        res.json({
            organizationId,
            userId,
            ...result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/notifications/unread-count
 * Quick badge endpoint.
 */
async function getUnreadCount(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const userId = getRequestUserId(req);

        if (!userId) {
            return res.status(401).json({
                error: "User identity required. Provide Bearer token or 'x-user-id' header."
            });
        }

        const result = await notificationService.getUnreadCount({ organizationId, userId });
        res.json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark single notification as read.
 */
async function markAsRead(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const userId = getRequestUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                error: "User identity required. Provide Bearer token or 'x-user-id' header."
            });
        }

        const updated = await notificationService.markAsRead({
            organizationId,
            userId,
            notificationId: id
        });

        if (!updated) {
            return res.status(404).json({
                error: `Notification not found or access denied for id: ${id}`
            });
        }

        res.json(updated);
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all unread notifications as read for current user.
 */
async function markAllAsRead(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const userId = getRequestUserId(req);

        if (!userId) {
            return res.status(401).json({
                error: "User identity required. Provide Bearer token or 'x-user-id' header."
            });
        }

        const result = await notificationService.markAllAsRead({ organizationId, userId });
        res.json({
            message: "All unread notifications marked as read",
            ...result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification with ownership validation.
 */
async function deleteNotification(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const userId = getRequestUserId(req);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                error: "User identity required. Provide Bearer token or 'x-user-id' header."
            });
        }

        const deleted = await notificationService.deleteNotification({
            organizationId,
            userId,
            notificationId: id
        });

        if (!deleted) {
            return res.status(404).json({
                error: `Notification not found or access denied for id: ${id}`
            });
        }

        res.json({ message: "Notification deleted successfully" });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tasks/check-overdue
 * Trigger overdue detection & notification dispatch (Day 3 & Day 4).
 */
async function triggerOverdueCheck(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { referenceDate } = req.body || {};

        const results = await overdueService.detectAndNotifyOverdueTasks({
            organizationId,
            referenceDate: referenceDate ? new Date(referenceDate) : new Date()
        });

        res.json(results);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tasks/overdue
 * List overdue tasks under UTC rule.
 */
async function getOverdueTasks(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { referenceDate } = req.query;

        const results = await overdueService.getOverdueTasks({
            organizationId,
            referenceDate: referenceDate ? new Date(referenceDate) : new Date()
        });

        res.json(results);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/notifications/simulated-emails
 * Inspect simulated email dispatches (Day 6).
 */
async function getSimulatedEmails(req, res, next) {
    try {
        const { recipientEmail, limit } = req.query;
        const emails = emailService.getSimulatedEmails({ recipientEmail, limit });
        res.json({
            status: "SIMULATED",
            note: "Email sending is simulated in memory. No real external emails are sent.",
            count: emails.length,
            emails
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    triggerOverdueCheck,
    getOverdueTasks,
    getSimulatedEmails,
    getRequestUserId
};
