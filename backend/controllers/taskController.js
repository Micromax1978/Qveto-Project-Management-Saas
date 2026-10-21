const prisma = require("../config/prisma");

const ALLOWED_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// Normalize status alias (e.g. "inProgress" -> "IN_PROGRESS")
function normalizeStatusValue(status) {
    if (!status || typeof status !== "string") return status;
    const clean = status.trim().toUpperCase().replace(/[- ]/g, "_");
    if (clean === "INPROGRESS") return "IN_PROGRESS";
    if (clean === "INREVIEW") return "IN_REVIEW";
    if (clean === "CANCELED") return "CANCELLED";
    return clean;
}

// Normalize priority alias (e.g. "Normal" -> "MEDIUM")
function normalizePriorityValue(priority) {
    if (!priority || typeof priority !== "string") return priority;
    const clean = priority.trim().toUpperCase();
    if (clean === "NORMAL") return "MEDIUM";
    return clean;
}

function getInitials(name) {
    if (!name || typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function enrichTask(task) {
    if (!task) return null;
    const enriched = { ...task };
    if (enriched.assignee) {
        enriched.assignee = {
            ...enriched.assignee,
            initials: getInitials(enriched.assignee.name)
        };
    }
    return enriched;
}

// Quick date helper for preset due date filters
function parseQuickDate(due) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (due.toLowerCase()) {
        case "today":
            return { gte: startOfToday, lte: endOfToday };
        case "tomorrow": {
            const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
            const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);
            return { gte: startOfTomorrow, lte: endOfTomorrow };
        }
        case "this_week": {
            const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
            return { gte: startOfToday, lte: endOfWeek };
        }
        case "overdue":
            return { lt: startOfToday };
        default:
            return null;
    }
}

// GET /api/tasks
async function getTasks(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const {
            projectId,
            status,
            assigneeId,
            priority,
            due,
            dueDateFrom,
            dueDateTo,
            label,
            search,
            view,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        const where = { organizationId };

        // 1. Project Filter
        if (projectId) {
            where.projectId = projectId;
        }

        // 2. Status Filter (supports single status or comma-separated list)
        if (status) {
            const rawStatuses = status.split(",").map((s) => normalizeStatusValue(s));
            const validStatuses = rawStatuses.filter((s) => ALLOWED_STATUSES.includes(s));
            if (validStatuses.length === 1) {
                where.status = validStatuses[0];
            } else if (validStatuses.length > 1) {
                where.status = { in: validStatuses };
            }
        }

        // 3. Assignee Filter (supports UUID or "unassigned")
        if (assigneeId !== undefined && assigneeId !== "") {
            if (assigneeId.toLowerCase() === "unassigned" || assigneeId === "null") {
                where.assigneeId = null;
            } else {
                where.assigneeId = assigneeId;
            }
        }

        // 4. Priority Filter (supports single or comma-separated)
        if (priority) {
            const rawPriorities = priority.split(",").map((p) => normalizePriorityValue(p));
            const validPriorities = rawPriorities.filter((p) => ALLOWED_PRIORITIES.includes(p));
            if (validPriorities.length === 1) {
                where.priority = validPriorities[0];
            } else if (validPriorities.length > 1) {
                where.priority = { in: validPriorities };
            }
        }

        // 5. Label / Category Filter
        if (label) {
            where.label = { contains: label.trim(), mode: "insensitive" };
        }

        // 6. Due Date Filters
        if (due) {
            const dateRange = parseQuickDate(due);
            if (dateRange) {
                where.dueDate = dateRange;
                if (due.toLowerCase() === "overdue") {
                    // Overdue tasks should exclude completed or cancelled tasks
                    if (!where.status) {
                        where.status = { notIn: ["DONE", "CANCELLED"] };
                    }
                }
            }
        } else if (dueDateFrom || dueDateTo) {
            where.dueDate = {};
            if (dueDateFrom) {
                const fromDate = new Date(dueDateFrom);
                if (!isNaN(fromDate.getTime())) {
                    where.dueDate.gte = fromDate;
                }
            }
            if (dueDateTo) {
                const toDate = new Date(dueDateTo);
                if (!isNaN(toDate.getTime())) {
                    where.dueDate.lte = toDate;
                }
            }
        }

        // 7. Full-text Search across Title and Description
        if (search) {
            const term = search.trim();
            where.OR = [
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } }
            ];
        }

        // 8. Sorting
        const validSortFields = ["createdAt", "updatedAt", "dueDate", "title", "status", "priority"];
        const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
        const orderDirection = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

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
            orderBy: { [orderField]: orderDirection }
        });

        const enrichedTasks = tasks.map(enrichTask);

        // 9. Kanban Board View Support
        if (view === "kanban") {
            const columns = {
                todo: {
                    key: "todo",
                    label: "TO DO",
                    count: 0,
                    tasks: []
                },
                inProgress: {
                    key: "inProgress",
                    label: "IN PROGRESS",
                    count: 0,
                    tasks: []
                },
                inReview: {
                    key: "inReview",
                    label: "IN REVIEW",
                    count: 0,
                    tasks: []
                },
                done: {
                    key: "done",
                    label: "DONE",
                    count: 0,
                    tasks: []
                }
            };

            for (const task of enrichedTasks) {
                if (task.status === "TODO") {
                    columns.todo.tasks.push(task);
                    columns.todo.count++;
                } else if (task.status === "IN_PROGRESS") {
                    columns.inProgress.tasks.push(task);
                    columns.inProgress.count++;
                } else if (task.status === "IN_REVIEW") {
                    columns.inReview.tasks.push(task);
                    columns.inReview.count++;
                } else if (task.status === "DONE") {
                    columns.done.tasks.push(task);
                    columns.done.count++;
                }
            }

            return res.json({
                organizationId,
                totalCount: enrichedTasks.length,
                columns
            });
        }

        res.json({
            count: enrichedTasks.length,
            organizationId,
            tasks: enrichedTasks
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
                project: {
                    select: { id: true, name: true, workspaceId: true }
                },
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

        res.json(enrichTask(task));
    } catch (error) {
        next(error);
    }
}

