function requireRole(...allowedRoles) {
    const normalized = allowedRoles.map((r) => r.toUpperCase());

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: "Authentication required",
                status: "ERROR",
                message: "Authentication required"
            });
        }

        const userRole = (req.user.role || "").toUpperCase();

        if (!normalized.includes(userRole)) {
            return res.status(403).json({
                error: "You do not have permission to perform this action",
                status: "ERROR",
                message: "You do not have permission to perform this action"
            });
        }

        next();
    };
}

module.exports = requireRole;
