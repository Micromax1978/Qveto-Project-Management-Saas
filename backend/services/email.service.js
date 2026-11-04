// Optional email notifications.
//
// IMPORTANT: this is a SIMULATED email channel. When EMAIL_NOTIFICATIONS=true
// the message is written to the application log and to logs/email-outbox.log
// instead of being sent through an SMTP provider. Replace sendNotificationEmails
// with a real provider (SMTP, SES, SendGrid...) to deliver real emails.
const prisma = require("../lib/prisma");
const logger = require("../lib/logger");

async function sendNotificationEmails(userIds, { type, message }) {
    if (process.env.EMAIL_NOTIFICATIONS !== "true" || userIds.length === 0) {
        return 0;
    }

    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, name: true }
    });

    for (const user of users) {
        const email = {
            simulated: true,
            to: user.email,
            subject: `[Qveto] ${type}`,
            text: message
        };

        logger.info("Email notification (simulated)", email);
        logger.appendToFile("email-outbox.log", JSON.stringify({ time: new Date().toISOString(), ...email }));
    }

    return users.length;
}

module.exports = { sendNotificationEmails };
