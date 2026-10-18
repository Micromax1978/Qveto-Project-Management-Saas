require("dotenv").config();

const express = require("express");
const prisma = require("./lib/prisma");
const authRoutes = require("./routes/auth.routes");
const authenticateToken = require("./middleware/auth.middleware");
const requireRole = require("./middleware/role.middleware");
const requireOrganization = require("./middleware/organization.middleware");
const organizationRoutes = require("./routes/organization.routes");

const app = express();

const PORT = 5000;

// Middleware to read JSON data
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/organization", organizationRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Qveto SaaS Backend is running!"
    });
});

// Health check route
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Backend is healthy"
    });
});

// Database connection test
app.get("/api/db-test", async (req, res) => {
    try {
        const organizations = await prisma.organization.findMany();

        res.json({
            status: "OK",
            message: "Database connection successful",
            organizationCount: organizations.length
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "ERROR",
            message: "Database connection failed"
        });
    }
});

// Protected route - requires JWT authentication
app.get("/api/protected-test", authenticateToken, (req, res) => {
    res.json({
        status: "OK",
        message: "Authentication successful",
        user: req.user
    });
});

app.get(
    "/api/manager-test",
    authenticateToken,
    requireRole("owner", "manager"),
    (req, res) => {
        res.json({
            status: "OK",
            message: "Manager/Owner access granted",
            user: req.user
        });
    }
);

app.get(
    "/api/organization-test",
    authenticateToken,
    requireOrganization,
    (req, res) => {
        res.json({
            status: "OK",
            message: "Organization access granted",
            organizationId: req.organizationId,
            user: req.user
        });
    }
);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});