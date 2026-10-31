const express = require("express");
const router = express.Router();

const prisma = require("../lib/prisma");

const authMiddleware = require("../middleware/auth.middleware");
const organizationMiddleware = require("../middleware/organization.middleware");

router.use(authMiddleware, organizationMiddleware);

const ALLOWED_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function isManagerOrOwner(role) {
    const r = String(role || "").toLowerCase();
    return r === "owner" || r === "manager";
}

function calculateSubtaskProgress(subtasks) {
    if (!Array.isArray(subtasks) || subtasks.length === 0) {
        return { total: 0, completed: 0, percentage: 0 };
    }
    const total = subtasks.length;
    const completed = subtasks.filter(s => s.isCompleted || s.status === "DONE").length;
    return {
        total,
        completed,
        percentage: Math.round((completed / total) * 100)
    };
}

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

    const role = req.user.role;
    if (isManagerOrOwner(role)) {
        return project;
    }

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
        let { projectId, title, description, status, priority, dueDate, assigneeId, orderIndex, labels, subtasks } = req.body;

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                status: "ERROR",
                message: "Title is required"
            });
        }

        if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
            const defaultProj = await prisma.project.findFirst({
                where: { organizationId: req.organizationId }
            });
            if (defaultProj) {
                projectId = defaultProj.id;
            } else {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Project ID is required"
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

        let taskStatus = status ? String(status).toUpperCase() : "TODO";
        if (!ALLOWED_STATUSES.includes(taskStatus)) {
            return res.status(400).json({
                status: "ERROR",
                message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`
            });
        }

        let taskPriority = priority ? String(priority).toUpperCase() : "MEDIUM";
        if (priority !== null && priority !== undefined) {
            if (!ALLOWED_PRIORITIES.includes(taskPriority)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}`
                });
            }
        } else {
            taskPriority = null;
        }

        let parsedDueDate = null;
        if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
            parsedDueDate = new Date(dueDate);
            if (Number.isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Invalid due date format"
                });
            }
        }

        let validAssigneeId = null;
        if (assigneeId && typeof assigneeId === "string" && assigneeId !== "UNASSIGNED") {
            const orgMembership = await prisma.membership.findFirst({
                where: {
                    userId: assigneeId,
                    organizationId: req.organizationId
                }
            });
            if (!orgMembership) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Assignee does not belong to your organization"
                });
            }

            const projectMember = await prisma.projectMember.findFirst({
                where: {
                    projectId: project.id,
                    userId: assigneeId
                }
            });
            if (!projectMember) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Assignee is not a member of this project"
                });
            }
            validAssigneeId = assigneeId;
        }

        const task = await prisma.task.create({
            data: {
                organizationId: req.organizationId,
                projectId: project.id,
                title: title.trim(),
                description: typeof description === "string" ? description.trim() : null,
                status: taskStatus,
                priority: taskPriority,
                orderIndex: typeof orderIndex === "number" ? orderIndex : 0,
                assigneeId: validAssigneeId,
                dueDate: parsedDueDate
            }
        });

        let createdSubtasks = [];
        if (Array.isArray(subtasks)) {
            for (const st of subtasks) {
                if (st && st.title && typeof st.title === "string") {
                    const sub = await prisma.subtask.create({
                        data: {
                            taskId: task.id,
                            title: st.title.trim(),
                            isCompleted: Boolean(st.isCompleted),
                            status: st.isCompleted ? "DONE" : "TODO"
                        }
                    });
                    createdSubtasks.push(sub);
                }
            }
        }

        let createdLabels = [];
        if (Array.isArray(labels)) {
            for (const lName of labels) {
                if (typeof lName === "string" && lName.trim()) {
                    const cleanName = lName.trim().toLowerCase();
                    let lbl = await prisma.label.findFirst({ where: { name: cleanName } });
                    if (!lbl) {
                        lbl = await prisma.label.create({ data: { name: cleanName } });
                    }
                    await prisma.taskLabel.create({
                        data: { taskId: task.id, labelId: lbl.id }
                    });
                    createdLabels.push(cleanName);
                }
            }
        }

        return res.status(201).json({
            status: "OK",
            message: "Task created successfully",
            task: {
                ...task,
                subtasks: createdSubtasks,
                labels: createdLabels,
                subtaskProgress: calculateSubtaskProgress(createdSubtasks)
            }
        });
    } catch (error) {
        console.error("Create task error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to create task"
        });
    }
});

