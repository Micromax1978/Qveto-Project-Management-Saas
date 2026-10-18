const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "qveto_jwt_secret_dev";

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
    try {
        const { fullName, name, email, invitationCode, password, role } = req.body;
        const userName = fullName || name;

        // 1. Validate required fields
        if (!userName || !email || !invitationCode || !password || !role) {
            return res.status(400).json({
                error: "Full name, email, invitation code, password, and role are required",
                status: "ERROR",
                message: "Full name, email, invitation code, password, and role are required"
            });
        }

        const normalizedRole = role.toUpperCase();
        if (normalizedRole !== "MANAGER" && normalizedRole !== "EMPLOYEE") {
            return res.status(400).json({
                error: "Invalid role. Role must be manager or employee",
                status: "ERROR",
                message: "Invalid role"
            });
        }

        // 2. Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(409).json({
                error: "An account with this email already exists",
                status: "ERROR",
                message: "An account with this email already exists"
            });
        }

        // 3. Find invitation
        const invitation = await prisma.invitation.findUnique({
            where: { code: invitationCode }
        });

        if (!invitation) {
            return res.status(400).json({
                error: "Invalid invitation code",
                status: "ERROR",
                message: "Invalid invitation code"
            });
        }

        if (invitation.used) {
            return res.status(400).json({
                error: "This invitation code has already been used",
                status: "ERROR",
                message: "This invitation code has already been used"
            });
        }

        if (invitation.role.toUpperCase() !== normalizedRole) {
            return res.status(400).json({
                error: "This invitation is not valid for the selected role",
                status: "ERROR",
                message: "This invitation is not valid for the selected role"
            });
        }

        if (invitation.expiresAt && new Date() > invitation.expiresAt) {
            return res.status(400).json({
                error: "This invitation code has expired",
                status: "ERROR",
                message: "This invitation code has expired"
            });
        }

        // 4. Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // 5. Create user, membership, and mark invitation used
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: userName,
                    email: email.toLowerCase(),
                    passwordHash
                }
            });

            const membership = await tx.membership.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId: newUser.id,
                    role: normalizedRole
                }
            });

            await tx.invitation.update({
                where: { id: invitation.id },
                data: { used: true }
            });

            return { user: newUser, membership };
        });

        // 6. Generate JWT token
        const token = jwt.sign(
            {
                userId: result.user.id,
                organizationId: result.membership.organizationId,
                role: result.membership.role
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            status: "OK",
            message: "Account created successfully",
            token,
            user: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email
            },
            role: result.membership.role,
            organizationId: result.membership.organizationId
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            error: "Something went wrong during signup",
            status: "ERROR",
            message: "Something went wrong during signup"
        });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
                status: "ERROR",
                message: "Email and password are required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({
                error: "Invalid email or password",
                status: "ERROR",
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password",
                status: "ERROR",
                message: "Invalid email or password"
            });
        }

        // If role specified, verify membership matches that role
        let membership = null;
        if (role) {
            const normalizedRole = role.toUpperCase();
            membership = await prisma.membership.findFirst({
                where: {
                    userId: user.id,
                    role: normalizedRole
                }
            });

            if (!membership) {
                return res.status(403).json({
                    error: "You do not have access with this role",
                    status: "ERROR",
                    message: "You do not have access with this role"
                });
            }
        } else {
            // Pick primary membership
            membership = await prisma.membership.findFirst({
                where: { userId: user.id }
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                organizationId: membership ? membership.organizationId : null,
                role: membership ? membership.role : null
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            status: "OK",
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            role: membership ? membership.role : null,
            organizationId: membership ? membership.organizationId : null
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Something went wrong during login",
            status: "ERROR",
            message: "Something went wrong during login"
        });
    }
});

module.exports = router;
