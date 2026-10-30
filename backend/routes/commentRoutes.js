const express = require("express");
const router = express.Router({ mergeParams: true });
const commentController = require("../controllers/commentController");
const { optionalAuth, authenticate } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/tasks/:taskId/comments or /api/comments
router.get("/", commentController.getComments);

// POST /api/tasks/:taskId/comments (requires authentication)
router.post("/", authenticate, commentController.createComment);

// DELETE /api/comments/:id
router.delete("/:id", authenticate, commentController.deleteComment);

module.exports = router;