// GET /api/tasks — List tasks with filters
router.get("/", async (req, res) => {
    try {
        const { projectId, status, priority, assigneeId, label, search, overdueOnly, due } = req.query;

        let targetProjectId = null;
        if (projectId && typeof projectId === "string" && projectId.trim()) {
            const project = await getAuthorizedProject(projectId.trim(), req);
            if (!project) {
                return res.status(404).json({
                    status: "ERROR",
                    message: "Project not found or access denied"
                });
            }
            targetProjectId = project.id;
        }

        let statusFilter = undefined;
        if (status && status !== "ALL") {
            const norm = String(status).toUpperCase();
            if (!ALLOWED_STATUSES.includes(norm)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: `Invalid status '${status}'`
                });
            }
            statusFilter = norm;
        }

        let priorityFilter = undefined;
        if (priority && priority !== "ALL") {
            const norm = String(priority).toUpperCase();
            if (!ALLOWED_PRIORITIES.includes(norm)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: `Invalid priority '${priority}'`
                });
            }
            priorityFilter = norm;
        }

        const tasks = await prisma.task.findMany({
            where: {
                organizationId: req.organizationId,
                ...(targetProjectId ? { projectId: targetProjectId } : {}),
                ...(statusFilter ? { status: statusFilter } : {}),
                ...(priorityFilter ? { priority: priorityFilter } : {})
            },
            include: {
                subtasks: true,
                taskLabels: { include: { label: true } },
                assignee: true
            },
            orderBy: {
                orderIndex: "asc"
            }
        });

        let filtered = tasks;

        if (assigneeId && assigneeId !== "ALL") {
            if (assigneeId === "UNASSIGNED") {
                filtered = filtered.filter(t => !t.assigneeId);
            } else {
                filtered = filtered.filter(t => t.assigneeId === assigneeId);
            }
        }

        if (label && label !== "ALL") {
            const targetLabel = String(label).toLowerCase();
            filtered = filtered.filter(t =>
                t.taskLabels && t.taskLabels.some(tl => tl.label && tl.label.name === targetLabel)
            );
        }

        if (overdueOnly === "true" || overdueOnly === true || due === "overdue") {
            const now = new Date();
            filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE");
        }

        if (search && typeof search === "string" && search.trim()) {
            const q = search.trim().toLowerCase();
            filtered = filtered.filter(t =>
                (t.title && t.title.toLowerCase().includes(q)) ||
                (t.description && t.description.toLowerCase().includes(q))
            );
        }

        const formattedTasks = filtered.map(t => {
            const labelsList = (t.taskLabels || []).map(tl => tl.label ? tl.label.name : null).filter(Boolean);
            return {
                ...t,
                labels: labelsList,
                subtaskProgress: calculateSubtaskProgress(t.subtasks)
            };
        });

        return res.json({
            status: "OK",
            count: formattedTasks.length,
            tasks: formattedTasks
        });
    } catch (error) {
        console.error("List tasks error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to retrieve tasks"
        });
    }
});

// GET /api/tasks/:id — Get single task
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId: req.organizationId
            },
            include: {
                subtasks: true,
                taskLabels: { include: { label: true } },
                assignee: true
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
                message: "You are not authorized to view this task"
            });
        }

        const labelsList = (task.taskLabels || []).map(tl => tl.label ? tl.label.name : null).filter(Boolean);

        return res.json({
            status: "OK",
            task: {
                ...task,
                labels: labelsList,
                subtaskProgress: calculateSubtaskProgress(task.subtasks)
            }
        });
    } catch (error) {
        console.error("Get task error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to retrieve task"
        });
    }
});

