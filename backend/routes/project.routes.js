const express = require("express");
const prisma = require("../lib/prisma");
const logger = require("../lib/logger");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const requireRole = require("../middleware/role.middleware");
const { HttpError } = require("../lib/errors");
const { getAccessibleProject, assertId } = require("../lib/access");
const { requireString, optionalString, parsePagination, queryString } = require("../lib/validation");
const { completionRate } = require("../lib/analytics");
const { removeStoredFile } = require("../lib/storage");
const { logActivity } = require("../services/activity.service");
const { notifyUsers } = require("../services/notification.service");

const router = express.Router();

router.use(authenticateToken, requireOrganization);

const managerOnly = requireRole("owner", "manager");

const userSummary = { select: { id: true, name: true, email: true } };

async function findDuplicateName(organizationId, name, excludeId) {
    return prisma.project.findFirst({
        where: {
            organizationId,
            name: { equals: name, mode: "insensitive" },
            ...(excludeId ? { id: { not: excludeId } } : {})
        },
        select: { id: true }
    });
}

// Uses the given workspace, or the organization's first workspace
// (creating "Default Workspace" when the organization has none).
async function resolveWorkspace(req, workspaceId) {
    if (workspaceId !== undefined && workspaceId !== null) {
        const id = requireString(workspaceId, "Workspace ID", { max: 100 });

        const workspace = await prisma.workspace.findFirst({
            where: { id, organizationId: req.organizationId }
        });

        if (!workspace) {
            throw new HttpError(404, "Workspace not found in your organization");
        }

        return workspace;
    }

    const existing = await prisma.workspace.findFirst({
        where: { organizationId: req.organizationId },
        orderBy: { id: "asc" }
    });

    if (existing) {
        return existing;
    }

    return prisma.workspace.create({
        data: { organizationId: req.organizationId, name: "Default Workspace" }
    });
}

function parseMemberIds(value) {
    if (value === undefined) {
        return [];
    }

    if (
        !Array.isArray(value) ||
        value.length > 100 ||
        value.some((id) => typeof id !== "string" || !id.trim())
    ) {
        throw new HttpError(400, "memberIds must be an array of user IDs");
    }

    return [...new Set(value.map((id) => id.trim()))];
}

// GET /api/projects - projects the user can access (with progress counts)
router.get("/", async (req, res) => {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const q = queryString(req.query, "q");

    const where = {
        organizationId: req.organizationId,
        ...(req.isManager ? {} : { projectMembers: { some: { userId: req.userId } } }),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {})
    };

    const [total, projects] = await Promise.all([
        prisma.project.count({ where }),
        prisma.project.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            include: { _count: { select: { tasks: true, projectMembers: true } } }
        })
    ]);

    const ids = projects.map((project) => project.id);

    const doneRows = ids.length
        ? await prisma.task.groupBy({
            by: ["projectId"],
            where: { projectId: { in: ids }, status: "DONE" },
            _count: { _all: true }
        })
        : [];

    const doneByProject = new Map(doneRows.map((row) => [row.projectId, row._count._all]));

    return res.json({
        status: "OK",
        count: projects.length,
        total,
        page,
        pageSize,
        projects: projects.map(({ _count, ...project }) => {
            const doneCount = doneByProject.get(project.id) || 0;

            return {
                ...project,
                taskCount: _count.tasks,
                memberCount: _count.projectMembers,
                doneCount,
                progress: completionRate(doneCount, _count.tasks)
            };
        })
    });
});

// POST /api/projects - create a project (owner/manager). The creator becomes a member.
router.post("/", managerOnly, async (req, res) => {
    const body = req.body || {};

    const name = requireString(body.name, "Project name", { max: 120 });
    const description = optionalString(body.description, "Description", { max: 2000 });
    const requestedMemberIds = parseMemberIds(body.memberIds);

    const workspace = await resolveWorkspace(req, body.workspaceId);

    if (await findDuplicateName(req.organizationId, name)) {
        throw new HttpError(409, "A project with this name already exists");
    }

    const otherMemberIds = requestedMemberIds.filter((id) => id !== req.userId);

    if (otherMemberIds.length > 0) {
        const found = await prisma.membership.findMany({
            where: { organizationId: req.organizationId, userId: { in: otherMemberIds } },
            select: { userId: true }
        });

        if (found.length !== otherMemberIds.length) {
            throw new HttpError(400, "All members must belong to your organization");
        }
    }

    const project = await prisma.project.create({
        data: {
            organizationId: req.organizationId,
            workspaceId: workspace.id,
            name,
            description: description ?? null,
            createdById: req.userId,
            projectMembers: {
                create: [req.userId, ...otherMemberIds].map((userId) => ({ userId }))
            }
        },
        include: {
            projectMembers: { include: { user: userSummary } }
        }
    });

    await logActivity({
        organizationId: req.organizationId,
        projectId: project.id,
        actorId: req.userId,
        type: "PROJECT_CREATED",
        message: `${req.userName} created project "${project.name}"`
    });

    await notifyUsers({
        organizationId: req.organizationId,
        userIds: otherMemberIds,
        type: "PROJECT_MEMBER_ADDED",
        message: `You were added to project "${project.name}"`,
        projectId: project.id,
        excludeUserId: req.userId
    });

    return res.status(201).json({
        status: "OK",
        message: "Project created successfully",
        project
    });
});

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
    const project = await getAccessibleProject(req, req.params.id);

    const full = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
            workspace: { select: { id: true, name: true } },
            projectMembers: {
                include: { user: userSummary },
                orderBy: { createdAt: "asc" }
            },
            _count: { select: { tasks: true } }
        }
    });

    const { _count, ...rest } = full;

    return res.json({
        status: "OK",
        project: { ...rest, taskCount: _count.tasks }
    });
});

