require("dotenv").config();

const express = require("express");
const prisma = require("./config/prisma");
const errorHandler = require("./middleware/errorHandler");

// Import route modules
const userRoutes = require("./routes/userRoutes");
const orgRoutes = require("./routes/orgRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Qveto SaaS Backend is running!",
        version: "1.0.0",
        docs: "/docs/backend-setup.md"
    });
});

// Database health check endpoint
app.get("/health", async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: "OK",
            message: "Backend and database are connected"
        });
    } catch (error) {
        next(error);
    }
});

// Mount core API routes (Week 1 initial API routes)
app.use("/api/users", userRoutes);
app.use("/api/organizations", orgRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

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
