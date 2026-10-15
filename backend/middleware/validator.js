/**
 * Reusable Request Validation Middleware
 * Enforces uniform error format: { error: message }
 *
 * Usage:
 *   router.post("/", validateRequired(["name", "email"]), handler)
 *   router.post("/tasks", validateFields({
 *     required: ["title", "organizationId"],
 *     allowedEnums: { status: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"] }
 *   }), handler)
 */

function validateRequired(requiredFields = []) {
    return (req, res, next) => {
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({
                error: "Request body must be a JSON object"
            });
        }

        const missing = [];
        for (const field of requiredFields) {
            const val = req.body[field];
            if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Missing required field(s): ${missing.join(", ")}`
            });
        }

        next();
    };
}

function validateFields({ required = [], allowedEnums = {} }) {
    return (req, res, next) => {
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({
                error: "Request body must be a JSON object"
            });
        }

        // Check required fields
        const missing = [];
        for (const field of required) {
            const val = req.body[field];
            if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
                missing.push(field);
            }
        }
        if (missing.length > 0) {
            return res.status(400).json({
                error: `Missing required field(s): ${missing.join(", ")}`
            });
        }

        // Check enums
        for (const [field, allowedValues] of Object.entries(allowedEnums)) {
            const val = req.body[field];
            if (val !== undefined && val !== null && !allowedValues.includes(val)) {
                return res.status(400).json({
                    error: `Invalid value for '${field}'. Allowed values: ${allowedValues.join(", ")}`
                });
            }
        }

        next();
    };
}

module.exports = {
    validateRequired,
    validateFields
};
