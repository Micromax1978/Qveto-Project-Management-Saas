
const express = require("express");
const router = express.Router();

const prisma = require("../lib/prisma");

const authMiddleware = require("../middleware/auth.middleware");
const organizationMiddleware = require("../middleware/organization.middleware");

// POST /api/projects
// Create a new project
router.post(
    "/",
    authMiddleware,
    organizationMiddleware,
    async (req, res) => {
        try {
            const { workspaceId, name, description } = req.body;

            // Validate required fields
            if (
                typeof workspaceId !== "string" ||
                !workspaceId.trim() ||
                typeof name !== "string" ||
                !name.trim()
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Workspace ID and project name are required"
                });
            }

            // Check whether the workspace belongs to the user's organization
            const workspace = await prisma.workspace.findFirst({
                where: {
                    id: workspaceId.trim(),
                    organizationId: req.organizationId
                }
            });

            if (!workspace) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Workspace not found in your organization"
                });
            }

            // Create project
            const project = await prisma.project.create({
                data: {
                    organizationId: req.organizationId,
                    workspaceId: workspaceId.trim(),
                    name: name.trim(),
                    description:
                        typeof description === "string" && description.trim()
                            ? description.trim()
                            : null
                }
            });

            return res.status(201).json({
                status: "OK",
                message: "Project created successfully",
                project
            });
        } catch (error) {
            console.error("Create project error:", error);

            return res.status(500).json({
                status: "ERROR",
                message: "Failed to create project"
            });
        }
    }
);

module.exports = router;
