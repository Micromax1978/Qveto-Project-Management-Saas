const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const { api, prisma } = h;

test.before(() => h.start());
test.after(() => h.stop());

// ---------------------------------------------------------------- auth
test("auth: signup with invitation, login, /me, and bad credentials", async () => {
    const org = await prisma.organization.create({ data: { name: `Auth Org ${h.uid()}` } });
    const code = `INV-${h.uid()}`;
    await prisma.invitation.create({ data: { code, organizationId: org.id, role: "employee" } });
    const email = `new.${h.uid()}@test.local`;

    const bad = await api("POST", "/api/auth/signup", {
        body: { fullName: "New User", email, invitationCode: "nope", password: "Password123!", role: "employee" }
    });
    assert.equal(bad.status, 400);

    const wrongRole = await api("POST", "/api/auth/signup", {
        body: { fullName: "New User", email, invitationCode: code, password: "Password123!", role: "manager" }
    });
    assert.equal(wrongRole.status, 400);

    const ok = await api("POST", "/api/auth/signup", {
        body: { fullName: "New User", email, invitationCode: code, password: "Password123!", role: "employee" }
    });
    assert.equal(ok.status, 201);

    const reuse = await api("POST", "/api/auth/signup", {
        body: { fullName: "Other", email: `o.${h.uid()}@test.local`, invitationCode: code, password: "Password123!", role: "employee" }
    });
    assert.equal(reuse.status, 400, "an invitation can only be used once");

    const login = await api("POST", "/api/auth/login", { body: { email, password: "Password123!", role: "employee" } });
    assert.equal(login.status, 200);

    const me = await api("GET", "/api/auth/me", { token: login.data.token });
    assert.equal(me.status, 200);
    assert.equal(me.data.role, "employee");
    assert.equal(me.data.organization.id, org.id);

    const wrongPassword = await api("POST", "/api/auth/login", { body: { email, password: "wrong-password", role: "employee" } });
    assert.equal(wrongPassword.status, 401);

    const noToken = await api("GET", "/api/auth/me");
    assert.equal(noToken.status, 401);

    const garbage = await api("GET", "/api/auth/me", { token: "not.a.jwt" });
    assert.equal(garbage.status, 401);
});

test("auth: removed members lose access immediately", async () => {
    const t = await h.createOrg(["alice"]);
    assert.equal((await api("GET", "/api/projects", { token: t.alice.token })).status, 200);

    await prisma.membership.deleteMany({ where: { userId: t.alice.id } });

    assert.equal((await api("GET", "/api/projects", { token: t.alice.token })).status, 403);
});

test("unknown routes return JSON 404 and malformed JSON returns 400", async () => {
    const t = await h.createOrg([]);
    const missing = await api("GET", "/api/nope", { token: t.manager.token });
    assert.equal(missing.status, 404);
    assert.equal(missing.data.status, "ERROR");

    const res = await h.raw("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t.manager.token}` },
        body: "{ not json"
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).message, "Invalid JSON body");
});

// ---------------------------------------------------------------- projects & members
test("projects: only managers create; creator becomes a member; names are unique", async () => {
    const t = await h.createOrg(["alice"]);

    const denied = await api("POST", "/api/projects", { token: t.alice.token, body: { name: "Nope" } });
    assert.equal(denied.status, 403);

    const created = await api("POST", "/api/projects", {
        token: t.manager.token,
        body: { name: "Alpha", description: "First", memberIds: [t.alice.id] }
    });
    assert.equal(created.status, 201);
    const ids = created.data.project.projectMembers.map((m) => m.userId).sort();
    assert.deepEqual(ids, [t.manager.id, t.alice.id].sort());

    const dup = await api("POST", "/api/projects", { token: t.manager.token, body: { name: "alpha" } });
    assert.equal(dup.status, 409);

    const empty = await api("POST", "/api/projects", { token: t.manager.token, body: { name: "   " } });
    assert.equal(empty.status, 400);

    const aliceNotification = await prisma.notification.count({
        where: { userId: t.alice.id, type: "PROJECT_MEMBER_ADDED" }
    });
    assert.equal(aliceNotification, 1);
});

