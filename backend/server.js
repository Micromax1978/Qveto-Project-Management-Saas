require("dotenv").config();

const express = require("express");
const prisma = require("./config/prisma");
const errorHandler = require("./middleware/errorHandler");

// Import middleware for testing endpoints
const authenticateToken = require("./middleware/auth.middleware");
const requireRole = require("./middleware/role.middleware");
const requireOrganization = require("./middleware/organization.middleware");

// Import route modules
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/userRoutes");
const orgRoutes = require("./routes/orgRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app = express();

// Enable CORS for frontend integration
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-organization-id, x-user-id");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Qveto SaaS Backend is running!",
        version: "1.0.0",
        docs: "/docs/backend-setup.md"
    });
});

// Database health check endpoint (supports /health and /api/health)
const healthHandler = async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: "OK",
            message: "Backend and database are connected"
        });
    } catch (error) {
        next(error);
    }
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// Database connection test endpoint (Member 2 test route)
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
            message: "Database connection failed",
            error: "Database connection failed"
        });
    }
});

// Protected test endpoint (Member 2 test route)
app.get("/api/protected-test", authenticateToken, (req, res) => {
    res.json({
        status: "OK",
        message: "Authentication successful",
        user: req.user
    });
});

// Manager/Owner test endpoint (Member 2 test route)
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

// Organization test endpoint (Member 2 test route)
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

const organizationRoutes = require("./routes/organization.routes");

// Mount core API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Error handler must be registered after all routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
