// Use AFTER requireOrganization so req.role comes from the database.
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: "ERROR",
                message: "Authentication required"
            });
        }

        const role = req.role || String(req.user.role || "").toLowerCase();

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                status: "ERROR",
                message: "You do not have permission to perform this action"
            });
        }

        return next();
    };
}

module.exports = requireRole;
