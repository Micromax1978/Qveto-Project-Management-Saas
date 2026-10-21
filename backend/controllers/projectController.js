const prisma = require("../config/prisma");

// GET /api/projects
async function getProjects(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { workspaceId, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

        const where = { organizationId };

        if (workspaceId) {
            where.workspaceId = workspaceId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search.trim(), mode: "insensitive" } },
                { description: { contains: search.trim(), mode: "insensitive" } }
            ];
        }

        // Validate sort field
        const validSortFields = ["name", "createdAt", "updatedAt"];
        const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
        const orderDirection = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

        const projects = await prisma.project.findMany({
            where,
            include: {
                workspace: {
                    select: { id: true, name: true }
                },
                tasks: {
                    select: {
                        id: true,
                        status: true,
                        assignee: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            },
            orderBy: { [orderField]: orderDirection }
        });

        // Enrich projects with metrics needed by Member 3's UI screens
        const enrichedProjects = projects.map((project) => {
            const tasks = project.tasks || [];
            const taskCount = tasks.length;

            const tasksByStatus = {
                TODO: 0,
                IN_PROGRESS: 0,
                IN_REVIEW: 0,
                DONE: 0,
                CANCELLED: 0
            };

            const memberMap = new Map();

            for (const task of tasks) {
                if (tasksByStatus[task.status] !== undefined) {
                    tasksByStatus[task.status]++;
                }
                if (task.assignee && !memberMap.has(task.assignee.id)) {
                    memberMap.set(task.assignee.id, task.assignee);
                }
            }

            const completedTaskCount = tasksByStatus.DONE;
            const progress = taskCount > 0
                ? Math.round((completedTaskCount / taskCount) * 100)
                : 0;

            const { tasks: _, ...projectData } = project;

            return {
                ...projectData,
                taskCount,
                completedTaskCount,
                progress,
                tasksByStatus,
                members: Array.from(memberMap.values())
            };
        });

        res.json({
            count: enrichedProjects.length,
            organizationId,
            projects: enrichedProjects
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/projects/:id
async function getProjectById(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;

        const project = await prisma.project.findFirst({
            where: {
                id,
                organizationId
            },
            include: {
                workspace: {
                    select: { id: true, name: true }
                },
                tasks: {
                    include: {
                        assignee: {
                            select: { id: true, name: true, email: true }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!project) {
            return res.status(404).json({
                error: `Project not found with id: ${id} in the current organization`
            });
        }

        const tasks = project.tasks || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "DONE").length;
        const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
        const todoTasks = tasks.filter((t) => t.status === "TODO").length;
        const inReviewTasks = tasks.filter((t) => t.status === "IN_REVIEW").length;
        const progressPercentage = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        res.json({
            ...project,
            metrics: {
                totalTasks,
                completedTasks,
                inProgressTasks,
                todoTasks,
                inReviewTasks,
                progressPercentage
            }
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/projects
async function createProject(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { name, description, workspaceId } = req.body;

        if (workspaceId) {
            const workspace = await prisma.workspace.findFirst({
                where: { id: workspaceId, organizationId }
            });
            if (!workspace) {
                return res.status(400).json({
                    error: `Workspace with id '${workspaceId}' does not exist in this organization.`
                });
            }
        }

        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                organizationId,
                workspaceId: workspaceId || null
            },
            include: {
                workspace: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json({
            ...project,
            taskCount: 0,
            completedTaskCount: 0,
            progress: 0,
            tasksByStatus: {
                TODO: 0,
                IN_PROGRESS: 0,
                IN_REVIEW: 0,
                DONE: 0,
                CANCELLED: 0
            },
            members: []
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/projects/:id
async function updateProject(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;
        const { name, description, workspaceId } = req.body;

        const existing = await prisma.project.findFirst({
            where: { id, organizationId }
        });

        if (!existing) {
            return res.status(404).json({
                error: `Project not found with id: ${id} in the current organization`
            });
        }

        if (workspaceId) {
            const workspace = await prisma.workspace.findFirst({
                where: { id: workspaceId, organizationId }
            });
            if (!workspace) {
                return res.status(400).json({
                    error: `Workspace with id '${workspaceId}' does not exist in this organization.`
                });
            }
        }

        const updateData = {};
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim() === "") {
                return res.status(400).json({
                    error: "Project name cannot be empty"
                });
            }
            updateData.name = name.trim();
        }
        if (description !== undefined) {
            updateData.description = description ? description.trim() : null;
        }
        if (workspaceId !== undefined) {
            updateData.workspaceId = workspaceId || null;
        }

        const updated = await prisma.project.update({
            where: { id },
            data: updateData,
            include: {
                workspace: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
}

// DELETE /api/projects/:id
async function deleteProject(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;

        const project = await prisma.project.findFirst({
            where: { id, organizationId }
        });

        if (!project) {
            return res.status(404).json({
                error: `Project not found with id: ${id} in the current organization`
            });
        }

        await prisma.project.delete({
            where: { id }
        });

        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
