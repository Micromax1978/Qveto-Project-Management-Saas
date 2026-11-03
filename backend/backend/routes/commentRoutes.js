const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// PATCH /api/comments/:commentId
router.patch("/:commentId", commentController.updateComment);

// DELETE /api/comments/:commentId
router.delete("/:commentId", commentController.deleteComment);

module.exports = router;
