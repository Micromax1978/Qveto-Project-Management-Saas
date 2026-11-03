const prisma = require("../config/prisma");

/**
 * Activity Logging Service (Phase 4)
 * Records audit events for task lifecycle, assignments, comments, and attachments.
 */
async function logActivity({
  organizationId,
  taskId,
  userId,
  type,
  description,
  oldValue = null,
  newValue = null
}) {
  try {
    if (!organizationId || !taskId) return null;

    const activity = await prisma.activity.create({
      data: {
        organizationId,
        taskId,
        userId: userId || "system",
        type,
        description,
        oldValue: oldValue ? String(oldValue) : null,
        newValue: newValue ? String(newValue) : null
      }
    });

    return activity;
  } catch (err) {
    console.warn("[ActivityService] Failed to record activity:", err.message);
    return null;
  }
}

module.exports = {
  logActivity
};
