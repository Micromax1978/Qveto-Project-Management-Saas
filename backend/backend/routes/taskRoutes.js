const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const commentController = require("../controllers/commentController");
const attachmentController = require("../controllers/attachmentController");
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

// GET /api/tasks
router.get("/", taskController.getTasks);

// GET /api/tasks/overdue (must be declared before /:id)
router.get("/overdue", taskController.getOverdueTasks);

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

// Task Collaboration Sub-routes (Phase 2, 3, 4)
// Comments
router.get("/:taskId/comments", commentController.getComments);
router.post("/:taskId/comments", commentController.createComment);

// Attachments
router.get("/:taskId/attachments", attachmentController.getAttachments);
router.post("/:taskId/attachments", attachmentController.createAttachment);

// Activity Stream
router.get("/:taskId/activities", activityController.getActivities);

module.exports = router;
