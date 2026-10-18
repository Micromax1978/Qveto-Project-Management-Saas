function requireOrganization(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: "Authentication required",
            status: "ERROR",
            message: "Authentication required"
        });
    }

    const orgId = req.user.organizationId || req.headers["x-organization-id"];

    if (!orgId) {
        return res.status(403).json({
            error: "Organization information is missing",
            status: "ERROR",
            message: "Organization information is missing"
        });
    }

    req.organizationId = orgId;
    next();
}

module.exports = requireOrganization;
