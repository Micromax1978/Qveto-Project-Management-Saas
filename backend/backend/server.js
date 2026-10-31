const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const organizationRoutes = require("./routes/organization.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        version: "Week-2",
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        status: "ERROR",
        message: "Internal server error"
    });
});

if (require.main === module) {
    const PORT = process.env.BACKEND_PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Qveto Backend listening on port ${PORT}`);
    });
}

module.exports = app;
