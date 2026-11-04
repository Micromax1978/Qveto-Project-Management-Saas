const prisma = require("../lib/prisma");
const logger = require("../lib/logger");

// Records an audit/activity event. A logging failure never breaks the request.
async function logActivity({
    organizationId,
    projectId = null,
    taskId = null,
    actorId = null,
    type,
    message,
    metadata
}) {
    try {
        await prisma.activity.create({
            data: {
                organizationId,
                projectId,
                taskId,
                actorId,
                type,
                message,
                ...(metadata ? { metadata } : {})
            }
        });
    } catch (error) {
        logger.error("Failed to record activity", { type, taskId, error });
    }
}

module.exports = { logActivity };
