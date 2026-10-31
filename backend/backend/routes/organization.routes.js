const express = require("express");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requireOrganization,
    async (req, res) => {
        try {
            const org = await prisma.organization.findFirst({
                where: {
                    id: req.organizationId
                }
            });

            if (!org) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Organization not found"
                });
            }

            res.json({
                status: "OK",
                organization: org
            });
        } catch (error) {
            console.error("Error fetching organization:", error);
            res.status(500).json({
                status: "ERROR",
                message: "Failed to fetch organization"
            });
        }
    }
);

router.get(
    "/members",
    authenticateToken,
    requireOrganization,
    async (req, res) => {
        try {
            const members = await prisma.membership.findMany({
                where: {
                    organizationId: req.organizationId
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            res.json({
                status: "OK",
                organizationId: req.organizationId,
                memberCount: members.length,
                members
            });
        } catch (error) {
            console.error("Error fetching organization members:", error);

            res.status(500).json({
                status: "ERROR",
                message: "Failed to fetch organization members"
            });
        }
    }
);

module.exports = router;
