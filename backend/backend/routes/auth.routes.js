const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const {
            fullName,
            email,
            invitationCode,
            password,
            role
        } = req.body;

        if (!fullName || !email || !invitationCode || !password || !role) {
            return res.status(400).json({
                status: "ERROR",
                message: "Full name, email, invitation code, password, and role are required"
            });
        }

        if (role !== "manager" && role !== "employee") {
            return res.status(400).json({
                status: "ERROR",
                message: "Invalid role"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase()
            }
        });

        if (existingUser) {
            return res.status(409).json({
                status: "ERROR",
                message: "An account with this email already exists"
            });
        }

        const invitation = await prisma.invitation.findUnique({
            where: {
                code: invitationCode
            }
        });

        if (!invitation) {
            return res.status(400).json({
                status: "ERROR",
                message: "Invalid invitation code"
            });
        }

        if (invitation.used) {
            return res.status(400).json({
                status: "ERROR",
                message: "This invitation code has already been used"
            });
        }

        if (invitation.role !== role) {
            return res.status(400).json({
                status: "ERROR",
                message: "This invitation is not valid for the selected role"
            });
        }

        if (
            invitation.expiresAt &&
            new Date() > invitation.expiresAt
        ) {
            return res.status(400).json({
                status: "ERROR",
                message: "This invitation code has expired"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: fullName,
                    email: email.toLowerCase(),
                    passwordHash
                }
            });

            const membership = await tx.membership.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId: user.id,
                    role: role
                }
            });

            await tx.invitation.update({
                where: {
                    id: invitation.id
                },
                data: {
                    used: true
                }
            });

            return {
                user,
                membership
            };
        });

        res.status(201).json({
            status: "OK",
            message: "Account created successfully",
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
            status: "ERROR",
            message: "Something went wrong during signup"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const {
            email,
            password,
            role
        } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                status: "ERROR",
                message: "Email, password, and role are required"
            });
        }

        if (role !== "manager" && role !== "employee") {
            return res.status(400).json({
                status: "ERROR",
                message: "Invalid role"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase()
            }
        });

        if (!user) {
            return res.status(401).json({
                status: "ERROR",
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                status: "ERROR",
                message: "Invalid email or password"
            });
        }

        const membership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                role: role
            }
        });

        if (!membership) {
            return res.status(403).json({
                status: "ERROR",
                message: "You do not have access with this role"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                organizationId: membership.organizationId,
                role: membership.role
            },
            process.env.JWT_SECRET || "qveto-super-secret-jwt-signing-key-production-ready",
            {
                expiresIn: "1d"
            }
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
            role: membership.role,
            organizationId: membership.organizationId
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            status: "ERROR",
            message: "Something went wrong during login"
        });
    }
});

module.exports = router;
