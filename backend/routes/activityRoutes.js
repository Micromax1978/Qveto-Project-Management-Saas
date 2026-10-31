const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/activities
router.get("/", activityController.getActivities);

module.exports = router;