test("projects: members are validated and employees only see their own projects", async () => {
    const t = await h.createOrg(["alice", "bob"]);
    const other = await h.createOrg(["carol"]);

    const foreign = await api("POST", "/api/projects", {
        token: t.manager.token,
        body: { name: "Bad", memberIds: [other.carol.id] }
    });
    assert.equal(foreign.status, 400, "cannot add users from another organization");

    const shared = await h.createProject(t.manager, [t.alice], "Shared");
    const hidden = await h.createProject(t.manager, [], "Hidden");

    const list = await api("GET", "/api/projects", { token: t.alice.token });
    const names = list.data.projects.map((p) => p.name);
    assert.ok(names.includes("Shared"));
    assert.ok(!names.includes("Hidden"));

    assert.equal((await api("GET", `/api/projects/${hidden.id}`, { token: t.alice.token })).status, 404);
    assert.equal((await api("GET", `/api/projects/${shared.id}`, { token: t.alice.token })).status, 200);
    assert.equal((await api("GET", `/api/projects/${shared.id}`, { token: t.bob.token })).status, 404);
    assert.equal((await api("GET", `/api/projects/${shared.id}`, { token: other.manager.token })).status, 404);

    const managerList = await api("GET", "/api/projects", { token: t.manager.token });
    assert.equal(managerList.data.total, 2);
});

test("project members: add, duplicate, remove (unassigns tasks), permissions", async () => {
    const t = await h.createOrg(["alice", "bob"]);
    const other = await h.createOrg(["carol"]);
    const project = await h.createProject(t.manager, [t.alice]);

    const byEmployee = await api("POST", `/api/projects/${project.id}/members`, {
        token: t.alice.token,
        body: { userId: t.bob.id }
    });
    assert.equal(byEmployee.status, 403);

    const added = await api("POST", `/api/projects/${project.id}/members`, {
        token: t.manager.token,
        body: { userId: t.bob.id }
    });
    assert.equal(added.status, 201);

    const dup = await api("POST", `/api/projects/${project.id}/members`, {
        token: t.manager.token,
        body: { userId: t.bob.id }
    });
    assert.equal(dup.status, 409);

    const foreign = await api("POST", `/api/projects/${project.id}/members`, {
        token: t.manager.token,
        body: { userId: other.carol.id }
    });
    assert.equal(foreign.status, 400);

    const task = await h.createTask(t.manager, project.id, { assigneeId: t.bob.id });
    assert.equal(task.assignee.id, t.bob.id);

    const removed = await api("DELETE", `/api/projects/${project.id}/members/${t.bob.id}`, { token: t.manager.token });
    assert.equal(removed.status, 200);
    assert.equal(removed.data.unassignedTasks, 1);

    const after = await api("GET", `/api/tasks/${task.id}`, { token: t.manager.token });
    assert.equal(after.data.task.assigneeId, null);

    assert.equal((await api("GET", `/api/projects/${project.id}`, { token: t.bob.token })).status, 404);

    const list = await api("GET", `/api/projects/${project.id}/members`, { token: t.alice.token });
    assert.equal(list.data.count, 2);
});

test("projects: update and delete are manager-only; delete cascades", async () => {
    const t = await h.createOrg(["alice"]);
    const project = await h.createProject(t.manager, [t.alice], "Old name");
    const task = await h.createTask(t.manager, project.id);

    assert.equal((await api("PATCH", `/api/projects/${project.id}`, { token: t.alice.token, body: { name: "X" } })).status, 403);

    const renamed = await api("PATCH", `/api/projects/${project.id}`, {
        token: t.manager.token,
        body: { name: "New name", description: "Updated" }
    });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.data.project.name, "New name");

    assert.equal((await api("PATCH", `/api/projects/${project.id}`, { token: t.manager.token, body: {} })).status, 400);

    assert.equal((await api("DELETE", `/api/projects/${project.id}`, { token: t.alice.token })).status, 403);
    assert.equal((await api("DELETE", `/api/projects/${project.id}`, { token: t.manager.token })).status, 200);
    assert.equal((await api("GET", `/api/tasks/${task.id}`, { token: t.manager.token })).status, 404);
    assert.equal(await prisma.task.count({ where: { id: task.id } }), 0);
});

