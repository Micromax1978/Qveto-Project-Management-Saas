const crypto = require("crypto");
const logger = require("../lib/logger");
const { HttpError } = require("../lib/errors");

// Adds a request id, basic security headers and request logging.
function requestContext(req, res, next) {
    req.id = crypto.randomUUID();
    res.set("X-Request-Id", req.id);
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "no-referrer");

    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const level = res.statusCode >= 500 ? "error" : "info";

        // 5xx are logged with details by the error handler; keep this line short.
        if (level === "info") {
            logger.info("request", {
                requestId: req.id,
                method: req.method,
                path: req.originalUrl.split("?")[0],
                status: res.statusCode,
                durationMs: Math.round(durationMs * 10) / 10
            });
        }
    });

    next();
}

function notFoundHandler(req, res) {
    res.status(404).json({
        status: "ERROR",
        message: "Route not found"
    });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({
            status: "ERROR",
            message: err.message,
            ...err.extra
        });
    }

    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ status: "ERROR", message: "Invalid JSON body" });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({ status: "ERROR", message: "Request body too large" });
    }

    // Prisma known errors
    if (err.code === "P2002") {
        return res.status(409).json({ status: "ERROR", message: "A record with these values already exists" });
    }

    if (err.code === "P2025") {
        return res.status(404).json({ status: "ERROR", message: "Record not found" });
    }

    logger.error("Unhandled error", {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl && req.originalUrl.split("?")[0],
        userId: req.userId,
        error: err
    });

    return res.status(500).json({
        status: "ERROR",
        message: "Internal server error",
        requestId: req.id
    });
}

module.exports = { requestContext, notFoundHandler, errorHandler };
