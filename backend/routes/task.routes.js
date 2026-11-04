const express = require("express");
const prisma = require("../lib/prisma");
const logger = require("../lib/logger");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const { HttpError } = require("../lib/errors");
const {
    STATUSES,
    PRIORITIES,
    SUBTASK_STATUSES,
    canTransition
} = require("../lib/constants");
const {
    getAccessibleProject,
    accessibleProjectIds,
    getAuthorizedTask,
    assertAssignable,
    assertId
} = require("../lib/access");
const {
    requireString,
    optionalString,
    assertEnum,
    parseDueDate,
    isOverdue,
    parsePagination,
    queryString,
    normalizeLabelName,
    optionalHexColor
} = require("../lib/validation");
const { removeStoredFile } = require("../lib/storage");
const { logActivity } = require("../services/activity.service");
const { notifyUsers } = require("../services/notification.service");

const router = express.Router();

router.use(authenticateToken, requireOrganization);

const MAX_LABELS_PER_TASK = 10;
const MAX_SUBTASKS_PER_TASK = 50;
const SORT_FIELDS = ["position", "dueDate", "createdAt", "updatedAt", "title"];

const userSummary = { select: { id: true, name: true, email: true } };

const listInclude = {
    assignee: userSummary,
    taskLabels: { include: { label: true } },
    subtasks: { select: { id: true, status: true } },
    _count: { select: { comments: true, attachments: true } }
};

const detailInclude = {
    assignee: userSummary,
    taskLabels: { include: { label: true } },
    subtasks: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    _count: { select: { comments: true, attachments: true } }
};

// Flatten labels, add counts and the computed isOverdue flag.
function serializeTask(task, { withSubtasks = false, now = new Date() } = {}) {
    const { taskLabels, subtasks, _count, ...rest } = task;

    return {
        ...rest,
        labels: (taskLabels || []).map((entry) => entry.label),
        ...(withSubtasks ? { subtasks: subtasks || [] } : {}),
        subtaskTotal: (subtasks || []).length,
        subtaskDone: (subtasks || []).filter((subtask) => subtask.status === "DONE").length,
        commentCount: _count ? _count.comments : 0,
        attachmentCount: _count ? _count.attachments : 0,
        isOverdue: isOverdue(task, now)
    };
}

async function loadTask(id, { detail = false } = {}) {
    const task = await prisma.task.findUnique({
        where: { id },
        include: detail ? detailInclude : listInclude
    });

    return serializeTask(task, { withSubtasks: detail });
}

async function getOrCreateLabel(organizationId, name, color) {
    const find = () => prisma.label.findFirst({
        where: { organizationId, name: { equals: name, mode: "insensitive" } }
    });

    const existing = await find();

    if (existing) {
        return existing;
    }

    try {
        return await prisma.label.create({
            data: { organizationId, name, ...(color ? { color } : {}) }
        });
    } catch (error) {
        // Another request created the same label first.
        if (error.code === "P2002") {
            const again = await find();

            if (again) {
                return again;
            }
        }

        throw error;
    }
}

function parseLabelNames(value) {
    if (value === undefined) {
        return [];
    }

    if (!Array.isArray(value) || value.length > MAX_LABELS_PER_TASK) {
        throw new HttpError(400, `labels must be an array of at most ${MAX_LABELS_PER_TASK} label names`);
    }

    const seen = new Set();
    const names = [];

    for (const raw of value) {
        const name = normalizeLabelName(raw);

        if (!seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            names.push(name);
        }
    }

    return names;
}

function parseVersion(value, fallback) {
    if (value === undefined) {
        return fallback;
    }

    if (!Number.isInteger(value) || value < 1) {
        throw new HttpError(400, "version must be a positive integer");
    }

    return value;
}

function versionConflict() {
    return new HttpError(
        409,
        "This task was changed by someone else. Reload it and try again.",
        { code: "VERSION_CONFLICT" }
    );
}

