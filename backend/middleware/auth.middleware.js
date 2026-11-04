const jwt = require("jsonwebtoken");
const logger = require("../lib/logger");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            status: "ERROR",
            message: "Authentication token is required"
        });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            status: "ERROR",
            message: "Invalid authorization format"
        });
    }

    try {
        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET, {
            algorithms: ["HS256"]
        });

        if (
            !decoded ||
            typeof decoded.userId !== "string" ||
            typeof decoded.organizationId !== "string"
        ) {
            return res.status(401).json({
                status: "ERROR",
                message: "Invalid or expired authentication token"
            });
        }

        req.user = decoded;

        return next();
    } catch (error) {
        logger.debug("Token verification failed", { reason: error.message });

        return res.status(401).json({
            status: "ERROR",
            message: "Invalid or expired authentication token"
        });
    }
}

module.exports = authenticateToken;
