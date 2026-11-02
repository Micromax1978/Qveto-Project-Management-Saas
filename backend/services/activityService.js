/**
 * activityService.js
 * Modular Activity & Audit Event Dispatcher for Qveto SaaS (Week 3 Collaboration).
 *
 * Implements a pluggable, event-driven interface coordinating Member 1 (Database/Analytics)
 * with Member 4 (Backend Integration & Activity Stream).
 */

const EventEmitter = require("events");

class ActivityEmitter extends EventEmitter {}
const activityEmitter = new ActivityEmitter();

// In-memory bounded activity buffer for real-time subscribers & testing
const inMemoryActivityLog = [];
const processedEventIds = new Set();
const MAX_LOG_SIZE = 500;

// Registered persistence handlers (e.g., Member 4's future database logger)
const customHandlers = [];

/**
 * Record a comment creation activity event.
 * Ensures strict deduplication, payload validation, and non-blocking delivery.
 *
 * @param {Object} event
 * @param {Object} event.actor - { id, name, email }
 * @param {Object} event.task - { id, title, projectId }
 * @param {string} event.organizationId
 * @param {Object} event.comment - { id, text, createdAt }
 * @param {string} event.eventType - Default: "COMMENT_CREATED"
 * @param {string} event.timestamp
 */
function recordCommentActivity(event) {
    if (!event || typeof event !== "object") {
        throw new Error("Invalid activity event payload: Expected an object.");
    }

    const { actor, task, organizationId, comment, eventType = "COMMENT_CREATED", timestamp } = event;

    if (!actor || !actor.id) {
        throw new Error("Activity event missing required actor information.");
    }
    if (!task || !task.id) {
        throw new Error("Activity event missing required task information.");
    }
    if (!organizationId) {
        throw new Error("Activity event missing required organizationId.");
    }
    if (!comment || !comment.id) {
        throw new Error("Activity event missing required comment reference.");
    }

    // Deduplication check based on comment.id
    const eventId = `act_${eventType}_${comment.id}`;
    if (processedEventIds.has(eventId)) {
        console.warn(`[ActivityService] Duplicate activity ignored for eventId: ${eventId}`);
        return null;
    }

    const activityRecord = {
        id: eventId,
        eventType,
        organizationId,
        actor: {
            id: actor.id,
            name: actor.name || "User",
            email: actor.email || ""
        },
        task: {
            id: task.id,
            title: task.title || "",
            projectId: task.projectId || ""
        },
        entity: {
            type: "COMMENT",
            id: comment.id,
            snippet: (comment.text || "").substring(0, 100)
        },
        timestamp: timestamp || new Date().toISOString()
    };

    processedEventIds.add(eventId);

    // Keep memory buffer bounded
    inMemoryActivityLog.push(activityRecord);
    if (inMemoryActivityLog.length > MAX_LOG_SIZE) {
        const removed = inMemoryActivityLog.shift();
        if (removed) processedEventIds.delete(removed.id);
    }

    // Emit event for real-time listeners (WebSockets / Server-Sent Events)
    activityEmitter.emit("activity", activityRecord);
    activityEmitter.emit(`activity:${organizationId}`, activityRecord);

    // Invoke any registered persistence handlers (Member 4 integration hook)
    for (const handler of customHandlers) {
        try {
            handler(activityRecord);
        } catch (handlerErr) {
            console.error("[ActivityService] Custom handler error:", handlerErr.message);
        }
    }

    return activityRecord;
}

/**
 * Register a pluggable persistence handler for Member 4
 * Example:
 *   activityService.registerHandler(async (record) => {
 *     await prisma.activityLog.create({ data: record });
 *   });
 */
function registerHandler(handler) {
    if (typeof handler === "function") {
        customHandlers.push(handler);
    }
}

/**
 * Retrieve recent recorded activities for an organization
 */
function getRecentActivities(organizationId, limit = 50) {
    return inMemoryActivityLog
        .filter((act) => !organizationId || act.organizationId === organizationId)
        .slice(-limit)
        .reverse();
}

/**
 * Reset activities (useful for test isolation)
 */
function resetActivityLog() {
    inMemoryActivityLog.length = 0;
    processedEventIds.clear();
}

module.exports = {
    recordCommentActivity,
    registerHandler,
    getRecentActivities,
    resetActivityLog,
    activityEmitter
};
