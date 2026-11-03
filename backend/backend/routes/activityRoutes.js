const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/tasks/:taskId/activities (handled via task sub-route or direct param)
router.get("/:taskId/activities", activityController.getActivities);

module.exports = router;
