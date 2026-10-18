const prisma = require("../config/prisma");

// GET /api/organizations
async function getOrganizations(req, res, next) {
    try {
        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        memberships: true,
                        projects: true,
                        tasks: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({
            count: organizations.length,
            organizations
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/organizations/:id
async function getOrganizationById(req, res, next) {
    try {
        const { id } = req.params;

        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                workspaces: true,
                teams: true,
                memberships: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                projects: {
                    select: { id: true, name: true, description: true }
                }
            }
        });

        if (!organization) {
            return res.status(404).json({ error: `Organization not found with id: ${id}` });
        }

        res.json(organization);
    } catch (error) {
        next(error);
    }
}

// POST /api/organizations
async function createOrganization(req, res, next) {
    try {
        const { name, ownerId } = req.body;

        const organization = await prisma.organization.create({
            data: {
                name: name.trim(),
                ...(ownerId
                    ? {
                        memberships: {
                            create: {
                                userId: ownerId,
                                role: "OWNER"
                            }
                        }
                    }
                    : {})
            },
            include: {
                memberships: true
            }
        });

        res.status(201).json(organization);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getOrganizations,
    getOrganizationById,
    createOrganization
};