// Validates a status change and returns the data fields to write.
// A moved task is appended to the end of the target column.
async function prepareStatusChange(task, newStatus, req) {
    if (!canTransition(task.status, newStatus, req.isManager)) {
        if (task.status === "DONE" && !req.isManager) {
            throw new HttpError(403, "Only owners and managers can re-open a completed task");
        }

        throw new HttpError(400, "Invalid status transition");
    }

    const aggregate = await prisma.task.aggregate({
        where: { projectId: task.projectId, status: newStatus },
        _max: { position: true }
    });

    return {
        status: newStatus,
        position: (aggregate._max.position ?? -1) + 1,
        completedAt: newStatus === "DONE" ? new Date() : null
    };
}

// Records activity events and notifications by comparing a task before/after a change.
async function recordTaskChanges(req, before, after) {
    const base = {
        organizationId: req.organizationId,
        projectId: after.projectId,
        taskId: after.id,
        actorId: req.userId
    };

    if (before.status !== after.status) {
        await logActivity({
            ...base,
            type: "TASK_STATUS_CHANGED",
            message: `${req.userName} moved "${after.title}" from ${before.status} to ${after.status}`,
            metadata: { from: before.status, to: after.status }
        });

        await notifyUsers({
            organizationId: req.organizationId,
            userIds: [after.assigneeId, after.createdById],
            type: "TASK_STATUS_CHANGED",
            message: `"${after.title}" moved from ${before.status} to ${after.status}`,
            taskId: after.id,
            projectId: after.projectId,
            excludeUserId: req.userId
        });
    }

    if (before.assigneeId !== after.assigneeId) {
        if (after.assigneeId) {
            await logActivity({
                ...base,
                type: "TASK_ASSIGNED",
                message: `${req.userName} assigned "${after.title}"`,
                metadata: { assigneeId: after.assigneeId, previousAssigneeId: before.assigneeId }
            });

            await notifyUsers({
                organizationId: req.organizationId,
                userIds: [after.assigneeId],
                type: "TASK_ASSIGNED",
                message: `You were assigned to "${after.title}"`,
                taskId: after.id,
                projectId: after.projectId,
                excludeUserId: req.userId
            });
        } else {
            await logActivity({
                ...base,
                type: "TASK_UNASSIGNED",
                message: `${req.userName} unassigned "${after.title}"`,
                metadata: { previousAssigneeId: before.assigneeId }
            });
        }
    }

    const changedFields = ["title", "description", "priority"].filter((field) => before[field] !== after[field]);

    const beforeDue = before.dueDate ? before.dueDate.getTime() : null;
    const afterDue = after.dueDate ? after.dueDate.getTime() : null;

    if (beforeDue !== afterDue) {
        changedFields.push("dueDate");
    }

    if (changedFields.length > 0) {
        await logActivity({
            ...base,
            type: "TASK_UPDATED",
            message: `${req.userName} updated ${changedFields.join(", ")} on "${after.title}"`,
            metadata: { fields: changedFields }
        });
    }
}

