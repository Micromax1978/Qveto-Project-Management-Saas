// Shared helpers for the API tests. Requires a PostgreSQL database
// (DATABASE_URL) with migrations applied: `npx prisma migrate deploy`.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-test-secret-test";

const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "qveto-api-uploads-"));

const bcrypt = require("bcrypt");
const prisma = require("../../lib/prisma");
const app = require("../../app");

const PASSWORD = "Password123!";
let server;
let baseUrl;
let counter = 0;

async function start() {
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stop() {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
}

// Raw fetch against the test server (for malformed requests).
function raw(url, init) {
    return fetch(baseUrl + url, init);
}

function uid() {
    counter += 1;
    return `${Date.now().toString(36)}${counter}${Math.random().toString(36).slice(2, 6)}`;
}

// Minimal HTTP client. `token` adds the Authorization header.
async function api(method, url, { token, body, form, headers } = {}) {
    const init = { method, headers: { ...(headers || {}) } };

    if (token) {
        init.headers.Authorization = `Bearer ${token}`;
    }

    if (form) {
        init.body = form;
    } else if (body !== undefined) {
        init.headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
    }

    const res = await fetch(baseUrl + url, init);
    const type = res.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await res.json() : Buffer.from(await res.arrayBuffer());

    return { status: res.status, data, headers: res.headers };
}

// Creates an organization with one manager and the given employees (users are
// written directly to the database, then logged in through the real API).
async function createOrg(employeeNames = ["alice", "bob"]) {
    const tag = uid();
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    const org = await prisma.organization.create({ data: { name: `Org ${tag}` } });

    const make = async (name, role) => {
        const user = await prisma.user.create({
            data: { name: `${name} ${tag}`, email: `${name}.${tag}@test.local`, passwordHash }
        });
        await prisma.membership.create({ data: { organizationId: org.id, userId: user.id, role } });

        const login = await api("POST", "/api/auth/login", {
            body: { email: user.email, password: PASSWORD, role }
        });

        if (login.status !== 200) {
            throw new Error(`Login failed for ${name}: ${JSON.stringify(login.data)}`);
        }

        return { id: user.id, name: user.name, email: user.email, token: login.data.token, role };
    };

    const manager = await make("manager", "manager");
    const employees = {};

    for (const name of employeeNames) {
        employees[name] = await make(name, "employee");
    }

    return { org, manager, ...employees };
}

// Manager creates a project containing the given users.
async function createProject(manager, members = [], name) {
    const res = await api("POST", "/api/projects", {
        token: manager.token,
        body: { name: name || `Project ${uid()}`, memberIds: members.map((member) => member.id) }
    });

    if (res.status !== 201) {
        throw new Error(`Project creation failed: ${JSON.stringify(res.data)}`);
    }

    return res.data.project;
}

async function createTask(user, projectId, extra = {}) {
    const res = await api("POST", "/api/tasks", {
        token: user.token,
        body: { projectId, title: `Task ${uid()}`, ...extra }
    });

    if (res.status !== 201) {
        throw new Error(`Task creation failed: ${JSON.stringify(res.data)}`);
    }

    return res.data.task;
}

function fileForm(name, content, type = "application/octet-stream") {
    const form = new FormData();
    form.append("file", new Blob([content], { type }), name);
    return form;
}

module.exports = {
    prisma,
    PASSWORD,
    start,
    stop,
    uid,
    api,
    raw,
    createOrg,
    createProject,
    createTask,
    fileForm
};
