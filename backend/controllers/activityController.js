const activityService = require("../services/activityService");

/**
 * GET /api/activities
 * List activities for the current organization.
 * Filters: taskId, projectId, userId, action, limit, offset
 */
async function getActivities(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { taskId, projectId, userId, action, limit = 50, offset = 0 } = req.query;

        const result = await activityService.getActivities({
            organizationId,
            taskId,
            projectId,
            userId,
            action,
            limit: parseInt(limit, 10) || 50,
            offset: parseInt(offset, 10) || 0
        });

        res.json({
            organizationId,
            ...result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tasks/:id/activities
 * List activities specific to a task.
 */
async function getTaskActivities(req, res, next) {
    try {
        const organizationId = req.organizationId;
        const { id: taskId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const result = await activityService.getActivities({
            organizationId,
            taskId,
            limit: parseInt(limit, 10) || 50,
            offset: parseInt(offset, 10) || 0
        });

        res.json({
            taskId,
            organizationId,
            ...result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getActivities,
    getTaskActivities
};