// Shared by GET /api/tasks and GET /api/tasks/overdue.
async function listTasks(req, res, { overdueOnly = false } = {}) {
    const query = req.query;
    const now = new Date();
    const where = { organizationId: req.organizationId };
    const and = [];

    const projectIdParam = queryString(query, "projectId");

    if (projectIdParam) {
        const project = await getAccessibleProject(req, projectIdParam);
        where.projectId = project.id;
    } else {
        where.projectId = { in: await accessibleProjectIds(req) };
    }

    const statusParam = queryString(query, "status");

    if (statusParam) {
        const statuses = statusParam.split(",").map((value) => value.trim()).filter(Boolean);
        statuses.forEach((value) => assertEnum(value, STATUSES, "status"));
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    const priorityParam = queryString(query, "priority");

    if (priorityParam) {
        const priorities = priorityParam.split(",").map((value) => value.trim()).filter(Boolean);
        priorities.forEach((value) => assertEnum(value, PRIORITIES, "priority"));
        where.priority = priorities.length === 1 ? priorities[0] : { in: priorities };
    }

    const assigneeParam = queryString(query, "assigneeId");

    if (assigneeParam === "me") {
        where.assigneeId = req.userId;
    } else if (assigneeParam === "unassigned") {
        where.assigneeId = null;
    } else if (assigneeParam) {
        where.assigneeId = assigneeParam;
    }

    const labelParam = queryString(query, "label");

    if (labelParam) {
        where.taskLabels = {
            some: { label: { name: { equals: labelParam, mode: "insensitive" } } }
        };
    }

    const search = queryString(query, "q");

    if (search) {
        and.push({
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ]
        });
    }

    if (overdueOnly || queryString(query, "overdue") === "true") {
        and.push({ dueDate: { lt: now }, status: { not: "DONE" } });
    }

    const dueBefore = queryString(query, "dueBefore");
    const dueAfter = queryString(query, "dueAfter");

    if (dueBefore) {
        and.push({ dueDate: { lte: parseDueDate(dueBefore, "dueBefore") } });
    }

    if (dueAfter) {
        and.push({ dueDate: { gte: parseDueDate(dueAfter, "dueAfter") } });
    }

    if (and.length > 0) {
        where.AND = and;
    }

    const sort = queryString(query, "sort") || (overdueOnly ? "dueDate" : "position");
    const order = queryString(query, "order") || "asc";

    if (!SORT_FIELDS.includes(sort)) {
        throw new HttpError(400, `sort must be one of: ${SORT_FIELDS.join(", ")}`);
    }

    if (order !== "asc" && order !== "desc") {
        throw new HttpError(400, "order must be asc or desc");
    }

    const primary = sort === "dueDate"
        ? { dueDate: { sort: order, nulls: "last" } }
        : { [sort]: order };

    const orderBy = [primary];

    if (sort !== "createdAt") {
        orderBy.push({ createdAt: "asc" });
    }

    orderBy.push({ id: "asc" });

    const { page, pageSize, skip, take } = parsePagination(query, { defaultSize: 100, maxSize: 200 });

    const [total, tasks] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.findMany({ where, orderBy, skip, take, include: listInclude })
    ]);

    return res.json({
        status: "OK",
        count: tasks.length,
        total,
        page,
        pageSize,
        tasks: tasks.map((task) => serializeTask(task, { now }))
    });
}

// GET /api/tasks?projectId&status&priority&assigneeId&label&q&overdue&dueBefore&dueAfter&sort&order&page&pageSize
router.get("/", (req, res) => listTasks(req, res));

// GET /api/tasks/overdue - overdue tasks in the projects the user can access
router.get("/overdue", (req, res) => listTasks(req, res, { overdueOnly: true }));

// POST /api/tasks
router.post("/", async (req, res) => {
    const body = req.body || {};

    const projectId = assertId(body.projectId, "Project ID");
    const title = requireString(body.title, "Task title", { max: 200 });
    const description = optionalString(body.description, "Description");

    const status = body.status === undefined ? "TODO" : assertEnum(body.status, STATUSES, "Status");

    const priority = body.priority === undefined || body.priority === null
        ? null
        : assertEnum(body.priority, PRIORITIES, "Priority");

    const dueDate = body.dueDate === undefined || body.dueDate === null || body.dueDate === ""
        ? null
        : parseDueDate(body.dueDate);

    const labelNames = parseLabelNames(body.labels);

    const project = await getAccessibleProject(req, projectId);

    let assigneeId = null;

    if (body.assigneeId !== undefined && body.assigneeId !== null) {
        assigneeId = await assertAssignable(req, project.id, body.assigneeId);
    }

    const labels = [];

    for (const name of labelNames) {
        labels.push(await getOrCreateLabel(req.organizationId, name));
    }

    const created = await prisma.$transaction(async (tx) => {
        const aggregate = await tx.task.aggregate({
            where: { projectId: project.id, status },
            _max: { position: true }
        });

        return tx.task.create({
            data: {
                organizationId: req.organizationId,
                projectId: project.id,
                createdById: req.userId,
                title,
                description: description ?? null,
                status,
                priority,
                dueDate,
                assigneeId,
                position: (aggregate._max.position ?? -1) + 1,
                completedAt: status === "DONE" ? new Date() : null,
                ...(labels.length > 0
                    ? { taskLabels: { create: labels.map((label) => ({ labelId: label.id })) } }
                    : {})
            }
        });
    });

    await logActivity({
        organizationId: req.organizationId,
        projectId: project.id,
        taskId: created.id,
        actorId: req.userId,
        type: "TASK_CREATED",
        message: `${req.userName} created task "${created.title}"`
    });

    await notifyUsers({
        organizationId: req.organizationId,
        userIds: [assigneeId],
        type: "TASK_ASSIGNED",
        message: `You were assigned to "${created.title}"`,
        taskId: created.id,
        projectId: project.id,
        excludeUserId: req.userId
    });

    return res.status(201).json({
        status: "OK",
        message: "Task created successfully",
        task: await loadTask(created.id, { detail: true })
    });
});

