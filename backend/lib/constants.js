// Shared enums and business rules. Kept dependency-free so it can be unit tested.

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const SUBTASK_STATUSES = ["TODO", "DONE"];
const MANAGER_ROLES = ["owner", "manager"];

// Kanban status transition rules.
// - Any column can be reached from any other column (free drag-and-drop)...
// - ...except that moving a task OUT of DONE (re-opening it) is reserved for
//   owners and managers.
function canTransition(from, to, isManager) {
    if (from === to) {
        return true;
    }

    if (!STATUSES.includes(from) || !STATUSES.includes(to)) {
        return false;
    }

    if (from === "DONE" && !isManager) {
        return false;
    }

    return true;
}

function isManagerRole(role) {
    return MANAGER_ROLES.includes(String(role || "").toLowerCase());
}

module.exports = {
    STATUSES,
    PRIORITIES,
    SUBTASK_STATUSES,
    MANAGER_ROLES,
    canTransition,
    isManagerRole
};
