const prisma = require("../config/prisma");

/**
 * Authentication Middleware (Week 1 foundation)
 * Supports Bearer token or 'x-user-id' / 'x-user-email' header for development, testing, and early API calls.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const userIdHeader = req.headers["x-user-id"];
        const userEmailHeader = req.headers["x-user-email"];

        let userIdentifier = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            userIdentifier = authHeader.split(" ")[1];
        } else if (userIdHeader) {
            userIdentifier = userIdHeader;
        } else if (userEmailHeader) {
            userIdentifier = userEmailHeader;
        }

        if (!userIdentifier) {
            return res.status(401).json({
                error: "Unauthorized: Missing authentication credentials (use Bearer token or x-user-id / x-user-email header)"
            });
        }

        // Lookup user in database if UUID or email provided
        let user = null;
        try {
            if (userIdentifier.includes("@")) {
                user = await prisma.user.findUnique({
                    where: { email: userIdentifier }
                });
            } else if (userIdentifier.length >= 20) {
                user = await prisma.user.findUnique({
                    where: { id: userIdentifier }
                });
            }
        } catch (dbErr) {
            console.warn("[Auth Middleware] Database user lookup failed, falling back to simulated session:", dbErr.message);
        }

        // If user found or simulated for testing
        req.user = user || {
            id: userIdentifier,
            name: "Authenticated User",
            email: userIdentifier.includes("@") ? userIdentifier : "user@example.com"
        };

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication middleware:
 * Populates req.user if credentials are provided, but does not block unauthenticated requests.
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization || req.headers["x-user-id"] || req.headers["x-user-email"];
    if (!authHeader) {
        return next();
    }
    return authenticate(req, res, next);
}

module.exports = {
    authenticate,
    optionalAuth
};