// GET /api/tasks/:id
router.get("/:id", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);

    return res.json({
        status: "OK",
        task: await loadTask(task.id, { detail: true })
    });
});

// PUT|PATCH /api/tasks/:id - update fields. Send "version" to detect concurrent edits.
async function updateTask(req, res) {
    const task = await getAuthorizedTask(req, req.params.id);
    const body = req.body || {};
    const data = {};

    if (body.title !== undefined) {
        data.title = requireString(body.title, "Task title", { max: 200 });
    }

    if (body.description !== undefined) {
        data.description = optionalString(body.description, "Description");
    }

    if (body.priority !== undefined) {
        data.priority = body.priority === null ? null : assertEnum(body.priority, PRIORITIES, "Priority");
    }

    if (body.dueDate !== undefined) {
        data.dueDate = body.dueDate === null || body.dueDate === "" ? null : parseDueDate(body.dueDate);
        // A new due date can become overdue (and notify) again.
        data.overdueNotifiedAt = null;
    }

    if (body.assigneeId !== undefined) {
        data.assigneeId = body.assigneeId === null
            ? null
            : await assertAssignable(req, task.projectId, body.assigneeId);
    }

    if (body.status !== undefined) {
        const status = assertEnum(body.status, STATUSES, "Status");

        if (status !== task.status) {
            Object.assign(data, await prepareStatusChange(task, status, req));
        }
    }

    if (Object.keys(data).length === 0) {
        throw new HttpError(400, "Provide at least one field to update");
    }

    const expectedVersion = parseVersion(body.version, task.version);

    const result = await prisma.task.updateMany({
        where: { id: task.id, organizationId: req.organizationId, version: expectedVersion },
        data: { ...data, version: { increment: 1 } }
    });

    if (result.count !== 1) {
        throw versionConflict();
    }

    const updated = await prisma.task.findUnique({ where: { id: task.id } });

    await recordTaskChanges(req, task, updated);

    return res.json({
        status: "OK",
        message: "Task updated successfully",
        task: await loadTask(task.id, { detail: true })
    });
}

router.put("/:id", updateTask);
router.patch("/:id", updateTask);

