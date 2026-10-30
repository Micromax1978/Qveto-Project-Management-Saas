/**
 * analyticsService.js
 * Centralized, Reusable Project Analytics & Progress Calculation Service (Week 4).
 *
 * Implements the official Qveto progress formula:
 *   Progress Percentage = (Completed Tasks / (All Tasks - Cancelled Tasks)) * 100
 */

const prisma = require("../config/prisma");

/**
 * Pure calculation function that accepts a list of tasks and computes analytics metrics.
 * Safely prevents division by zero, handles empty tasks, and excludes cancelled tasks from denominator.
 *
 * @param {Array<{ status: string }>} tasks
 * @returns {Object} Analytics metrics
 */
function computeTaskMetrics(tasks = []) {
    const totalTasks = tasks.length;
    let completedTasks = 0;
    let todoTasks = 0;
    let inProgressTasks = 0;
    let inReviewTasks = 0;
    let cancelledTasks = 0;

    for (const task of tasks) {
        const rawStatus = (task.status || "TODO").toUpperCase();
        switch (rawStatus) {
            case "DONE":
                completedTasks++;
                break;
            case "TODO":
                todoTasks++;
                break;
            case "IN_PROGRESS":
            case "INPROGRESS":
                inProgressTasks++;
                break;
            case "IN_REVIEW":
            case "INREVIEW":
            case "REVIEW":
                inReviewTasks++;
                break;
            case "CANCELLED":
            case "CANCELED":
                cancelledTasks++;
                break;
            default:
                todoTasks++;
                break;
        }
    }

    const eligibleTasks = totalTasks - cancelledTasks;
    const remainingTasks = todoTasks + inProgressTasks + inReviewTasks;

    // Strict division-by-zero prevention: If no eligible tasks exist, progress is 0%
    const completionPercentage = eligibleTasks > 0
        ? Math.min(100, Math.max(0, Math.round((completedTasks / eligibleTasks) * 100)))
        : 0;

    return {
        totalTasks,
        completedTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        cancelledTasks,
        remainingTasks,
        eligibleTasks,
        completionPercentage,
        progress: completionPercentage,
        tasksByStatus: {
            TODO: todoTasks,
            IN_PROGRESS: inProgressTasks,
            IN_REVIEW: inReviewTasks,
            DONE: completedTasks,
            CANCELLED: cancelledTasks
        }
    };
}

/**
 * Calculate analytics for a specific project from PostgreSQL database.
 * Enforces organization-scoping and tenant isolation.
 *
 * @param {string} projectId
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
async function getProjectAnalytics(projectId, organizationId) {
    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
        const err = new Error("Project ID is required");
        err.status = 400;
        throw err;
    }

    if (!organizationId) {
        const err = new Error("Organization ID is required");
        err.status = 400;
        throw err;
    }

    // Verify project exists and belongs to organization
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            organizationId
        },
        select: {
            id: true,
            name: true,
            organizationId: true,
            description: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!project) {
        const err = new Error(`Project not found with id: ${projectId} in the current organization`);
        err.status = 404;
        throw err;
    }

    // Query tasks for this project
    const tasks = await prisma.task.findMany({
        where: {
            projectId,
            organizationId
        },
        select: {
            id: true,
            status: true,
            title: true,
            priority: true,
            createdAt: true,
            dueDate: true
        }
    });

    const metrics = computeTaskMetrics(tasks);

    return {
        project: {
            id: project.id,
            name: project.name,
            description: project.description
        },
        organizationId,
        ...metrics
    };
}

/**
 * Calculate organization-wide project metrics
 *
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
async function getOrganizationAnalytics(organizationId) {
    if (!organizationId) {
        const err = new Error("Organization ID is required");
        err.status = 400;
        throw err;
    }

    const projects = await prisma.project.findMany({
        where: { organizationId },
        include: {
            tasks: {
                select: { id: true, status: true }
            }
        }
    });

    const allTasks = [];
    const projectSummaries = projects.map((p) => {
        const pTasks = p.tasks || [];
        allTasks.push(...pTasks);
        const m = computeTaskMetrics(pTasks);
        return {
            id: p.id,
            name: p.name,
            ...m
        };
    });

    const orgMetrics = computeTaskMetrics(allTasks);

    return {
        organizationId,
        projectCount: projects.length,
        ...orgMetrics,
        projects: projectSummaries
    };
}

module.exports = {
    computeTaskMetrics,
    getProjectAnalytics,
    getOrganizationAnalytics
};