// PATCH|PUT /api/projects/:id - rename / change description (owner/manager)
async function updateProject(req, res) {
    const project = await getAccessibleProject(req, req.params.id);
    const body = req.body || {};
    const data = {};

    if (body.name !== undefined) {
        const name = requireString(body.name, "Project name", { max: 120 });

        if (await findDuplicateName(req.organizationId, name, project.id)) {
            throw new HttpError(409, "A project with this name already exists");
        }

        data.name = name;
    }

    if (body.description !== undefined) {
        data.description = optionalString(body.description, "Description", { max: 2000 });
    }

    if (Object.keys(data).length === 0) {
        throw new HttpError(400, "Provide at least one field to update");
    }

    const updated = await prisma.project.update({
        where: { id: project.id },
        data
    });

    await logActivity({
        organizationId: req.organizationId,
        projectId: project.id,
        actorId: req.userId,
        type: "PROJECT_UPDATED",
        message: `${req.userName} updated project "${updated.name}"`
    });

    return res.json({
        status: "OK",
        message: "Project updated successfully",
        project: updated
    });
}

router.patch("/:id", managerOnly, updateProject);
router.put("/:id", managerOnly, updateProject);

// DELETE /api/projects/:id - deletes the project, its tasks and their attachments (owner/manager)
router.delete("/:id", managerOnly, async (req, res) => {
    const project = await getAccessibleProject(req, req.params.id);

    const attachments = await prisma.attachment.findMany({
        where: { task: { projectId: project.id } },
        select: { storedName: true }
    });

    await prisma.project.delete({ where: { id: project.id } });

    for (const attachment of attachments) {
        try {
            await removeStoredFile(attachment.storedName);
        } catch (error) {
            logger.error("Failed to remove attachment file", { storedName: attachment.storedName, error });
        }
    }

    return res.json({ status: "OK", message: "Project deleted successfully" });
});

// GET /api/projects/:id/members
router.get("/:id/members", async (req, res) => {
    const project = await getAccessibleProject(req, req.params.id);

    const members = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        include: { user: userSummary },
        orderBy: { createdAt: "asc" }
    });

    return res.json({ status: "OK", count: members.length, members });
});

// POST /api/projects/:id/members { userId } (owner/manager)
router.post("/:id/members", managerOnly, async (req, res) => {
    const project = await getAccessibleProject(req, req.params.id);
    const userId = assertId((req.body || {}).userId, "userId");

    const orgMembership = await prisma.membership.findUnique({
        where: { organizationId_userId: { organizationId: req.organizationId, userId } },
        include: { user: userSummary }
    });

    if (!orgMembership) {
        throw new HttpError(400, "User must belong to your organization");
    }

    const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId } }
    });

    if (existing) {
        throw new HttpError(409, "User is already a member of this project");
    }

    const member = await prisma.projectMember.create({
        data: { projectId: project.id, userId },
        include: { user: userSummary }
    });

    await logActivity({
        organizationId: req.organizationId,
        projectId: project.id,
        actorId: req.userId,
        type: "MEMBER_ADDED",
        message: `${req.userName} added ${orgMembership.user.name} to the project`,
        metadata: { userId }
    });

    await notifyUsers({
        organizationId: req.organizationId,
        userIds: [userId],
        type: "PROJECT_MEMBER_ADDED",
        message: `You were added to project "${project.name}"`,
        projectId: project.id,
        excludeUserId: req.userId
    });

    return res.status(201).json({
        status: "OK",
        message: "Member added successfully",
        member
    });
});

// DELETE /api/projects/:id/members/:userId (owner/manager)
// Tasks assigned to the removed member become unassigned.
router.delete("/:id/members/:userId", managerOnly, async (req, res) => {
    const project = await getAccessibleProject(req, req.params.id);
    const userId = assertId(req.params.userId, "userId");

    const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId } },
        include: { user: userSummary }
    });

    if (!member) {
        throw new HttpError(404, "Member not found in this project");
    }

    const unassigned = await prisma.$transaction(async (tx) => {
        const result = await tx.task.updateMany({
            where: { projectId: project.id, assigneeId: userId },
            data: { assigneeId: null }
        });

        await tx.projectMember.delete({
            where: { projectId_userId: { projectId: project.id, userId } }
        });

        return result.count;
    });

    await logActivity({
        organizationId: req.organizationId,
        projectId: project.id,
        actorId: req.userId,
        type: "MEMBER_REMOVED",
        message: `${req.userName} removed ${member.user.name} from the project`,
        metadata: { userId, unassignedTasks: unassigned }
    });

    return res.json({
        status: "OK",
        message: "Member removed successfully",
        unassignedTasks: unassigned
    });
});

// GET /api/projects/:id/activity - project activity history (newest first)
router.get("/:id/activity", async (req, res) => {
    const project = await getAccessibleProject(req, req.params.id);
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const type = queryString(req.query, "type");

    const where = { projectId: project.id, ...(type ? { type } : {}) };

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