// PATCH /api/tasks/:id/status { status, position?, version? }
// Kanban move: changes the column and/or the position inside the column.
// Also used as the keyboard / non-drag fallback (move left/right/up/down).
router.patch("/:id/status", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);
    const body = req.body || {};

    const status = assertEnum(body.status, STATUSES, "Status");

    let position;

    if (body.position !== undefined) {
        if (!Number.isInteger(body.position) || body.position < 0) {
            throw new HttpError(400, "position must be a non-negative integer");
        }

        position = body.position;
    }

    const expectedVersion = parseVersion(body.version, task.version);

    if (status === task.status && position === undefined) {
        return res.json({
            status: "OK",
            message: "Task is already in this column",
            task: await loadTask(task.id, { detail: true }),
            move: { from: task.status, to: status, position: task.position }
        });
    }

    if (!canTransition(task.status, status, req.isManager)) {
        if (task.status === "DONE" && !req.isManager) {
            throw new HttpError(403, "Only owners and managers can re-open a completed task");
        }

        throw new HttpError(400, "Invalid status transition");
    }

    const finalPosition = await prisma.$transaction(async (tx) => {
        const column = await tx.task.findMany({
            where: { projectId: task.projectId, status, id: { not: task.id } },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
            select: { id: true, position: true }
        });

        const index = position === undefined ? column.length : Math.min(position, column.length);

        const claimed = await tx.task.updateMany({
            where: { id: task.id, organizationId: req.organizationId, version: expectedVersion },
            data: {
                status,
                position: index,
                completedAt: status === "DONE"
                    ? (task.status === "DONE" ? task.completedAt : new Date())
                    : null,
                version: { increment: 1 }
            }
        });

        if (claimed.count !== 1) {
            throw versionConflict();
        }

        // Re-number the other tasks in the column around the moved task.
        const ordered = [
            ...column.slice(0, index),
            { id: task.id, position: index },
            ...column.slice(index)
        ];

        for (let slot = 0; slot < ordered.length; slot += 1) {
            const entry = ordered[slot];

            if (entry.id !== task.id && entry.position !== slot) {
                await tx.task.update({ where: { id: entry.id }, data: { position: slot } });
            }
        }

        // When the card changed column, close the gap it left in the old column.
        if (status !== task.status) {
            const source = await tx.task.findMany({
                where: { projectId: task.projectId, status: task.status },
                orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
                select: { id: true, position: true }
            });

            for (let slot = 0; slot < source.length; slot += 1) {
                if (source[slot].position !== slot) {
                    await tx.task.update({ where: { id: source[slot].id }, data: { position: slot } });
                }
            }
        }

        return index;
    });

    const updated = await prisma.task.findUnique({ where: { id: task.id } });

    await recordTaskChanges(req, task, updated);

    return res.json({
        status: "OK",
        message: "Task moved successfully",
        task: await loadTask(task.id, { detail: true }),
        move: { from: task.status, to: status, position: finalPosition }
    });
});

// DELETE /api/tasks/:id - owners/managers or the task creator
router.delete("/:id", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);

    if (!req.isManager && task.createdById !== req.userId) {
        throw new HttpError(403, "Only managers or the task creator can delete this task");
    }

    const attachments = await prisma.attachment.findMany({
        where: { taskId: task.id },
        select: { storedName: true }
    });

    await prisma.task.delete({ where: { id: task.id } });

    for (const attachment of attachments) {
        try {
            await removeStoredFile(attachment.storedName);
        } catch (error) {
            logger.error("Failed to remove attachment file", { storedName: attachment.storedName, error });
        }
    }

    // The task row is gone, so the event is stored without a task link.
    await logActivity({
        organizationId: req.organizationId,
        projectId: task.projectId,
        actorId: req.userId,
        type: "TASK_DELETED",
        message: `${req.userName} deleted task "${task.title}"`,
        metadata: { taskId: task.id, title: task.title }
    });

    return res.json({ status: "OK", message: "Task deleted successfully" });
});

// ---------------------------------------------------------------------------
// Subtasks
// ---------------------------------------------------------------------------

// POST /api/tasks/:id/subtasks { title }
router.post("/:id/subtasks", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);
    const title = requireString((req.body || {}).title, "Subtask title", { max: 200 });

    const count = await prisma.subtask.count({ where: { taskId: task.id } });

    if (count >= MAX_SUBTASKS_PER_TASK) {
        throw new HttpError(400, `A task can have at most ${MAX_SUBTASKS_PER_TASK} subtasks`);
    }

    const subtask = await prisma.subtask.create({
        data: { taskId: task.id, title, status: "TODO" }
    });

    await logActivity({
        organizationId: req.organizationId,
        projectId: task.projectId,
        taskId: task.id,
        actorId: req.userId,
        type: "SUBTASK_ADDED",
        message: `${req.userName} added subtask "${subtask.title}" to "${task.title}"`
    });

    return res.status(201).json({
        status: "OK",
        message: "Subtask created successfully",
        subtask
    });
});

