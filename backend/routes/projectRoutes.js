const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { validateRequired } = require("../middleware/validator");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/projects
router.get("/", projectController.getProjects);

// GET /api/projects/:id
router.get("/:id", projectController.getProjectById);

// POST /api/projects
router.post(
    "/",
    validateRequired(["name"]),
    projectController.createProject
);

// PATCH /api/projects/:id
router.patch("/:id", projectController.updateProject);

// DELETE /api/projects/:id
router.delete("/:id", projectController.deleteProject);

module.exports = router;