// POST /api/tasks
async function createTask(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { title, description, projectId, assigneeId, status, priority, label, dueDate } = req.body;

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

        // Validate dueDate format if provided
        let parsedDueDate = null;
        if (dueDate) {
            parsedDueDate = new Date(dueDate);
            if (isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({
                    error: "Invalid dueDate format. Please provide a valid ISO-8601 date string."
                });
            }
        }

        const normalizedStatus = status ? normalizeStatusValue(status) : "TODO";
        const normalizedPriority = priority ? normalizePriorityValue(priority) : "MEDIUM";

        const task = await prisma.task.create({
            data: {
                title: title.trim(),
                description: description ? description.trim() : null,
                organizationId,
                projectId,
                assigneeId: assigneeId || null,
                status: normalizedStatus,
                priority: normalizedPriority,
                label: label ? label.trim() : null,
                dueDate: parsedDueDate
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

        res.status(201).json(enrichTask(task));
    } catch (error) {
        next(error);
    }
}

// PATCH /api/tasks/:id
async function updateTask(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;
        const { title, description, status, priority, label, assigneeId, dueDate, projectId } = req.body;

        const existing = await prisma.task.findFirst({
            where: { id, organizationId }
        });

        if (!existing) {
            return res.status(404).json({
                error: `Task not found with id: ${id} in the current organization`
            });
        }

        const updateData = {};

        if (title !== undefined) {
            if (typeof title !== "string" || title.trim() === "") {
                return res.status(400).json({
                    error: "Task title cannot be empty"
                });
            }
            updateData.title = title.trim();
        }

        if (description !== undefined) {
            updateData.description = description ? description.trim() : null;
        }

        if (status !== undefined) {
            const normalizedStatus = normalizeStatusValue(status);
            if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
                return res.status(400).json({
                    error: `Invalid value for 'status'. Allowed values: ${ALLOWED_STATUSES.join(", ")}`
                });
            }
            updateData.status = normalizedStatus;
        }

        if (priority !== undefined) {
            const normalizedPriority = normalizePriorityValue(priority);
            if (!ALLOWED_PRIORITIES.includes(normalizedPriority)) {
                return res.status(400).json({
                    error: `Invalid value for 'priority'. Allowed values: ${ALLOWED_PRIORITIES.join(", ")}`
                });
            }
            updateData.priority = normalizedPriority;
        }

        if (label !== undefined) {
            updateData.label = label ? label.trim() : null;
        }

        if (assigneeId !== undefined) {
            if (assigneeId && assigneeId !== "unassigned") {
                const assignee = await prisma.user.findUnique({
                    where: { id: assigneeId }
                });
                if (!assignee) {
                    return res.status(400).json({
                        error: `Assignee with id '${assigneeId}' not found.`
                    });
                }
                updateData.assigneeId = assigneeId;
            } else {
                updateData.assigneeId = null;
            }
        }

        if (projectId !== undefined) {
            const project = await prisma.project.findFirst({
                where: { id: projectId, organizationId }
            });
            if (!project) {
                return res.status(400).json({
                    error: `Project with id '${projectId}' does not exist in this organization.`
                });
            }
            updateData.projectId = projectId;
        }

        if (dueDate !== undefined) {
            if (dueDate === null || dueDate === "") {
                updateData.dueDate = null;
            } else {
                const parsedDueDate = new Date(dueDate);
                if (isNaN(parsedDueDate.getTime())) {
                    return res.status(400).json({
                        error: "Invalid dueDate format. Please provide a valid ISO-8601 date string."
                    });
                }
                updateData.dueDate = parsedDueDate;
            }
        }

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

        res.json(enrichTask(updated));
    } catch (error) {
        next(error);
    }
}

// PATCH /api/tasks/:id/status (Dedicated Kanban Move Endpoint)
async function updateTaskStatus(req, res, next) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                error: "Missing required field: status"
            });
        }

        const normalizedStatus = normalizeStatusValue(status);
        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
            return res.status(400).json({
                error: `Invalid value for 'status'. Allowed values: ${ALLOWED_STATUSES.join(", ")}`
            });
        }

        const existing = await prisma.task.findFirst({
            where: { id, organizationId }
        });

        if (!existing) {
            return res.status(404).json({
                error: `Task not found with id: ${id} in the current organization`
            });
        }

        const updated = await prisma.task.update({
            where: { id },
            data: { status: normalizedStatus },
            include: {
                project: {
                    select: { id: true, name: true }
                },
                assignee: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json(enrichTask(updated));
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
            return res.status(404).json({
                error: `Task not found with id: ${id} in the current organization`
            });
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
    updateTaskStatus,
    deleteTask,
    ALLOWED_STATUSES,
    ALLOWED_PRIORITIES,
    normalizeStatusValue,
    normalizePriorityValue
};
