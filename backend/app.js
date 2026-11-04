// Builds the Express app. server.js starts it; the tests import it directly.
const express = require("express");
const prisma = require("./lib/prisma");
const { requestContext, notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const organizationRoutes = require("./routes/organization.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const projectRoutes = require("./routes/project.routes");
const commentRoutes = require("./routes/comment.routes");
const attachmentRoutes = require("./routes/attachment.routes");
const taskRoutes = require("./routes/task.routes");
const notificationRoutes = require("./routes/notification.routes");
const analyticsRoutes = require("./routes/analytics.routes");

const app = express();

app.disable("x-powered-by");

if (process.env.TRUST_PROXY) {
    app.set("trust proxy", 1);
}

app.use(requestContext);

// CORS: set CORS_ORIGIN to a comma-separated list of allowed origins ("*" allows all).
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes("*") || allowedOrigins.includes(origin))) {
        res.set("Access-Control-Allow-Origin", allowedOrigins.includes("*") ? "*" : origin);
        res.set("Vary", "Origin");
        res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set("Access-Control-Expose-Headers", "Content-Disposition, X-Request-Id");
    }

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    return next();
});

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
    res.json({ message: "Qveto SaaS Backend is running!" });
});

// Liveness: the process is up.
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Backend is healthy",
        uptimeSeconds: Math.round(process.uptime())
    });
});

// Readiness: the database answers.
app.get("/api/ready", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "OK", message: "Database connection successful" });
    } catch (error) {
        res.status(503).json({ status: "ERROR", message: "Database connection failed" });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
// Comment/attachment routers define explicit /tasks/... and /comments|attachments/... paths,
// so they are mounted before the task router.
app.use("/api", commentRoutes);
app.use("/api", attachmentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