// ---------------------------------------------------------------- tasks CRUD + validation
test("tasks: create, read, update, delete with full field validation", async () => {
    const t = await h.createOrg(["alice", "bob"]);
    const project = await h.createProject(t.manager, [t.alice]);

    const created = await api("POST", "/api/tasks", {
        token: t.alice.token,
        body: {
            projectId: project.id,
            title: "  Write docs  ",
            description: "Explain things",
            priority: "HIGH",
            dueDate: "2030-01-15",
            assigneeId: t.alice.id,
            labels: ["Docs", "docs", "urgent"]
        }
    });
    assert.equal(created.status, 201);
    const task = created.data.task;
    assert.equal(task.title, "Write docs");
    assert.equal(task.status, "TODO");
    assert.equal(task.priority, "HIGH");
    assert.equal(task.dueDate, "2030-01-15T23:59:59.999Z");
    assert.equal(task.labels.length, 2, "labels are de-duplicated case-insensitively");
    assert.equal(task.isOverdue, false);
    assert.equal(task.version, 1);

    const bad = [
        { title: "" },
        { title: "x", priority: "SUPER" },
        { title: "x", status: "WRONG" },
        { title: "x", dueDate: "2026-02-30" },
        { title: "x", dueDate: "soon" },
        { title: "x", assigneeId: t.bob.id },
        { title: "x", labels: "bug" },
        { title: "x".repeat(201) }
    ];

    for (const body of bad) {
        const res = await api("POST", "/api/tasks", { token: t.alice.token, body: { projectId: project.id, ...body } });
        assert.equal(res.status, 400, `should reject ${JSON.stringify(body).slice(0, 60)}`);
    }

    assert.equal((await api("POST", "/api/tasks", { token: t.alice.token, body: { title: "no project" } })).status, 400);

    const updated = await api("PATCH", `/api/tasks/${task.id}`, {
        token: t.alice.token,
        body: { title: "Write better docs", priority: "LOW", dueDate: null, description: null }
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.task.title, "Write better docs");
    assert.equal(updated.data.task.dueDate, null);
    assert.equal(updated.data.task.version, 2);

    assert.equal((await api("PATCH", `/api/tasks/${task.id}`, { token: t.alice.token, body: {} })).status, 400);
    assert.equal((await api("PATCH", `/api/tasks/${task.id}`, { token: t.alice.token, body: { priority: "NOPE" } })).status, 400);

    // Only the creator or a manager may delete.
    await api("POST", `/api/projects/${project.id}/members`, { token: t.manager.token, body: { userId: t.bob.id } });
    assert.equal((await api("DELETE", `/api/tasks/${task.id}`, { token: t.bob.token })).status, 403);
    assert.equal((await api("DELETE", `/api/tasks/${task.id}`, { token: t.alice.token })).status, 200);
    assert.equal((await api("GET", `/api/tasks/${task.id}`, { token: t.alice.token })).status, 404);
});

test("tasks: assignment emits activity and a notification", async () => {
    const t = await h.createOrg(["alice"]);
    const project = await h.createProject(t.manager, [t.alice]);
    const task = await h.createTask(t.manager, project.id);

    const res = await api("PATCH", `/api/tasks/${task.id}`, { token: t.manager.token, body: { assigneeId: t.alice.id } });
    assert.equal(res.status, 200);

    const notifications = await api("GET", "/api/notifications", { token: t.alice.token });
    assert.ok(notifications.data.notifications.some((n) => n.type === "TASK_ASSIGNED" && n.taskId === task.id));

    const activity = await api("GET", `/api/tasks/${task.id}/activity`, { token: t.manager.token });
    const types = activity.data.activities.map((a) => a.type);
    assert.ok(types.includes("TASK_CREATED"));
    assert.ok(types.includes("TASK_ASSIGNED"));

    const unassign = await api("PATCH", `/api/tasks/${task.id}`, { token: t.manager.token, body: { assigneeId: null } });
    assert.equal(unassign.data.task.assigneeId, null);
});

// ---------------------------------------------------------------- tenant isolation
test("isolation: tasks are scoped to the user's organization and projects", async () => {
    const a = await h.createOrg(["alice", "bob"]);
    const b = await h.createOrg(["carol"]);
    const projectA = await h.createProject(a.manager, [a.alice], "A project");
    const projectB = await h.createProject(b.manager, [b.carol], "B project");
    const taskA = await h.createTask(a.manager, projectA.id);
    const taskB = await h.createTask(b.manager, projectB.id);

    // Another organization cannot see, edit or delete anything.
    for (const [method, url, body] of [
        ["GET", `/api/tasks/${taskA.id}`],
        ["PATCH", `/api/tasks/${taskA.id}`, { title: "hacked" }],
        ["PATCH", `/api/tasks/${taskA.id}/status`, { status: "DONE" }],
        ["DELETE", `/api/tasks/${taskA.id}`],
        ["POST", `/api/tasks/${taskA.id}/subtasks`, { title: "x" }],
        ["POST", `/api/tasks/${taskA.id}/labels`, { name: "x" }],
        ["GET", `/api/tasks/${taskA.id}/comments`],
        ["POST", `/api/tasks/${taskA.id}/comments`, { body: "hi" }],
        ["GET", `/api/tasks/${taskA.id}/attachments`],
        ["GET", `/api/tasks/${taskA.id}/activity`]
    ]) {
        const res = await api(method, url, { token: b.manager.token, body });
        assert.equal(res.status, 404, `${method} ${url} should be 404 for another org`);
    }

    assert.equal((await api("POST", "/api/tasks", { token: b.manager.token, body: { projectId: projectA.id, title: "x" } })).status, 404);
    assert.equal((await api("GET", `/api/tasks?projectId=${projectA.id}`, { token: b.manager.token })).status, 404);

    // Same organization, but not a member of the project.
    assert.equal((await api("GET", `/api/tasks/${taskA.id}`, { token: a.bob.token })).status, 404);
    assert.equal((await api("POST", "/api/tasks", { token: a.bob.token, body: { projectId: projectA.id, title: "x" } })).status, 404);

    // Lists never leak other projects' tasks.
    const bobList = await api("GET", "/api/tasks", { token: a.bob.token });
    assert.equal(bobList.data.total, 0);
    const bList = await api("GET", "/api/tasks", { token: b.manager.token });
    assert.deepEqual(bList.data.tasks.map((x) => x.id), [taskB.id]);

    // Assignees must belong to the project.
    const cross = await api("PATCH", `/api/tasks/${taskA.id}`, { token: a.manager.token, body: { assigneeId: b.carol.id } });
    assert.equal(cross.status, 400);
    const notInProject = await api("PATCH", `/api/tasks/${taskA.id}`, { token: a.manager.token, body: { assigneeId: a.bob.id } });
    assert.equal(notInProject.status, 400);
});

test("isolation: labels are organization-scoped", async () => {
    const a = await h.createOrg([]);
    const b = await h.createOrg([]);
    const pa = await h.createProject(a.manager);
    const pb = await h.createProject(b.manager);
    const ta = await h.createTask(a.manager, pa.id, { labels: ["shared-name"] });
    const tb = await h.createTask(b.manager, pb.id, { labels: ["shared-name"] });

    assert.notEqual(ta.labels[0].id, tb.labels[0].id);

    const orgLabels = await api("GET", "/api/organization/labels", { token: a.manager.token });
    assert.equal(orgLabels.data.count, 1);

    // A label id from another organization cannot be detached through this task.
    const res = await api("DELETE", `/api/tasks/${ta.id}/labels/${tb.labels[0].id}`, { token: a.manager.token });
    assert.equal(res.status, 404);
});

// ---------------------------------------------------------------- filters
test("filters: status, priority, assignee, label, search, overdue, due range, sort, paging", async () => {
    const t = await h.createOrg(["alice"]);
    const project = await h.createProject(t.manager, [t.alice]);
    const day = 86400000;
    const iso = (offset) => new Date(Date.now() + offset * day).toISOString();

    const t1 = await h.createTask(t.manager, project.id, { title: "Alpha bug", priority: "HIGH", assigneeId: t.alice.id, dueDate: iso(-2), labels: ["bug"] });
    const t2 = await h.createTask(t.manager, project.id, { title: "Beta feature", priority: "LOW", status: "IN_PROGRESS", dueDate: iso(5) });
    const t3 = await h.createTask(t.manager, project.id, { title: "Gamma done", priority: "HIGH", status: "DONE", dueDate: iso(-10) });
    const t4 = await h.createTask(t.manager, project.id, { title: "Delta" });

    const ids = async (qs) => (await api("GET", `/api/tasks?projectId=${project.id}&${qs}`, { token: t.manager.token })).data.tasks.map((x) => x.id).sort();
    const sorted = (...tasks) => tasks.map((x) => x.id).sort();

    assert.deepEqual(await ids("status=DONE"), sorted(t3));
    assert.deepEqual(await ids("status=TODO,IN_PROGRESS"), sorted(t1, t2, t4));
    assert.deepEqual(await ids("priority=HIGH"), sorted(t1, t3));
    assert.deepEqual(await ids(`assigneeId=${t.alice.id}`), sorted(t1));
    assert.deepEqual(await ids("assigneeId=unassigned"), sorted(t2, t3, t4));
    assert.deepEqual(await ids("label=BUG"), sorted(t1));
    assert.deepEqual(await ids("q=beta"), sorted(t2));
    assert.deepEqual(await ids("overdue=true"), sorted(t1), "DONE tasks are never overdue");
    assert.deepEqual(await ids(`dueAfter=${encodeURIComponent(iso(0))}`), sorted(t2));
    assert.deepEqual(await ids(`dueBefore=${encodeURIComponent(iso(0))}`), sorted(t1, t3));

    const mine = await api("GET", `/api/tasks?projectId=${project.id}&assigneeId=me`, { token: t.alice.token });
    assert.deepEqual(mine.data.tasks.map((x) => x.id), [t1.id]);

    const byTitle = await api("GET", `/api/tasks?projectId=${project.id}&sort=title&order=desc`, { token: t.manager.token });
    assert.deepEqual(byTitle.data.tasks.map((x) => x.title), ["Gamma done", "Delta", "Beta feature", "Alpha bug"]);

    const page = await api("GET", `/api/tasks?projectId=${project.id}&sort=title&pageSize=2&page=2`, { token: t.manager.token });
    assert.equal(page.data.count, 2);
    assert.equal(page.data.total, 4);

    for (const qs of ["status=NOPE", "priority=NOPE", "sort=password", "order=sideways", "page=0", "pageSize=9999", "status=TODO&status=DONE"]) {
        const res = await api("GET", `/api/tasks?projectId=${project.id}&${qs}`, { token: t.manager.token });
        assert.equal(res.status, 400, `should reject ${qs}`);
    }

    const overdue = await api("GET", "/api/tasks/overdue", { token: t.manager.token });
    assert.deepEqual(overdue.data.tasks.map((x) => x.id), [t1.id]);
    assert.equal(overdue.data.tasks[0].isOverdue, true);
});

test("empty states: a new project has no tasks and zero stats", async () => {
    const t = await h.createOrg([]);
    const project = await h.createProject(t.manager);

    const list = await api("GET", `/api/tasks?projectId=${project.id}`, { token: t.manager.token });
    assert.equal(list.status, 200);
    assert.equal(list.data.total, 0);
    assert.deepEqual(list.data.tasks, []);

    const none = await api("GET", "/api/tasks", { token: t.manager.token });
    assert.equal(none.status, 200);
    assert.equal(none.data.total, 0);

    const alone = await h.createOrg(["alice"]);
    const noProjects = await api("GET", "/api/projects", { token: alone.alice.token });
    assert.equal(noProjects.data.total, 0);
    const overview = await api("GET", "/api/analytics/overview", { token: alone.alice.token });
    assert.equal(overview.status, 200);
    assert.equal(overview.data.projectCount, 0);
    assert.equal(overview.data.totals.completionRate, 0);
});

// ---------------------------------------------------------------- kanban
test("kanban: status move, positions, completedAt, and re-open permission", async () => {
    const t = await h.createOrg(["alice"]);
    const project = await h.createProject(t.manager, [t.alice]);
    const a = await h.createTask(t.alice, project.id, { title: "A" });
    const b = await h.createTask(t.alice, project.id, { title: "B" });
    const c = await h.createTask(t.alice, project.id, { title: "C" });

    assert.deepEqual([a.position, b.position, c.position], [0, 1, 2]);

    const move = await api("PATCH", `/api/tasks/${a.id}/status`, { token: t.alice.token, body: { status: "IN_PROGRESS" } });
    assert.equal(move.status, 200);
    assert.equal(move.data.task.status, "IN_PROGRESS");
    assert.equal(move.data.move.from, "TODO");
    assert.equal(move.data.move.position, 0);

    // Insert C into IN_PROGRESS at the top: A shifts down.
    const insert = await api("PATCH", `/api/tasks/${c.id}/status`, { token: t.alice.token, body: { status: "IN_PROGRESS", position: 0 } });
    assert.equal(insert.data.move.position, 0);

    const column = await api("GET", `/api/tasks?projectId=${project.id}&status=IN_PROGRESS`, { token: t.alice.token });
    assert.deepEqual(column.data.tasks.map((x) => x.title), ["C", "A"]);

    // Reorder inside the same column (keyboard "move down").
    const reorder = await api("PATCH", `/api/tasks/${c.id}/status`, { token: t.alice.token, body: { status: "IN_PROGRESS", position: 1 } });
    assert.equal(reorder.status, 200);
    const column2 = await api("GET", `/api/tasks?projectId=${project.id}&status=IN_PROGRESS`, { token: t.alice.token });
    assert.deepEqual(column2.data.tasks.map((x) => x.title), ["A", "C"]);

    const done = await api("PATCH", `/api/tasks/${a.id}/status`, { token: t.alice.token, body: { status: "DONE" } });
    assert.ok(done.data.task.completedAt);

    // Employees cannot re-open DONE tasks; managers can.
    const reopen = await api("PATCH", `/api/tasks/${a.id}/status`, { token: t.alice.token, body: { status: "TODO" } });
    assert.equal(reopen.status, 403);
    const managerReopen = await api("PATCH", `/api/tasks/${a.id}/status`, { token: t.manager.token, body: { status: "TODO" } });
    assert.equal(managerReopen.status, 200);
    assert.equal(managerReopen.data.task.completedAt, null);

    // Invalid input.
    assert.equal((await api("PATCH", `/api/tasks/${b.id}/status`, { token: t.alice.token, body: { status: "NOPE" } })).status, 400);
    assert.equal((await api("PATCH", `/api/tasks/${b.id}/status`, { token: t.alice.token, body: { status: "TODO", position: -1 } })).status, 400);
    assert.equal((await api("PATCH", `/api/tasks/${b.id}/status`, { token: t.alice.token, body: { status: "TODO", position: "1" } })).status, 400);

    // Positions inside every column are contiguous.
    const all = await api("GET", `/api/tasks?projectId=${project.id}`, { token: t.alice.token });
    const byColumn = {};
    for (const task of all.data.tasks) {
        (byColumn[task.status] = byColumn[task.status] || []).push(task.position);
    }
    for (const positions of Object.values(byColumn)) {
        assert.deepEqual(positions.sort((x, y) => x - y), positions.map((_, i) => i));
    }

    const activity = await api("GET", `/api/projects/${project.id}/activity?type=TASK_STATUS_CHANGED`, { token: t.manager.token });
    assert.ok(activity.data.total >= 3);
});

test("concurrent updates: a stale version is rejected with 409", async () => {
    const t = await h.createOrg(["alice"]);
    const project = await h.createProject(t.manager, [t.alice]);
    const task = await h.createTask(t.manager, project.id);

    const first = await api("PATCH", `/api/tasks/${task.id}`, { token: t.alice.token, body: { title: "Alice edit", version: 1 } });
    assert.equal(first.status, 200);
    assert.equal(first.data.task.version, 2);

    const stale = await api("PATCH", `/api/tasks/${task.id}`, { token: t.manager.token, body: { title: "Manager edit", version: 1 } });
    assert.equal(stale.status, 409);
    assert.equal(stale.data.code, "VERSION_CONFLICT");

    const staleMove = await api("PATCH", `/api/tasks/${task.id}/status`, { token: t.manager.token, body: { status: "DONE", version: 1 } });
    assert.equal(staleMove.status, 409);

    const fresh = await api("GET", `/api/tasks/${task.id}`, { token: t.manager.token });
    assert.equal(fresh.data.task.title, "Alice edit");

    const retry = await api("PATCH", `/api/tasks/${task.id}`, { token: t.manager.token, body: { title: "Manager edit", version: fresh.data.task.version } });
    assert.equal(retry.status, 200);
});

test("concurrent updates: simultaneous edits with the same version - exactly one wins", async () => {
    const t = await h.createOrg(["alice"]);
    const project = await h.createProject(t.manager, [t.alice]);
    const task = await h.createTask(t.manager, project.id);

    const results = await Promise.all(
        ["one", "two", "three", "four"].map((title) =>
            api("PATCH", `/api/tasks/${task.id}`, { token: t.manager.token, body: { title, version: 1 } })
        )
    );

    const statuses = results.map((r) => r.status).sort();
    assert.deepEqual(statuses, [200, 409, 409, 409]);
});

test("concurrent creates: positions stay unique enough to order and tasks are all created", async () => {
    const t = await h.createOrg([]);
    const project = await h.createProject(t.manager);

    const results = await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
            api("POST", "/api/tasks", { token: t.manager.token, body: { projectId: project.id, title: `T${i}` } })
        )
    );

    assert.ok(results.every((r) => r.status === 201));
    const list = await api("GET", `/api/tasks?projectId=${project.id}`, { token: t.manager.token });
    assert.equal(list.data.total, 6);
});

