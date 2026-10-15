/**
 * Centralized Error Handler Middleware
 * Guarantees all errors follow the uniform format: { error: message }
 */
function errorHandler(err, req, res, next) {
    console.error("[Error Handler]", err);

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal server error";

    // Handle Prisma specific known errors
    if (err.code === "P2002") {
        statusCode = 409;
        const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
        message = `Unique constraint violation on ${target}`;
    } else if (err.code === "P2025") {
        statusCode = 404;
        message = "Requested record not found";
    } else if (err.name === "ValidationError") {
        statusCode = 400;
    }

    res.status(statusCode).json({
        error: statusCode === 500 && process.env.NODE_ENV === "production"
            ? "Internal server error"
            : message
    });
}

module.exports = errorHandler;
