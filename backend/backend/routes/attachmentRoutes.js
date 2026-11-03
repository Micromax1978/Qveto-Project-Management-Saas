const express = require("express");
const router = express.Router();
const attachmentController = require("../controllers/attachmentController");
const { optionalAuth } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/orgAuth");

router.use(optionalAuth);
router.use(requireOrganization);

// GET /api/attachments/:attachmentId/download
router.get("/:attachmentId/download", attachmentController.downloadAttachment);

// DELETE /api/attachments/:attachmentId
router.delete("/:attachmentId", attachmentController.deleteAttachment);

module.exports = router;
