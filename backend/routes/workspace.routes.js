const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const requireRole = require("../middleware/role.middleware");
const { requireString } = require("../lib/validation");

const router = express.Router();

router.use(authenticateToken, requireOrganization);

// GET /api/workspaces
router.get("/", async (req, res) => {
    const workspaces = await prisma.workspace.findMany({
        where: { organizationId: req.organizationId },
        orderBy: { name: "asc" }
    });

    return res.json({ status: "OK", count: workspaces.length, workspaces });
});

// POST /api/workspaces (owner/manager)
router.post("/", requireRole("owner", "manager"), async (req, res) => {
    const name = requireString((req.body || {}).name, "Workspace name", { max: 100 });

    const workspace = await prisma.workspace.create({
        data: { organizationId: req.organizationId, name }
    });

    return res.status(201).json({
        status: "OK",
        message: "Workspace created successfully",
        workspace
    });
});

module.exports = router;
