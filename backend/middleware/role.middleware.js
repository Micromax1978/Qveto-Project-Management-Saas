function requireRole(...allowedRoles) {
    const normalized = allowedRoles.map((r) => String(r).toUpperCase());

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: "ERROR",
                message: "Authentication required",
                error: "Authentication required"
            });
        }

        const userRole = (req.user.role || "").toUpperCase();

        if (!normalized.includes(userRole)) {
            return res.status(403).json({
                status: "ERROR",
                message: "You do not have permission to perform this action",
                error: "You do not have permission to perform this action"
            });
        }

        next();
    };
}

module.exports = requireRole;
