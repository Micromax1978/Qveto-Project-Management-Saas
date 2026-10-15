require("dotenv").config();
const express = require("express");
const prisma = require("./lib/prisma");

const app = express();

const PORT = 5000;

// Middleware to read JSON data
app.use(express.json());

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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});