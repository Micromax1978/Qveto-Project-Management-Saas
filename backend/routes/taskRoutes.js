const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { validateFields } = require("../middleware/validator");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/tasks
router.get("/", taskController.getTasks);

// GET /api/tasks/:id
router.get("/:id", taskController.getTaskById);

// POST /api/tasks
router.post(
    "/",
    validateFields({
        required: ["title", "projectId"],
        allowedEnums: { status: taskController.ALLOWED_STATUSES }
    }),
    taskController.createTask
);

// PATCH /api/tasks/:id
router.patch(
    "/:id",
    validateFields({
        allowedEnums: { status: taskController.ALLOWED_STATUSES }
    }),
    taskController.updateTask
);

// DELETE /api/tasks/:id
router.delete("/:id", taskController.deleteTask);

module.exports = router;
