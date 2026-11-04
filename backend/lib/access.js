// Authorization helpers. Every query is scoped to req.organizationId, and
// employees only see projects they are members of (managers/owners see all
// projects in their organization). Missing and forbidden resources both return
// 404 so other tenants' data cannot be probed.
const prisma = require("./prisma");
const { HttpError } = require("./errors");

function assertId(value, field) {
    if (typeof value !== "string" || !value.trim()) {
        throw new HttpError(400, `${field} is required`);
    }

    return value.trim();
}

async function getAccessibleProject(req, projectId) {
    const id = assertId(projectId, "Project ID");

    const project = await prisma.project.findFirst({
        where: { id, organizationId: req.organizationId }
    });

    if (!project) {
        throw new HttpError(404, "Project not found or access denied");
    }

    if (req.isManager) {
        return project;
    }

    const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: req.userId } }
    });

    if (!membership) {
        throw new HttpError(404, "Project not found or access denied");
    }

    return project;
}

async function accessibleProjectIds(req) {
    if (req.isManager) {
        const projects = await prisma.project.findMany({
            where: { organizationId: req.organizationId },
            select: { id: true }
        });

        return projects.map((project) => project.id);
    }

    const memberships = await prisma.projectMember.findMany({
        where: {
            userId: req.userId,
            project: { organizationId: req.organizationId }
        },
        select: { projectId: true }
    });

    return memberships.map((membership) => membership.projectId);
}

// Loads a task inside the user's organization and verifies project access.
async function getAuthorizedTask(req, taskId, extra = {}) {
    const id = assertId(taskId, "Task ID");

    const task = await prisma.task.findFirst({
        where: { id, organizationId: req.organizationId },
        ...extra
    });

    if (!task) {
        throw new HttpError(404, "Task not found or access denied");
    }

    try {
        await getAccessibleProject(req, task.projectId);
    } catch (error) {
        if (error instanceof HttpError && error.statusCode === 404) {
            throw new HttpError(404, "Task not found or access denied");
        }

        throw error;
    }

    return task;
}

// An assignee must be a member of the organization AND of the project.
async function assertAssignable(req, projectId, userId) {
    const id = assertId(userId, "Assignee ID");

    const orgMembership = await prisma.membership.findUnique({
        where: { organizationId_userId: { organizationId: req.organizationId, userId: id } }
    });

    const projectMembership = orgMembership
        ? await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: id } }
        })
        : null;

    if (!orgMembership || !projectMembership) {
        throw new HttpError(400, "Assignee must belong to this organization and project");
    }

    return id;
}

module.exports = {
    assertId,
    getAccessibleProject,
    accessibleProjectIds,
    getAuthorizedTask,
    assertAssignable
};
