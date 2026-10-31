/**
 * Simulated Email Service for Qveto SaaS
 * Week 3 Requirement (Day 6):
 * "Email is optional. If it is not really sending, write clearly that it is SIMULATED. Test and document."
 * 
 * In this environment, email dispatch is fully SIMULATED and recorded in memory
 * for testing, verification, and audit purposes.
 */

// In-memory simulated outbox for testing and verification
const simulatedOutbox = [];

/**
 * Send a simulated email notification.
 * Logs clearly with [SIMULATED EMAIL] tag and retains message in outbox.
 */
async function sendSimulatedEmail({ to, subject, body, template = "standard", metadata = {} }) {
    const timestamp = new Date().toISOString();
    const emailRecord = {
        id: `sim-mail-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        to,
        subject,
        body,
        template,
        metadata,
        timestamp,
        status: "DELIVERED_SIMULATED",
        provider: "SIMULATED_TEST_PROVIDER"
    };

    simulatedOutbox.unshift(emailRecord);

    // Keep outbox size bounded in memory
    if (simulatedOutbox.length > 500) {
        simulatedOutbox.pop();
    }

    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: "${subject}" | At: ${timestamp}`);

    return {
        success: true,
        simulated: true,
        messageId: emailRecord.id,
        to,
        subject,
        timestamp
    };
}

/**
 * Retrieve simulated outbox entries for automated tests or inspection.
 */
function getSimulatedEmails({ recipientEmail, limit = 50 } = {}) {
    let results = simulatedOutbox;
    if (recipientEmail) {
        results = results.filter((m) => m.to.toLowerCase() === recipientEmail.toLowerCase());
    }
    return results.slice(0, Number(limit) || 50);
}

/**
 * Clear the simulated outbox (useful before test suites).
 */
function clearSimulatedEmails() {
    simulatedOutbox.length = 0;
}

module.exports = {
    sendSimulatedEmail,
    getSimulatedEmails,
    clearSimulatedEmails,
    isSimulated: true
};
