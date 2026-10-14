const express = require("express");

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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});