const updateTaskHandler = async (req, res) => {
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
                message: "You are not authorized to update this task"
            });
        }

        const { title, description, status, priority, dueDate, assigneeId, orderIndex, labels } = req.body;
        const data = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({
                    status: "ERROR",
                    message: "Title cannot be empty"
                });
            }
            data.title = title.trim();
        }

        if (description !== undefined) {
            data.description = typeof description === "string" ? description.trim() : null;
        }

        if (status !== undefined) {
            const normStatus = String(status).toUpperCase();
            if (!ALLOWED_STATUSES.includes(normStatus)) {
                return res.status(400).json({
                    status: "ERROR",
                    message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`
                });
            }
            data.status = normStatus;
        }

        if (priority !== undefined) {
            if (priority !== null) {
                const normPriority = String(priority).toUpperCase();
                if (!ALLOWED_PRIORITIES.includes(normPriority)) {
                    return res.status(400).json({
                        status: "ERROR",
                        message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(", ")}`
                    });
                }
                data.priority = normPriority;
            } else {
                data.priority = null;
            }
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

        if (assigneeId !== undefined) {
            if (assigneeId === null || assigneeId === "UNASSIGNED" || assigneeId === "") {
                data.assigneeId = null;
            } else {
                const orgMembership = await prisma.membership.findFirst({
                    where: {
                        userId: assigneeId,
                        organizationId: req.organizationId
                    }
                });
                if (!orgMembership) {
                    return res.status(400).json({
                        status: "ERROR",
                        message: "Assignee does not belong to your organization"
                    });
                }

                const projectMember = await prisma.projectMember.findFirst({
                    where: {
                        projectId: project.id,
                        userId: assigneeId
                    }
                });
                if (!projectMember) {
                    return res.status(400).json({
                        status: "ERROR",
                        message: "Assignee is not a member of this project"
                    });
                }
                data.assigneeId = assigneeId;
            }
        }

        if (orderIndex !== undefined && typeof orderIndex === "number") {
            data.orderIndex = orderIndex;
        }

        await prisma.task.update({
            where: { id },
            data
        });

        if (Array.isArray(labels)) {
            await prisma.taskLabel.deleteMany({ where: { taskId: id } });
            for (const lName of labels) {
                if (typeof lName === "string" && lName.trim()) {
                    const clean = lName.trim().toLowerCase();
                    let lbl = await prisma.label.findFirst({ where: { name: clean } });
                    if (!lbl) {
                        lbl = await prisma.label.create({ data: { name: clean } });
                    }
                    await prisma.taskLabel.create({
                        data: { taskId: id, labelId: lbl.id }
                    });
                }
            }
        }

        const refreshed = await prisma.task.findFirst({
            where: { id },
            include: {
                subtasks: true,
                taskLabels: { include: { label: true } },
                assignee: true
            }
        });

        const labelsList = (refreshed.taskLabels || []).map(tl => tl.label ? tl.label.name : null).filter(Boolean);

        return res.json({
            status: "OK",
            message: "Task updated successfully",
            task: {
                ...refreshed,
                labels: labelsList,
                subtaskProgress: calculateSubtaskProgress(refreshed.subtasks)
            }
        });
    } catch (error) {
        console.error("Update task error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to update task"
        });
    }
};

router.put("/:id", updateTaskHandler);
router.patch("/:id", updateTaskHandler);

