const express = require("express");
const router = express.Router();
const orgController = require("../controllers/orgController");
const { validateRequired } = require("../middleware/validator");
const { optionalAuth } = require("../middleware/auth");

router.use(optionalAuth);

// GET /api/organizations
router.get("/", orgController.getOrganizations);

// GET /api/organizations/:id
router.get("/:id", orgController.getOrganizationById);

// POST /api/organizations
router.post(
    "/",
    validateRequired(["name"]),
    orgController.createOrganization
);

module.exports = router;
