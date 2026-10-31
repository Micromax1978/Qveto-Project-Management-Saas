const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const notificationController = require("../controllers/notificationController");
const activityController = require("../controllers/activityController");
const { validateFields } = require("../middleware/validator");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// Normalization middleware to permit lowercase/camelCase aliases (e.g., inProgress -> IN_PROGRESS)
function normalizeTaskPayload(req, res, next) {
    if (req.body && typeof req.body === "object") {
        if (req.body.status !== undefined && req.body.status !== null) {
            req.body.status = taskController.normalizeStatusValue(req.body.status);
        }
        if (req.body.priority !== undefined && req.body.priority !== null) {
            req.body.priority = taskController.normalizePriorityValue(req.body.priority);
        }
    }
    next();
}

// Week 3 Day 3: Overdue detection endpoints (before :id)
router.get("/overdue", notificationController.getOverdueTasks);
router.post("/check-overdue", notificationController.triggerOverdueCheck);

// GET /api/tasks
router.get("/", taskController.getTasks);

// Week 3 Day 1 & Day 2: Task comments and task activities
router.get("/:id/comments", taskController.getTaskComments);
router.post("/:id/comments", taskController.addTaskComment);
router.get("/:id/activities", activityController.getTaskActivities);

// GET /api/tasks/:id
router.get("/:id", taskController.getTaskById);

// POST /api/tasks
router.post(
    "/",
    normalizeTaskPayload,
    validateFields({
        required: ["title", "projectId"],
        allowedEnums: {
            status: taskController.ALLOWED_STATUSES,
            priority: taskController.ALLOWED_PRIORITIES
        }
    }),
    taskController.createTask
);

// PATCH /api/tasks/:id/status (Fast dedicated Kanban move endpoint)
router.patch("/:id/status", normalizeTaskPayload, taskController.updateTaskStatus);

// PATCH /api/tasks/:id
router.patch(
    "/:id",
    normalizeTaskPayload,
    validateFields({
        allowedEnums: {
            status: taskController.ALLOWED_STATUSES,
            priority: taskController.ALLOWED_PRIORITIES
        }
    }),
    taskController.updateTask
);

// DELETE /api/tasks/:id
router.delete("/:id", taskController.deleteTask);

module.exports = router;
