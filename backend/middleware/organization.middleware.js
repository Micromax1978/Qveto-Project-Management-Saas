function requireOrganization(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            status: "ERROR",
            message: "Authentication required"
        });
    }

    if (!req.user.organizationId) {
        return res.status(403).json({
            status: "ERROR",
            message: "Organization information is missing"
        });
    }

    req.organizationId = req.user.organizationId;

    next();
}

module.exports = requireOrganization;
