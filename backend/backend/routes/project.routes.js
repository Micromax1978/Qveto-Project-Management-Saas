const express = require("express");
const router = express.Router();

const prisma = require("../lib/prisma");

const authMiddleware = require("../middleware/auth.middleware");
const organizationMiddleware = require("../middleware/organization.middleware");

router.use(authMiddleware, organizationMiddleware);

function isManagerOrOwner(role) {
    const r = String(role || "").toLowerCase();
    return r === "owner" || r === "manager";
}

// GET /api/projects — List projects for current user
router.get("/", async (req, res) => {
    try {
        const { search, workspaceId } = req.query;
        const userId = req.user.userId || req.user.id;
        const role = req.user.role;

        let projects = await prisma.project.findMany({
            where: {
                organizationId: req.organizationId,
                ...(workspaceId ? { workspaceId } : {})
            },
            include: {
                projectMembers: true
            }
        });

        if (!isManagerOrOwner(role)) {
            projects = projects.filter(p =>
                p.projectMembers && p.projectMembers.some(pm => pm.userId === userId)
            );
        }

        if (search && typeof search === "string" && search.trim()) {
            const q = search.trim().toLowerCase();
            projects = projects.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }

        return res.json({
            status: "OK",
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error("List projects error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to retrieve projects"
        });
    }
});

// GET /api/projects/:id — Get project by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId || req.user.id;
        const role = req.user.role;

        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found"
            });
        }

        if (!isManagerOrOwner(role)) {
            const isMember = await prisma.projectMember.findFirst({
                where: {
                    projectId: project.id,
                    userId
                }
            });
            if (!isMember) {
                return res.status(403).json({
                    status: "ERROR",
                    message: "Forbidden: You are not a member of this project"
                });
            }
        }

        const members = await prisma.projectMember.findMany({
            where: { projectId: project.id },
            include: { user: true }
        });

        return res.json({
            status: "OK",
            project: {
                ...project,
                members
            }
        });
    } catch (error) {
        console.error("Get project error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to retrieve project"
        });
    }
});

// POST /api/projects — Create project (Manager/Owner only)
router.post("/", async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.userId || req.user.id;

        if (!isManagerOrOwner(role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden: Employees cannot create projects"
            });
        }

        let { workspaceId, name, description, members } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                status: "ERROR",
                message: "Project name is required"
            });
        }

        const trimmedName = name.trim();

        const existing = await prisma.project.findFirst({
            where: {
                organizationId: req.organizationId,
                name: trimmedName
            }
        });

        if (existing) {
            return res.status(400).json({
                status: "ERROR",
                message: "A project with this name already exists in your organization"
            });
        }

        if (!workspaceId || typeof workspaceId !== "string" || !workspaceId.trim()) {
            let defaultWs = await prisma.workspace.findFirst({
                where: { organizationId: req.organizationId }
            });
            if (!defaultWs) {
                defaultWs = await prisma.workspace.create({
                    data: {
                        organizationId: req.organizationId,
                        name: "General Workspace"
                    }
                });
            }
            workspaceId = defaultWs.id;
        } else {
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
        }

        const project = await prisma.project.create({
            data: {
                organizationId: req.organizationId,
                workspaceId: workspaceId.trim(),
                name: trimmedName,
                description: typeof description === "string" && description.trim() ? description.trim() : null
            }
        });

        await prisma.projectMember.create({
            data: {
                projectId: project.id,
                userId
            }
        });

        if (Array.isArray(members)) {
            for (const memberId of members) {
                if (memberId && memberId !== userId) {
                    const validUser = await prisma.membership.findFirst({
                        where: {
                            userId: memberId,
                            organizationId: req.organizationId
                        }
                    });
                    if (validUser) {
                        await prisma.projectMember.create({
                            data: {
                                projectId: project.id,
                                userId: memberId
                            }
                        });
                    }
                }
            }
        }

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
});

const updateProjectHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        if (!isManagerOrOwner(role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden: Employees cannot edit project settings"
            });
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found or access denied"
            });
        }

        const { name, description, workspaceId } = req.body;
        const data = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Project name cannot be empty"
                });
            }
            data.name = name.trim();
        }

        if (description !== undefined) {
            data.description = typeof description === "string" ? description.trim() : null;
        }

        if (workspaceId !== undefined) {
            data.workspaceId = workspaceId;
        }

        const updatedProject = await prisma.project.update({
            where: { id },
            data
        });

        return res.json({
            status: "OK",
            message: "Project updated successfully",
            project: updatedProject
        });
    } catch (error) {
        console.error("Update project error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to update project"
        });
    }
};

router.patch("/:id", updateProjectHandler);
router.put("/:id", updateProjectHandler);

// DELETE /api/projects/:id — Delete project
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        if (!isManagerOrOwner(role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden: Only managers and organization owners can delete projects"
            });
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found or access denied"
            });
        }

        await prisma.project.delete({
            where: { id }
        });

        return res.json({
            status: "OK",
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error("Delete project error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to delete project"
        });
    }
});

// GET /api/projects/:id/members — List project members
router.get("/:id/members", async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found"
            });
        }

        const members = await prisma.projectMember.findMany({
            where: { projectId: project.id },
            include: { user: true }
        });

        return res.json({
            status: "OK",
            count: members.length,
            members
        });
    } catch (error) {
        console.error("Get project members error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to retrieve project members"
        });
    }
});

// POST /api/projects/:id/members — Add member to project
router.post("/:id/members", async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        if (!isManagerOrOwner(role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden: Only managers and owners can add project members"
            });
        }

        const { userId } = req.body;
        if (!userId || typeof userId !== "string") {
            return res.status(400).json({
                status: "ERROR",
                message: "User ID is required"
            });
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found"
            });
        }

        const targetMembership = await prisma.membership.findFirst({
            where: {
                userId,
                organizationId: req.organizationId
            }
        });

        if (!targetMembership) {
            return res.status(400).json({
                status: "ERROR",
                message: "User does not belong to your organization"
            });
        }

        const existingMember = await prisma.projectMember.findFirst({
            where: {
                projectId: project.id,
                userId
            }
        });

        if (existingMember) {
            return res.status(409).json({
                status: "ERROR",
                message: "User is already a member of this project"
            });
        }

        const newMember = await prisma.projectMember.create({
            data: {
                projectId: project.id,
                userId
            }
        });

        return res.status(201).json({
            status: "OK",
            message: "Project member added successfully",
            member: newMember
        });
    } catch (error) {
        console.error("Add project member error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to add project member"
        });
    }
});

// DELETE /api/projects/:id/members/:userId — Remove member from project
router.delete("/:id/members/:userId", async (req, res) => {
    try {
        const { id, userId } = req.params;
        const role = req.user.role;

        if (!isManagerOrOwner(role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden: Only managers and owners can remove project members"
            });
        }

        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found"
            });
        }

        const member = await prisma.projectMember.findFirst({
            where: {
                projectId: project.id,
                userId
            }
        });

        if (!member) {
            return res.status(404).json({
                status: "ERROR",
                message: "Member not found in this project"
            });
        }

        await prisma.projectMember.delete({
            where: { id: member.id }
        });

        return res.json({
            status: "OK",
            message: "Project member removed successfully"
        });
    } catch (error) {
        console.error("Remove project member error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to remove project member"
        });
    }
});

module.exports = router;
