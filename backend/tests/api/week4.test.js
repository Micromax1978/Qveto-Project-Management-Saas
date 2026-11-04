const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("./helpers");

const { api, prisma } = h;

test.before(() => h.start());
test.after(() => h.stop());

test("analytics: project dashboard numbers are correct", async () => {
    const t = await h.createOrg(["alice", "bob"]);
    const project = await h.createProject(t.manager, [t.alice, t.bob]);
    const day = 86400000;
    const iso = (offset) => new Date(Date.now() + offset * day).toISOString();

    await h.createTask(t.manager, project.id, { title: "t1", status: "TODO", priority: "HIGH", assigneeId: t.alice.id, dueDate: iso(-1) }); // overdue
    await h.createTask(t.manager, project.id, { title: "t2", status: "IN_PROGRESS", priority: "LOW", assigneeId: t.alice.id, dueDate: iso(3) }); // due soon
    await h.createTask(t.manager, project.id, { title: "t3", status: "REVIEW", assigneeId: t.bob.id });
    await h.createTask(t.manager, project.id, { title: "t4", status: "DONE", priority: "HIGH", assigneeId: t.bob.id, dueDate: iso(-5) }); // done: not overdue
    await h.createTask(t.manager, project.id, { title: "t5", status: "TODO" }); // unassigned

    const res = await api("GET", `/api/analytics/projects/${project.id}`, { token: t.alice.token });
    assert.equal(res.status, 200);
    const d = res.data;

    assert.deepEqual(d.summary, { total: 5, done: 1, open: 4, overdue: 1, dueSoon: 1, completionRate: 20 });
    assert.deepEqual(d.byStatus, { TODO: 2, IN_PROGRESS: 1, REVIEW: 1, DONE: 1 });
    assert.equal(d.byPriority.HIGH, 2);
    assert.equal(d.byPriority.LOW, 1);
    assert.equal(d.byPriority.NONE, 2);
    assert.equal(d.byPriority.URGENT, 0);

    const byName = Object.fromEntries(d.workload.map((w) => [w.name.split(" ")[0], w]));
    assert.equal(byName.alice.open, 2);
    assert.equal(byName.alice.overdue, 1);
    assert.equal(byName.bob.open, 1);
    assert.equal(byName.bob.done, 1);
    assert.equal(byName.manager.open, 0);
    assert.equal(byName.Unassigned.open, 1);

    assert.equal(d.completionTrend.length, 14);
    assert.equal(d.completionTrend.reduce((sum, x) => sum + x.completed, 0), 1);
    assert.equal(d.activity.daily.length, 14);
    assert.ok(d.activity.daily.reduce((sum, x) => sum + x.count, 0) >= 6);
    assert.ok(d.activity.recent.length > 0 && d.activity.recent.length <= 10);
});

test("analytics: empty project returns zeros, not errors", async () => {
    const t = await h.createOrg([]);
    const project = await h.createProject(t.manager);

    const res = await api("GET", `/api/analytics/projects/${project.id}`, { token: t.manager.token });
    assert.equal(res.status, 200);
    assert.equal(res.data.summary.total, 0);
    assert.equal(res.data.summary.completionRate, 0);
    assert.deepEqual(res.data.byStatus, { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 });
});

test("analytics: role permissions and tenant scoping", async () => {
    const t = await h.createOrg(["alice", "bob"]);
    const other = await h.createOrg([]);
    const project = await h.createProject(t.manager, [t.alice]);

    assert.equal((await api("GET", `/api/analytics/projects/${project.id}`, { token: t.bob.token })).status, 404);
    assert.equal((await api("GET", `/api/analytics/projects/${project.id}`, { token: other.manager.token })).status, 404);
    assert.equal((await api("GET", `/api/analytics/projects/${project.id}`)).status, 401);
    assert.equal((await api("GET", `/api/analytics/projects/${project.id}`, { token: t.alice.token })).status, 200);
});

test("analytics: overview aggregates accessible projects and my workload", async () => {
    const t = await h.createOrg(["alice"]);
    const p1 = await h.createProject(t.manager, [t.alice], "P1");
    const p2 = await h.createProject(t.manager, [], "P2");
    const hidden = Date.now() - 86400000;

    await h.createTask(t.manager, p1.id, { status: "DONE", assigneeId: t.alice.id });
    await h.createTask(t.manager, p1.id, { assigneeId: t.alice.id, dueDate: new Date(hidden).toISOString() });
    await h.createTask(t.manager, p2.id, {});

    const alice = await api("GET", "/api/analytics/overview", { token: t.alice.token });
    assert.equal(alice.data.projectCount, 1, "employees only see their projects");
    assert.deepEqual(alice.data.totals, { total: 2, done: 1, overdue: 1, completionRate: 50 });
    assert.deepEqual(alice.data.mine, { open: 1, overdue: 1 });

    const manager = await api("GET", "/api/analytics/overview", { token: t.manager.token });
    assert.equal(manager.data.projectCount, 2);
    assert.equal(manager.data.totals.total, 3);
});

test("project list includes progress counts", async () => {
    const t = await h.createOrg([]);
    const project = await h.createProject(t.manager, [], "Progress");
    await h.createTask(t.manager, project.id, { status: "DONE" });
    await h.createTask(t.manager, project.id, {});

    const res = await api("GET", "/api/projects", { token: t.manager.token });
    const row = res.data.projects.find((p) => p.id === project.id);
    assert.equal(row.taskCount, 2);
    assert.equal(row.doneCount, 1);
    assert.equal(row.progress, 50);
    assert.equal(row.memberCount, 1);
});

test("health and readiness endpoints", async () => {
    const health = await api("GET", "/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.data.status, "OK");

    const ready = await api("GET", "/api/ready");
    assert.equal(ready.status, 200);
    assert.ok(health.headers.get("x-request-id"));
    assert.equal(health.headers.get("x-powered-by"), null);
});

test("organization and workspace endpoints", async () => {
    const t = await h.createOrg(["alice"]);

    const members = await api("GET", "/api/organization/members", { token: t.alice.token });
    assert.equal(members.data.memberCount, 2);

    assert.equal((await api("POST", "/api/workspaces", { token: t.alice.token, body: { name: "Nope" } })).status, 403);
    const created = await api("POST", "/api/workspaces", { token: t.manager.token, body: { name: "Engineering" } });
    assert.equal(created.status, 201);

    const list = await api("GET", "/api/workspaces", { token: t.alice.token });
    assert.ok(list.data.workspaces.some((w) => w.name === "Engineering"));

    // A project can target a specific workspace, but not another organization's.
    const other = await h.createOrg([]);
    const foreign = await api("POST", "/api/projects", {
        token: other.manager.token,
        body: { name: "Steal", workspaceId: created.data.workspace.id }
    });
    assert.equal(foreign.status, 404);
});

test("rate limiting protects login when enabled", async () => {
    process.env.RATE_LIMIT_FORCE = "true";

    try {
        const t = await h.createOrg([]);
        let last;

        for (let i = 0; i < 12; i += 1) {
            last = await api("POST", "/api/auth/login", {
                body: { email: t.manager.email, password: "wrong-password", role: "manager" }
            });
        }

        assert.equal(last.status, 429);
        assert.ok(last.headers.get("retry-after"));
    } finally {
        delete process.env.RATE_LIMIT_FORCE;
    }
});

test("database seed data model sanity: org deletion is restricted while data exists", async () => {
    const t = await h.createOrg([]);
    await assert.rejects(() => prisma.organization.delete({ where: { id: t.org.id } }));
});