// ---------------------------------------------------------------- subtasks & labels
test("subtasks: create, complete, rename, delete and counters", async () => {
    const t = await h.createOrg(["alice"]);
    const project = await h.createProject(t.manager, [t.alice]);
    const task = await h.createTask(t.alice, project.id);

    const s1 = await api("POST", `/api/tasks/${task.id}/subtasks`, { token: t.alice.token, body: { title: "Step 1" } });
    const s2 = await api("POST", `/api/tasks/${task.id}/subtasks`, { token: t.alice.token, body: { title: "Step 2" } });
    assert.equal(s1.status, 201);
    assert.equal(s1.data.subtask.status, "TODO");

    assert.equal((await api("POST", `/api/tasks/${task.id}/subtasks`, { token: t.alice.token, body: { title: "" } })).status, 400);

    const done = await api("PATCH", `/api/tasks/${task.id}/subtasks/${s1.data.subtask.id}`, { token: t.alice.token, body: { status: "DONE" } });
    assert.equal(done.status, 200);
    assert.equal((await api("PATCH", `/api/tasks/${task.id}/subtasks/${s1.data.subtask.id}`, { token: t.alice.token, body: { status: "MAYBE" } })).status, 400);
    assert.equal((await api("PATCH", `/api/tasks/${task.id}/subtasks/${s2.data.subtask.id}`, { token: t.alice.token, body: { title: "Renamed" } })).status, 200);

    const detail = await api("GET", `/api/tasks/${task.id}`, { token: t.alice.token });
    assert.equal(detail.data.task.subtaskTotal, 2);
    assert.equal(detail.data.task.subtaskDone, 1);
    assert.equal(detail.data.task.subtasks.length, 2);

    // A subtask id from a different task is not reachable.
    const other = await h.createTask(t.alice, project.id);
    assert.equal((await api("PATCH", `/api/tasks/${other.id}/subtasks/${s1.data.subtask.id}`, { token: t.alice.token, body: { status: "TODO" } })).status, 404);

    assert.equal((await api("DELETE", `/api/tasks/${task.id}/subtasks/${s2.data.subtask.id}`, { token: t.alice.token })).status, 200);
    assert.equal((await api("DELETE", `/api/tasks/${task.id}/subtasks/${s2.data.subtask.id}`, { token: t.alice.token })).status, 404);
});

