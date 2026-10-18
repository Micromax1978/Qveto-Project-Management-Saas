function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: "ERROR",
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "You do not have permission to perform this action"
            });
        }

        next();
    };
}

module.exports = requireRole;

