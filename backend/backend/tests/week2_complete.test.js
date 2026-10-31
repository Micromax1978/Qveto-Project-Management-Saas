const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const app = require("../server");
const prisma = require("../lib/prisma");

function makeRequest(server, method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const port = address.port;

        const options = {
            hostname: "127.0.0.1",
            port,
            path,
            method,
            headers: {
                "Content-Type": "application/json",
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", chunk => { data += chunk; });
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });

        req.on("error", reject);

        if (body) {
            req.write(typeof body === "string" ? body : JSON.stringify(body));
        }
        req.end();
    });
}

test("Auth: Login as Manager returns 200 and valid JWT token", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const res = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.status, "OK");
        assert.ok(res.body.token);
        assert.equal(res.body.role, "manager");
    } finally {
        server.close();
    }
});

test("Auth: Missing token on protected endpoint returns 401", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const res = await makeRequest(server, "GET", "/api/projects");
        assert.equal(res.status, 401);
    } finally {
        server.close();
    }
});

test("Auth: Invalid token format returns 401", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const res = await makeRequest(server, "GET", "/api/projects", {
            Authorization: "Bearer invalid.fake.token"
        });
        assert.equal(res.status, 401);
    } finally {
        server.close();
    }
});

test("Projects: Manager can create a project successfully", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/projects", {
            Authorization: `Bearer ${token}`
        }, {
            name: "Alpha Test Launch Week 2",
            description: "High priority platform initiative"
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.status, "OK");
        assert.equal(res.body.project.name, "Alpha Test Launch Week 2");
    } finally {
        server.close();
    }
});

test("Projects: Duplicate project name within same organization returns 400", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/projects", {
            Authorization: `Bearer ${token}`
        }, {
            name: "Qveto Core SaaS"
        });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /already exists/i);
    } finally {
        server.close();
    }
});

test("Projects: Employee cannot create projects (RBAC returns 403)", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "employee@qveto.com",
            password: "Password123!",
            role: "employee"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/projects", {
            Authorization: `Bearer ${token}`
        }, {
            name: "Unauthorized Project"
        });

        assert.equal(res.status, 403);
    } finally {
        server.close();
    }
});

test("Project Members: Manager can add valid organization user to project", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/projects/proj_mobile_1/members", {
            Authorization: `Bearer ${token}`
        }, {
            userId: "user_emp_1"
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.status, "OK");
    } finally {
        server.close();
    }
});

test("Project Members: Adding user from external organization is rejected with 400", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/projects/proj_core_1/members", {
            Authorization: `Bearer ${token}`
        }, {
            userId: "user_external_999"
        });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /organization/i);
    } finally {
        server.close();
    }
});

test("Tasks: Create task with valid fields and priority returns 201", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/tasks", {
            Authorization: `Bearer ${token}`
        }, {
            projectId: "proj_core_1",
            title: "Configure Database Backups",
            priority: "HIGH",
            status: "TODO",
            dueDate: "2026-12-01T00:00:00Z"
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.task.title, "Configure Database Backups");
        assert.equal(res.body.task.priority, "HIGH");
    } finally {
        server.close();
    }
});

test("Tasks: Invalid priority value is rejected with 400", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/tasks", {
            Authorization: `Bearer ${token}`
        }, {
            projectId: "proj_core_1",
            title: "Task with bad priority",
            priority: "CRITICAL_NON_EXISTENT"
        });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /priority/i);
    } finally {
        server.close();
    }
});

test("Tasks: Supports frontend URGENT priority and REVIEW status", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/tasks", {
            Authorization: `Bearer ${token}`
        }, {
            projectId: "proj_core_1",
            title: "Frontend Review Sync",
            priority: "URGENT",
            status: "REVIEW"
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.task.priority, "URGENT");
        assert.equal(res.body.task.status, "REVIEW");
    } finally {
        server.close();
    }
});

test("Tasks: Assignee outside project is rejected with 400", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        await prisma.projectMember.deleteMany({
            where: {
                projectId: "proj_mobile_1",
                userId: "user_emp_1"
            }
        });

        const res = await makeRequest(server, "POST", "/api/tasks", {
            Authorization: `Bearer ${token}`
        }, {
            projectId: "proj_mobile_1",
            title: "Mobile Task for Unassigned Dev",
            assigneeId: "user_emp_1"
        });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /member of this project/i);
    } finally {
        server.close();
    }
});

test("Kanban: PATCH /api/tasks/:id/status updates status and position", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "PATCH", "/api/tasks/task_5/status", {
            Authorization: `Bearer ${token}`
        }, {
            status: "IN_PROGRESS",
            orderIndex: 2
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.task.status, "IN_PROGRESS");
        assert.equal(res.body.task.orderIndex, 2);
    } finally {
        server.close();
    }
});

test("Subtasks: Add subtask to task returns 201", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const login = await makeRequest(server, "POST", "/api/auth/login", {}, {
            email: "manager@qveto.com",
            password: "Password123!",
            role: "manager"
        });
        const token = login.body.token;

        const res = await makeRequest(server, "POST", "/api/tasks/task_5/subtasks", {
            Authorization: `Bearer ${token}`
        }, {
            title: "Write assertion helpers"
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.subtask.title, "Write assertion helpers");
        assert.equal(res.body.subtask.isCompleted, false);
    } finally {
        server.close();
    }
});

test("Security: Cross-organization task access is completely masked with 404", async () => {
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        const secret = process.env.JWT_SECRET || "qveto-super-secret-jwt-signing-key-production-ready";
        const foreignToken = jwt.sign({
            userId: "user_foreign_99",
            organizationId: "org_foreign_different_tenant",
            role: "manager"
        }, secret, { expiresIn: "1h" });

        const res = await makeRequest(server, "GET", "/api/tasks/task_1", {
            Authorization: `Bearer ${foreignToken}`
        });

        assert.equal(res.status, 404);
        assert.match(res.body.message, /not found|access denied/i);
    } finally {
        server.close();
    }
});
