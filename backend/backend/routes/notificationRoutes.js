const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/notifications
router.get("/", notificationController.getNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", notificationController.getUnreadCount);

// PATCH /api/notifications/read-all
router.patch("/read-all", notificationController.markAllAsRead);

// PATCH /api/notifications/:notificationId/read
router.patch("/:notificationId/read", notificationController.markAsRead);

module.exports = router;
