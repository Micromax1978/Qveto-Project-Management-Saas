const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth.middleware");
const requireOrganization = require("../middleware/organization.middleware");
const { rateLimit } = require("../lib/rateLimit");
const { HttpError } = require("../lib/errors");
const { requireString, isValidEmail } = require("../lib/validation");

const router = express.Router();

// Used so a login for an unknown email takes about as long as a real one.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const ASSIGNABLE_SIGNUP_ROLES = ["manager", "employee"];

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyFn: (req) => `${req.ip}:${String((req.body && req.body.email) || "").toLowerCase()}`
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20
});

router.post("/signup", signupLimiter, async (req, res) => {
    const body = req.body || {};

    if (!body.fullName || !body.email || !body.invitationCode || !body.password || !body.role) {
        throw new HttpError(400, "Full name, email, invitation code, password, and role are required");
    }

    const fullName = requireString(body.fullName, "Full name", { min: 2, max: 100 });
    const invitationCode = requireString(body.invitationCode, "Invitation code", { max: 100 });

    if (!isValidEmail(body.email)) {
        throw new HttpError(400, "A valid email address is required");
    }

    if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 128) {
        throw new HttpError(400, "Password must be between 8 and 128 characters");
    }

    if (!ASSIGNABLE_SIGNUP_ROLES.includes(body.role)) {
        throw new HttpError(400, "Invalid role");
    }

    const email = body.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        throw new HttpError(409, "An account with this email already exists");
    }

    const invitation = await prisma.invitation.findUnique({
        where: { code: invitationCode }
    });

    if (!invitation) {
        throw new HttpError(400, "Invalid invitation code");
    }

    if (invitation.used) {
        throw new HttpError(400, "This invitation code has already been used");
    }

    if (invitation.role !== body.role) {
        throw new HttpError(400, "This invitation is not valid for the selected role");
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        throw new HttpError(400, "This invitation code has expired");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx) => {
        // Claim the invitation atomically so it cannot be used twice by
        // two simultaneous requests.
        const claimed = await tx.invitation.updateMany({
            where: { id: invitation.id, used: false },
            data: { used: true }
        });

        if (claimed.count !== 1) {
            throw new HttpError(400, "This invitation code has already been used");
        }

        const user = await tx.user.create({
            data: { name: fullName, email, passwordHash }
        });

        const membership = await tx.membership.create({
            data: {
                organizationId: invitation.organizationId,
                userId: user.id,
                role: body.role
            }
        });

        return { user, membership };
    });

    return res.status(201).json({
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
});

router.post("/login", loginLimiter, async (req, res) => {
    const { email, password, role } = req.body || {};

    if (!email || !password || !role) {
        throw new HttpError(400, "Email, password, and role are required");
    }

    if (typeof email !== "string" || typeof password !== "string") {
        throw new HttpError(400, "Email and password must be strings");
    }

    if (!ASSIGNABLE_SIGNUP_ROLES.includes(role)) {
        throw new HttpError(400, "Invalid role");
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
    });

    const passwordMatch = await bcrypt.compare(
        password,
        user ? user.passwordHash : DUMMY_HASH
    );

    if (!user || !passwordMatch) {
        throw new HttpError(401, "Invalid email or password");
    }

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id, role }
    });

    if (!membership) {
        throw new HttpError(403, "You do not have access with this role");
    }

    const token = jwt.sign(
        {
            userId: user.id,
            organizationId: membership.organizationId,
            role: membership.role
        },
        process.env.JWT_SECRET,
        { algorithm: "HS256", expiresIn: "1d" }
    );

    return res.status(200).json({
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
});

// GET /api/auth/me - current user, role and organization
router.get("/me", authenticateToken, requireOrganization, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, name: true, email: true }
    });

    const organization = await prisma.organization.findUnique({
        where: { id: req.organizationId },
        select: { id: true, name: true }
    });

    return res.json({
        status: "OK",
        user,
        role: req.role,
        organization
    });
});

module.exports = router;