test("labels: attach, reuse, color validation, detach", async () => {
    const t = await h.createOrg([]);
    const project = await h.createProject(t.manager);
    const task1 = await h.createTask(t.manager, project.id);
    const task2 = await h.createTask(t.manager, project.id);

    const attached = await api("POST", `/api/tasks/${task1.id}/labels`, { token: t.manager.token, body: { name: "Frontend", color: "#FF8800" } });
    assert.equal(attached.status, 201);
    assert.equal(attached.data.labels[0].color, "#ff8800");

    const again = await api("POST", `/api/tasks/${task1.id}/labels`, { token: t.manager.token, body: { name: "frontend" } });
    assert.equal(again.status, 200);
    assert.equal(again.data.labels.length, 1);

    const reuse = await api("POST", `/api/tasks/${task2.id}/labels`, { token: t.manager.token, body: { name: "FRONTEND" } });
    assert.equal(reuse.data.labels[0].id, attached.data.labels[0].id);

    assert.equal((await api("POST", `/api/tasks/${task1.id}/labels`, { token: t.manager.token, body: { name: "x", color: "red" } })).status, 400);
    assert.equal((await api("POST", `/api/tasks/${task1.id}/labels`, { token: t.manager.token, body: {} })).status, 400);

    assert.equal((await api("DELETE", `/api/tasks/${task1.id}/labels/${attached.data.labels[0].id}`, { token: t.manager.token })).status, 200);
    assert.equal((await api("DELETE", `/api/tasks/${task1.id}/labels/${attached.data.labels[0].id}`, { token: t.manager.token })).status, 404);

    const stillThere = await api("GET", `/api/tasks/${task2.id}`, { token: t.manager.token });
    assert.equal(stillThere.data.task.labels.length, 1);
});
