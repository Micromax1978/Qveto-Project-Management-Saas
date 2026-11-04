const prisma = require("../lib/prisma");
const { isManagerRole } = require("../lib/constants");

// Confirms the token's user is STILL a member of the token's organization and
// loads their CURRENT role from the database (the role inside the JWT can be
// stale after a role change or removal).
//
// Sets: req.userId, req.userName, req.organizationId, req.role, req.isManager
async function requireOrganization(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: "ERROR",
                message: "Authentication required"
            });
        }

        const { userId, organizationId } = req.user;

        if (!userId || !organizationId) {
            return res.status(403).json({
                status: "ERROR",
                message: "Organization information is missing"
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                organizationId_userId: { organizationId, userId }
            },
            include: {
                user: { select: { name: true } }
            }
        });

        if (!membership) {
            return res.status(403).json({
                status: "ERROR",
                message: "You are not a member of this organization"
            });
        }

        req.userId = userId;
        req.userName = membership.user.name;
        req.organizationId = organizationId;
        req.role = String(membership.role).toLowerCase();
        req.isManager = isManagerRole(req.role);

        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = requireOrganization;
