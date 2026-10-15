const prisma = require("../config/prisma");

const ALLOWED_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

// GET /api/tasks
async function getTasks(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { projectId, status, assigneeId, search } = req.query;

        const where = { organizationId };

        if (projectId) {
            where.projectId = projectId;
        }

        if (status) {
            where.status = status;
        }

        if (assigneeId) {
            where.assigneeId = assigneeId;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ];
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                project: {
                    select: { id: true, name: true }
                },
                assignee: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({
            count: tasks.length,
            organizationId,
            tasks
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/tasks/:id
async function getTaskById(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;

        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId
            },
            include: {
                project: true,
                assignee: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!task) {
            return res.status(404).json({
                error: `Task not found with id: ${id} in the current organization`
            });
        }

        res.json(task);
    } catch (error) {
        next(error);
    }
}

// POST /api/tasks
async function createTask(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { title, description, projectId, assigneeId, status, dueDate } = req.body;

        // Verify project belongs to this organization
        const project = await prisma.project.findFirst({
            where: { id: projectId, organizationId }
        });

        if (!project) {
            return res.status(400).json({
                error: `Project with id '${projectId}' does not exist in this organization.`
            });
        }

        // Validate assignee if provided
        if (assigneeId) {
            const assignee = await prisma.user.findUnique({
                where: { id: assigneeId }
            });
            if (!assignee) {
                return res.status(400).json({
                    error: `Assignee with id '${assigneeId}' not found.`
                });
            }
        }

        const task = await prisma.task.create({
            data: {
                title: title.trim(),
                description: description ? description.trim() : null,
                organizationId,
                projectId,
                assigneeId: assigneeId || null,
                status: status || "TODO",
                dueDate: dueDate ? new Date(dueDate) : null
            },
            include: {
                project: {
                    select: { id: true, name: true }
                },
                assignee: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
}

// PATCH /api/tasks/:id
async function updateTask(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;
        const { title, description, status, assigneeId, dueDate } = req.body;

        const existing = await prisma.task.findFirst({
            where: { id, organizationId }
        });

        if (!existing) {
            return res.status(404).json({
                error: "Task not found in this organization"
            });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (status !== undefined) updateData.status = status;
        if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

        const updated = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                project: {
                    select: { id: true, name: true }
                },
                assignee: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;

        const task = await prisma.task.findFirst({
            where: { id, organizationId }
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found in this organization" });
        }

        await prisma.task.delete({
            where: { id }
        });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    ALLOWED_STATUSES
};