// PATCH /api/tasks/:id/status — Dedicated Kanban fast status move endpoint
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, orderIndex } = req.body;

        if (!status) {
            return res.status(400).json({
                status: "ERROR",
                message: "Status is required"
            });
        }

        const normStatus = String(status).toUpperCase();
        if (!ALLOWED_STATUSES.includes(normStatus)) {
            return res.status(400).json({
                status: "ERROR",
                message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`
            });
        }

        const task = await prisma.task.findFirst({
            where: { id, organizationId: req.organizationId }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Task not found"
            });
        }

        const project = await getAuthorizedProject(task.projectId, req);
        if (!project) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden: You are not authorized to move this task"
            });
        }

        const data = { status: normStatus };
        if (typeof orderIndex === "number") {
            data.orderIndex = orderIndex;
        }

        const updated = await prisma.task.update({
            where: { id },
            data
        });

        return res.json({
            status: "OK",
            message: "Task status moved successfully",
            task: updated
        });
    } catch (error) {
        console.error("Update task status error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to update task status"
        });
    }
});

// DELETE /api/tasks/:id — Delete task
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

        const role = req.user.role;
        if (!isManagerOrOwner(role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "Forbidden: Only managers and organization owners can delete tasks"
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

// SUBTASK ENDPOINTS
router.post("/:id/subtasks", async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                status: "ERROR",
                message: "Subtask title is required"
            });
        }

        const task = await prisma.task.findFirst({
            where: { id, organizationId: req.organizationId }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Parent task not found"
            });
        }

        const project = await getAuthorizedProject(task.projectId, req);
        if (!project) {
            return res.status(403).json({
                status: "ERROR",
                message: "Unauthorized access to project task"
            });
        }

        const subtask = await prisma.subtask.create({
            data: {
                taskId: task.id,
                title: title.trim(),
                isCompleted: false,
                status: "TODO"
            }
        });

        return res.status(201).json({
            status: "OK",
            message: "Subtask created successfully",
            subtask
        });
    } catch (error) {
        console.error("Add subtask error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to create subtask"
        });
    }
});

router.patch("/:id/subtasks/:subtaskId", async (req, res) => {
    try {
        const { id, subtaskId } = req.params;
        const { isCompleted, title, status } = req.body;

        const task = await prisma.task.findFirst({
            where: { id, organizationId: req.organizationId }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Parent task not found"
            });
        }

        const subtask = await prisma.subtask.findFirst({
            where: { id: subtaskId, taskId: task.id }
        });

        if (!subtask) {
            return res.status(404).json({
                status: "ERROR",
                message: "Subtask not found"
            });
        }

        const data = {};
        if (title !== undefined && typeof title === "string" && title.trim()) {
            data.title = title.trim();
        }
        if (isCompleted !== undefined) {
            data.isCompleted = Boolean(isCompleted);
            data.status = isCompleted ? "DONE" : "TODO";
        } else if (status !== undefined) {
            data.status = String(status).toUpperCase();
            data.isCompleted = data.status === "DONE";
        }

        const updated = await prisma.subtask.update({
            where: { id: subtaskId },
            data
        });

        return res.json({
            status: "OK",
            message: "Subtask updated successfully",
            subtask: updated
        });
    } catch (error) {
        console.error("Update subtask error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to update subtask"
        });
    }
});

router.delete("/:id/subtasks/:subtaskId", async (req, res) => {
    try {
        const { id, subtaskId } = req.params;

        const task = await prisma.task.findFirst({
            where: { id, organizationId: req.organizationId }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Parent task not found"
            });
        }

        const subtask = await prisma.subtask.findFirst({
            where: { id: subtaskId, taskId: task.id }
        });

        if (!subtask) {
            return res.status(404).json({
                status: "ERROR",
                message: "Subtask not found"
            });
        }

        await prisma.subtask.delete({
            where: { id: subtaskId }
        });

        return res.json({
            status: "OK",
            message: "Subtask deleted successfully"
        });
    } catch (error) {
        console.error("Delete subtask error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to delete subtask"
        });
    }
});

// LABELS ENDPOINTS
router.post("/:id/labels", async (req, res) => {
    try {
        const { id } = req.params;
        const { label } = req.body;

        if (!label || typeof label !== "string" || !label.trim()) {
            return res.status(400).json({
                status: "ERROR",
                message: "Label name is required"
            });
        }

        const task = await prisma.task.findFirst({
            where: { id, organizationId: req.organizationId }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Task not found"
            });
        }

        const clean = label.trim().toLowerCase();
        let lbl = await prisma.label.findFirst({ where: { name: clean } });
        if (!lbl) {
            lbl = await prisma.label.create({ data: { name: clean } });
        }

        const existing = await prisma.taskLabel.findFirst({
            where: { taskId: task.id, labelId: lbl.id }
        });

        if (!existing) {
            await prisma.taskLabel.create({
                data: { taskId: task.id, labelId: lbl.id }
            });
        }

        return res.status(201).json({
            status: "OK",
            message: "Label attached successfully",
            label: clean
        });
    } catch (error) {
        console.error("Add task label error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to attach label"
        });
    }
});

router.delete("/:id/labels/:labelName", async (req, res) => {
    try {
        const { id, labelName } = req.params;

        const task = await prisma.task.findFirst({
            where: { id, organizationId: req.organizationId }
        });

        if (!task) {
            return res.status(404).json({
                status: "ERROR",
                message: "Task not found"
            });
        }

        const lbl = await prisma.label.findFirst({
            where: { name: labelName.trim().toLowerCase() }
        });

        if (lbl) {
            await prisma.taskLabel.deleteMany({
                where: { taskId: task.id, labelId: lbl.id }
            });
        }

        return res.json({
            status: "OK",
            message: "Label removed successfully"
        });
    } catch (error) {
        console.error("Remove task label error:", error);
        return res.status(500).json({
            status: "ERROR",
            message: "Failed to remove label"
        });
    }
});

module.exports = router;
