const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");

const router = express.Router();

router.use(authenticateToken, requireOrganization);

// GET /api/organization - current organization
router.get("/", async (req, res) => {
    const organization = await prisma.organization.findUnique({
        where: { id: req.organizationId },
        select: { id: true, name: true, createdAt: true }
    });

    return res.json({ status: "OK", organization, role: req.role });
});

// GET /api/organization/members - members of the current user's organization
router.get("/members", async (req, res) => {
    const members = await prisma.membership.findMany({
        where: { organizationId: req.organizationId },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { createdAt: "asc" }
    });

    return res.json({
        status: "OK",
        organizationId: req.organizationId,
        memberCount: members.length,
        members
    });
});

// GET /api/organization/labels - labels used in this organization
router.get("/labels", async (req, res) => {
    const labels = await prisma.label.findMany({
        where: { organizationId: req.organizationId },
        orderBy: { name: "asc" }
    });

    return res.json({ status: "OK", count: labels.length, labels });
});

module.exports = router;
