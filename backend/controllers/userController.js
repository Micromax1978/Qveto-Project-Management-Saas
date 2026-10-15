const prisma = require("../config/prisma");

// GET /api/users
async function getUsers(req, res, next) {
    try {
        const { search, organizationId } = req.query;

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } }
            ];
        }

        if (organizationId) {
            where.memberships = {
                some: { organizationId }
            };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                memberships: {
                    select: {
                        organizationId: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/users/:id
async function getUserById(req, res, next) {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                memberships: {
                    include: { organization: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: `User not found with id: ${id}` });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
}

// POST /api/users
async function createUser(req, res, next) {
    try {
        const { name, email, organizationId, role } = req.body;

        const existing = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() }
        });

        if (existing) {
            return res.status(409).json({ error: `A user with email '${email}' already exists.` });
        }

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                ...(organizationId
                    ? {
                        memberships: {
                            create: {
                                organizationId,
                                role: role || "EMPLOYEE"
                            }
                        }
                    }
                    : {})
            },
            include: {
                memberships: true
            }
        });

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getUsers,
    getUserById,
    createUser
};