// PATCH /api/tasks/:id/subtasks/:subtaskId { title?, status? }
router.patch("/:id/subtasks/:subtaskId", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);
    const body = req.body || {};

    const subtask = await prisma.subtask.findFirst({
        where: { id: String(req.params.subtaskId), taskId: task.id }
    });

    if (!subtask) {
        throw new HttpError(404, "Subtask not found");
    }

    const data = {};

    if (body.title !== undefined) {
        data.title = requireString(body.title, "Subtask title", { max: 200 });
    }

    if (body.status !== undefined) {
        data.status = assertEnum(body.status, SUBTASK_STATUSES, "Status");
    }

    if (Object.keys(data).length === 0) {
        throw new HttpError(400, "Provide at least one field to update");
    }

    const updated = await prisma.subtask.update({ where: { id: subtask.id }, data });

    if (data.status === "DONE" && subtask.status !== "DONE") {
        await logActivity({
            organizationId: req.organizationId,
            projectId: task.projectId,
            taskId: task.id,
            actorId: req.userId,
            type: "SUBTASK_COMPLETED",
            message: `${req.userName} completed subtask "${updated.title}" on "${task.title}"`
        });
    }

    return res.json({
        status: "OK",
        message: "Subtask updated successfully",
        subtask: updated
    });
});

// DELETE /api/tasks/:id/subtasks/:subtaskId
router.delete("/:id/subtasks/:subtaskId", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);

    const result = await prisma.subtask.deleteMany({
        where: { id: String(req.params.subtaskId), taskId: task.id }
    });

    if (result.count === 0) {
        throw new HttpError(404, "Subtask not found");
    }

    return res.json({ status: "OK", message: "Subtask deleted successfully" });
});

// ---------------------------------------------------------------------------
// Labels (organization-scoped)
// ---------------------------------------------------------------------------

// POST /api/tasks/:id/labels { name, color? } - attaches (creating if needed) a label
router.post("/:id/labels", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id, { include: { taskLabels: true } });
    const body = req.body || {};

    const name = normalizeLabelName(body.name);
    const color = optionalHexColor(body.color);

    const label = await getOrCreateLabel(req.organizationId, name, color);
    const alreadyAttached = task.taskLabels.some((entry) => entry.labelId === label.id);

    if (!alreadyAttached) {
        if (task.taskLabels.length >= MAX_LABELS_PER_TASK) {
            throw new HttpError(400, `A task can have at most ${MAX_LABELS_PER_TASK} labels`);
        }

        try {
            await prisma.taskLabel.create({ data: { taskId: task.id, labelId: label.id } });
        } catch (error) {
            // Attached by a concurrent request: treat as success.
            if (error.code !== "P2002") {
                throw error;
            }
        }
    }

    const labels = await prisma.taskLabel.findMany({
        where: { taskId: task.id },
        include: { label: true }
    });

    return res.status(alreadyAttached ? 200 : 201).json({
        status: "OK",
        message: alreadyAttached ? "Label already attached" : "Label attached successfully",
        labels: labels.map((entry) => entry.label)
    });
});

// DELETE /api/tasks/:id/labels/:labelId
router.delete("/:id/labels/:labelId", async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);

    const result = await prisma.taskLabel.deleteMany({
        where: { taskId: task.id, labelId: String(req.params.labelId) }
    });

    if (result.count === 0) {
        throw new HttpError(404, "Label is not attached to this task");
    }

    return res.json({ status: "OK", message: "Label removed successfully" });
});

// ---------------------------------------------------------------------------
// Activity history
// ---------------------------------------------------------------------------

// GET /api/tasks/:id/activity (alias: /activities) - newest first
router.get(["/:id/activity", "/:id/activities"], async (req, res) => {
    const task = await getAuthorizedTask(req, req.params.id);
    const { page, pageSize, skip, take } = parsePagination(req.query);

    const where = { taskId: task.id, organizationId: req.organizationId };

    const [total, activities] = await Promise.all([
        prisma.activity.count({ where }),
        prisma.activity.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip,
            take,
            include: { actor: { select: { id: true, name: true } } }
        })
    ]);

    return res.json({
        status: "OK",
        count: activities.length,
        total,
        page,
        pageSize,
        activities
    });
});

module.exports = router;
