require("dotenv").config();

const logger = require("./lib/logger");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    logger.error("JWT_SECRET must be set to a random string of at least 16 characters");
    process.exit(1);
}

const prisma = require("./lib/prisma");
const app = require("./app");
const { scanOverdueTasks } = require("./services/overdue.service");

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});

// Overdue scan: every OVERDUE_SCAN_INTERVAL_MS (default 15 minutes, 0 disables it).
const scanIntervalMs = process.env.OVERDUE_SCAN_INTERVAL_MS === undefined
    ? 15 * 60 * 1000
    : Number(process.env.OVERDUE_SCAN_INTERVAL_MS);

let scanTimer = null;

if (scanIntervalMs > 0) {
    const runScan = async () => {
        try {
            const result = await scanOverdueTasks();

            if (result.notified > 0) {
                logger.info("Overdue scan created notifications", result);
            }
        } catch (error) {
            logger.error("Overdue scan failed", { error });
        }
    };

    scanTimer = setInterval(runScan, scanIntervalMs);
    scanTimer.unref();
    runScan();
}

async function shutdown(signal) {
    logger.info(`${signal} received, shutting down`);

    if (scanTimer) {
        clearInterval(scanTimer);
    }

    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });

    // Force exit if connections do not close in time.
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { error: reason instanceof Error ? reason : new Error(String(reason)) });
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { error });
    process.exit(1);
});
