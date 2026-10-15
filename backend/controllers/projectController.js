const prisma = require("../config/prisma");

// GET /api/projects
async function getProjects(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { workspaceId, search } = req.query;

        const where = { organizationId };

        if (workspaceId) {
            where.workspaceId = workspaceId;
        }

        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                workspace: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { tasks: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({
            count: projects.length,
            organizationId,
            projects
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
                workspace: true,
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

        res.json(project);
    } catch (error) {
        next(error);
    }
}

// POST /api/projects
async function createProject(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { name, description, workspaceId } = req.body;

        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                organizationId,
                workspaceId: workspaceId || null
            },
            include: {
                workspace: true
            }
        });

        res.status(201).json(project);
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
            return res.status(404).json({ error: "Project not found in this organization" });
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
    deleteProject
};
