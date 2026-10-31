const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

// Simulated emails can be inspected without org header for testing/auditing
router.get("/simulated-emails", notificationController.getSimulatedEmails);

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/notifications/unread-count (Must precede /:id)
router.get("/unread-count", notificationController.getUnreadCount);

// PATCH /api/notifications/mark-all-read (Must precede /:id)
router.patch("/mark-all-read", notificationController.markAllAsRead);

// GET /api/notifications
router.get("/", notificationController.getNotifications);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", notificationController.markAsRead);

// DELETE /api/notifications/:id
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
