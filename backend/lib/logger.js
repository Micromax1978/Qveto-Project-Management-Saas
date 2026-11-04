// Minimal structured logger.
// - Writes JSON lines to stdout/stderr.
// - Writes error-level entries to logs/error.log (disable with LOG_TO_FILE=false).
// - LOG_LEVEL: debug | info | warn | error | silent (silent by default in tests).
const fs = require("fs");
const path = require("path");

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "..", "logs");

function currentLevel() {
    const configured = process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info");
    return LEVELS[configured] === undefined ? LEVELS.info : LEVELS[configured];
}

function appendToFile(fileName, line) {
    if (process.env.LOG_TO_FILE === "false" || process.env.NODE_ENV === "test") {
        return;
    }

    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
        fs.appendFileSync(path.join(LOG_DIR, fileName), `${line}\n`);
    } catch (error) {
        // Never let logging break the app.
        process.stderr.write(`Failed to write log file: ${error.message}\n`);
    }
}

function write(level, message, meta) {
    if (LEVELS[level] < currentLevel()) {
        return;
    }

    const entry = { time: new Date().toISOString(), level, message, ...meta };

    if (meta && meta.error instanceof Error) {
        entry.error = { name: meta.error.name, message: meta.error.message, stack: meta.error.stack };
    }

    const line = JSON.stringify(entry);

    if (level === "error" || level === "warn") {
        process.stderr.write(`${line}\n`);
    } else {
        process.stdout.write(`${line}\n`);
    }

    if (level === "error") {
        appendToFile("error.log", line);
    }
}

module.exports = {
    debug: (message, meta) => write("debug", message, meta),
    info: (message, meta) => write("info", message, meta),
    warn: (message, meta) => write("warn", message, meta),
    error: (message, meta) => write("error", message, meta),
    appendToFile
};
