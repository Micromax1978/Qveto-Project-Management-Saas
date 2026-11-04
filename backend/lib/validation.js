// Request validation helpers. Dependency-free so they can be unit tested.
const { HttpError } = require("./errors");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Returns a trimmed string, or throws a 400.
function requireString(value, field, { min = 1, max = 200 } = {}) {
    if (typeof value !== "string") {
        throw new HttpError(400, `${field} is required`);
    }

    const trimmed = value.trim();

    if (trimmed.length < min) {
        throw new HttpError(400, `${field} is required`);
    }

    if (trimmed.length > max) {
        throw new HttpError(400, `${field} must be at most ${max} characters`);
    }

    return trimmed;
}

// Returns a trimmed string, null (empty / null input) or undefined (not provided).
function optionalString(value, field, { max = 5000 } = {}) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        throw new HttpError(400, `${field} must be a string`);
    }

    const trimmed = value.trim();

    if (trimmed.length > max) {
        throw new HttpError(400, `${field} must be at most ${max} characters`);
    }

    return trimmed === "" ? null : trimmed;
}

function assertEnum(value, allowed, field) {
    if (typeof value !== "string" || !allowed.includes(value)) {
        throw new HttpError(400, `${field} must be one of: ${allowed.join(", ")}`);
    }

    return value;
}

function isValidEmail(email) {
    return typeof email === "string" && email.length <= 254 && EMAIL_PATTERN.test(email);
}

// Date/time rules for due dates (documented in the README):
//  - A date-only value ("2026-11-30") means the END of that day in UTC.
//  - A full ISO timestamp ("2026-11-30T09:00:00Z") is used as given.
//  - Timestamps without an offset are interpreted as UTC.
// Returns a Date, or throws a 400.
function parseDueDate(value, field = "Due date") {
    if (typeof value !== "string" || !value.trim()) {
        throw new HttpError(400, `${field} must be an ISO date or timestamp string`);
    }

    const input = value.trim();
    const dateOnly = DATE_ONLY_PATTERN.exec(input);

    if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        const parsed = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        // Reject impossible dates such as 2026-02-30.
        if (
            parsed.getUTCFullYear() !== year ||
            parsed.getUTCMonth() !== month - 1 ||
            parsed.getUTCDate() !== day
        ) {
            throw new HttpError(400, `${field} is not a valid date`);
        }

        return parsed;
    }

    const hasTime = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(input);

    if (!hasTime) {
        throw new HttpError(400, `${field} must be an ISO date or timestamp string`);
    }

    const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(input);
    const parsed = new Date(hasOffset ? input : `${input.replace(" ", "T")}Z`);

    if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(400, `${field} is not a valid date`);
    }

    if (parsed.getUTCFullYear() < 2000 || parsed.getUTCFullYear() > 2100) {
        throw new HttpError(400, `${field} must be between the years 2000 and 2100`);
    }

    return parsed;
}

// Overdue rule: due date/time is strictly in the past AND the task is not DONE.
function isOverdue(task, now = new Date()) {
    if (!task || !task.dueDate || task.status === "DONE") {
        return false;
    }

    return new Date(task.dueDate).getTime() < now.getTime();
}

function parsePagination(query, { defaultSize = 50, maxSize = 100 } = {}) {
    const pageRaw = query.page === undefined ? 1 : Number(query.page);
    const sizeRaw = query.pageSize === undefined ? defaultSize : Number(query.pageSize);

    if (!Number.isInteger(pageRaw) || pageRaw < 1) {
        throw new HttpError(400, "page must be a positive integer");
    }

    if (!Number.isInteger(sizeRaw) || sizeRaw < 1 || sizeRaw > maxSize) {
        throw new HttpError(400, `pageSize must be an integer between 1 and ${maxSize}`);
    }

    return {
        page: pageRaw,
        pageSize: sizeRaw,
        skip: (pageRaw - 1) * sizeRaw,
        take: sizeRaw
    };
}

// Query-string values must be plain strings (not arrays).
function queryString(query, key) {
    const value = query[key];

    if (value === undefined || value === "") {
        return undefined;
    }

    if (typeof value !== "string") {
        throw new HttpError(400, `${key} must be a single value`);
    }

    return value.trim();
}

function normalizeLabelName(value) {
    const name = requireString(value, "Label name", { max: 30 });
    return name.replace(/\s+/g, " ");
}

function optionalHexColor(value) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
        throw new HttpError(400, "Label color must be a hex value like #3366ff");
    }

    return value.toLowerCase();
}

module.exports = {
    requireString,
    optionalString,
    assertEnum,
    isValidEmail,
    parseDueDate,
    isOverdue,
    parsePagination,
    queryString,
    normalizeLabelName,
    optionalHexColor
};
