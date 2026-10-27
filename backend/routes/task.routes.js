
const express = require("express");
const router = express.Router();

const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth.middleware");
const organizationMiddleware = require("../middleware/organization.middleware");

router.use(authMiddleware, organizationMiddleware);

// Allowed task values
const ALLOWED_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

// Check that the project belongs to the organization
// and that the user is allowed to access it.
async function getAuthorizedProject(projectId, req) {
    if (!projectId || typeof projectId !== "string") {
        return null;
    }

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId: req.organizationId
        }
    });

    if (!project) {
        return null;
    }

    const role = String(req.user.role || "").toLowerCase();

    // Owners and managers can access organization projects.
    if (role === "owner" || role === "manager") {
        return project;
    }

    // Other users must be project members.
    const userId = req.user.userId || req.user.id;

    if (!userId) {
        return null;
    }

    const membership = await prisma.projectMember.findFirst({
        where: {
            projectId: project.id,
            userId
        }
    });

    return membership ? project : null;
}

// POST /api/tasks — Create a task
router.post("/", async (req, res) => {
    try {
        const {
            projectId,
            title,
            status,
            priority,
            dueDate
        } = req.body;

        if (
            typeof projectId !== "string" ||
            !projectId.trim() ||
            typeof title !== "string" ||
            !title.trim()
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Project ID and task title are required"
            });
        }

        if (
            status !== undefined &&
            (
                typeof status !== "string" ||
                !ALLOWED_STATUSES.includes(status)
            )
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Status must be TODO, IN_PROGRESS, or DONE"
            });
        }

        if (
            priority !== undefined &&
            priority !== null &&
            (
                typeof priority !== "string" ||
                !ALLOWED_PRIORITIES.includes(priority)
            )
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Priority must be LOW, MEDIUM, or HIGH"
            });
        }

        let parsedDueDate = null;

        if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
            parsedDueDate = new Date(dueDate);

            if (Number.isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Invalid due date"
                });
            }
        }

        const project = await getAuthorizedProject(projectId, req);

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found or access denied"
            });
        }

        const task = await prisma.task.create({
            data: {
                organizationId: req.organizationId,
                projectId: project.id,
                title: title.trim(),
                status: status === undefined ? "TODO" : status,
                priority: priority === undefined ? null : priority,
                dueDate: parsedDueDate
            }
        });

        return res.status(201).json({
            status: "OK",
            message: "Task created successfully",
            task
        });
    } catch (error) {
        console.error("Create task error:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to create task"
        });
    }
});

// GET /api/tasks?projectId=...&status=TODO&priority=HIGH
// List tasks with optional status and priority filters
router.get("/", async (req, res) => {
    try {
        const { projectId, status, priority } = req.query;

        if (typeof projectId !== "string" || !projectId.trim()) {
            return res.status(400).json({
                status: "ERROR",
                message: "Project ID is required"
            });
        }

        if (
            status !== undefined &&
            (
                typeof status !== "string" ||
                !ALLOWED_STATUSES.includes(status)
            )
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Status must be TODO, IN_PROGRESS, or DONE"
            });
        }

        if (
            priority !== undefined &&
            (
                typeof priority !== "string" ||
                !ALLOWED_PRIORITIES.includes(priority)
            )
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "Priority must be LOW, MEDIUM, or HIGH"
            });
        }

        const project = await getAuthorizedProject(projectId, req);

        if (!project) {
            return res.status(404).json({
                status: "ERROR",
                message: "Project not found or access denied"
            });
        }

        const tasks = await prisma.task.findMany({
            where: {
                organizationId: req.organizationId,
                projectId: project.id,
                ...(status ? { status } : {}),
                ...(priority ? { priority } : {})
            },
            orderBy: {
                title: "asc"
            }
        });

        return res.json({
            status: "OK",
            count: tasks.length,
            tasks
        });
    } catch (error) {
        console.error("List tasks error:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to retrieve tasks"
        });
    }
});

// PUT /api/tasks/:id — Update a task
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, priority, dueDate } = req.body;

        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Task not found or access denied"
            });
        }

        const project = await getAuthorizedProject(task.projectId, req);

        if (!project) {
            return res.status(403).json({
                status: "ERROR",
                message: "You are not authorized to update this task"
            });
        }

        const data = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Title must be a non-empty string"
                });
            }

            data.title = title.trim();
        }

        if (status !== undefined) {
            if (
                typeof status !== "string" ||
                !ALLOWED_STATUSES.includes(status)
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Status must be TODO, IN_PROGRESS, or DONE"
                });
            }

            data.status = status;
        }

        if (priority !== undefined) {
            if (
                priority !== null &&
                (
                    typeof priority !== "string" ||
                    !ALLOWED_PRIORITIES.includes(priority)
                )
            ) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Priority must be LOW, MEDIUM, or HIGH, or null"
                });
            }

            data.priority = priority;
        }

        if (dueDate !== undefined) {
            if (dueDate === null || dueDate === "") {
                data.dueDate = null;
            } else {
                const parsedDate = new Date(dueDate);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        status: "ERROR",
                        message: "Invalid due date"
                    });
                }

                data.dueDate = parsedDate;
            }
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                status: "ERROR",
                message: "Provide at least one field to update"
            });
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data
        });

        return res.json({
            status: "OK",
            message: "Task updated successfully",
            task: updatedTask
        });
    } catch (error) {
        console.error("Update task error:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to update task"
        });
    }
});

// DELETE /api/tasks/:id — Delete a task
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Task not found or access denied"
            });
        }

        const project = await getAuthorizedProject(task.projectId, req);

        if (!project) {
            return res.status(403).json({
                status: "ERROR",
                message: "You are not authorized to delete this task"
            });
        }

        await prisma.task.delete({
            where: { id }
        });

        return res.json({
            status: "OK",
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error("Delete task error:", error);

        return res.status(500).json({
            status: "ERROR",
            message: "Failed to delete task"
        });
    }
});

module.exports = router;
