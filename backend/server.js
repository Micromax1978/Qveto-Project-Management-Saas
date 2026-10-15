
require("dotenv").config();

const express = require("express");
const prisma = require("./config/prisma");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

// Basic server check
app.get("/", (req, res) => {
    res.send("Qveto SaaS Backend is running!");
});

// Database health check
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

// Add other API routes here as they become available.

// Error handler must be registered after routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
