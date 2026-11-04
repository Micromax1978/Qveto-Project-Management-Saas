const prisma = require("../lib/prisma");
const logger = require("../lib/logger");
const { sendNotificationEmails } = require("./email.service");

// Creates in-app notifications for the given users (deduplicated, never the
// actor, and only users that belong to the organization). Failures are logged
// but never break the request that triggered them.
async function notifyUsers({
    organizationId,
    userIds,
    type,
    message,
    taskId = null,
    projectId = null,
    excludeUserId = null
}) {
    try {
        const candidates = [...new Set(userIds.filter(Boolean))].filter((id) => id !== excludeUserId);

        if (candidates.length === 0) {
            return 0;
        }

        const members = await prisma.membership.findMany({
            where: { organizationId, userId: { in: candidates } },
            select: { userId: true }
        });

        const recipients = members.map((member) => member.userId);

        if (recipients.length === 0) {
            return 0;
        }

        await prisma.notification.createMany({
            data: recipients.map((userId) => ({
                organizationId,
                userId,
                type,
                message,
                taskId,
                projectId
            }))
        });

        await sendNotificationEmails(recipients, { type, message });

        return recipients.length;
    } catch (error) {
        logger.error("Failed to create notifications", { type, error });
        return 0;
    }
}

module.exports = { notifyUsers };
