process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");
const prisma = require("../config/prisma");

// Test organization and fixture IDs
let testOrg;
let testUser;
let testWorkspace;
let createdProjectId;
let createdTaskId;

test.before(async () => {
    // Ensure test organization exists
    testOrg = await prisma.organization.upsert({
        where: { id: "test-org-w2-integration" },
        update: {},
        create: {
            id: "test-org-w2-integration",
            name: "Week 2 Test Organization"
        }
    });

    testUser = await prisma.user.upsert({
        where: { email: "tester.w2@example.com" },
        update: {},
        create: {
            id: "test-user-w2-integration",
            name: "Week 2 Tester",
            email: "tester.w2@example.com"
        }
    });

    testWorkspace = await prisma.workspace.create({
        data: {
            name: "Integration Test Workspace",
            organizationId: testOrg.id
        }
    });
});

test.after(async () => {
    try {
        if (createdTaskId) {
            await prisma.task.deleteMany({ where: { organizationId: testOrg.id } });
        }
        if (createdProjectId) {
            await prisma.project.deleteMany({ where: { organizationId: testOrg.id } });
        }
        if (testWorkspace) {
            await prisma.workspace.deleteMany({ where: { organizationId: testOrg.id } });
        }
        if (testOrg) {
            await prisma.organization.deleteMany({ where: { id: testOrg.id } });
        }
        if (testUser) {
            await prisma.user.deleteMany({ where: { id: testUser.id } });
        }
    } catch (e) {
        // Cleanup best effort
    }
    await prisma.$disconnect();
});

test("Full Flow: Create Project -> Create Task -> Move Task (Kanban) -> Filter & Search", async () => {
    // 1. Create Project
    const projRes = await request(app)
        .post("/api/projects")
        .set("x-organization-id", testOrg.id)
        .send({
            name: "Integration Sprint Project",
            description: "Testing full project lifecycle and task execution",
            workspaceId: testWorkspace.id
        });

    assert.equal(projRes.status, 201);
    assert.ok(projRes.body.id);
    assert.equal(projRes.body.name, "Integration Sprint Project");
    assert.equal(projRes.body.taskCount, 0);
    assert.equal(projRes.body.progress, 0);
    createdProjectId = projRes.body.id;

    // 2. Create Task within the project
    const taskRes = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .send({
            title: "Build Kanban Board Integration",
            description: "Connect Kanban cards to real-time status update endpoints",
            projectId: createdProjectId,
            status: "TODO",
            priority: "HIGH",
            label: "Frontend",
            dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        });

    assert.equal(taskRes.status, 201);
    assert.ok(taskRes.body.id);
    assert.equal(taskRes.body.title, "Build Kanban Board Integration");
    assert.equal(taskRes.body.status, "TODO");
    assert.equal(taskRes.body.priority, "HIGH");
    assert.equal(taskRes.body.label, "Frontend");
    createdTaskId = taskRes.body.id;

    // 3. Move Task using dedicated Kanban Status endpoint
    const moveRes = await request(app)
        .patch(`/api/tasks/${createdTaskId}/status`)
        .set("x-organization-id", testOrg.id)
        .send({ status: "IN_PROGRESS" });

    assert.equal(moveRes.status, 200);
    assert.equal(moveRes.body.status, "IN_PROGRESS");

    // 4. Move Task to DONE via general update endpoint
    const doneRes = await request(app)
        .patch(`/api/tasks/${createdTaskId}`)
        .set("x-organization-id", testOrg.id)
        .send({ status: "DONE" });

    assert.equal(doneRes.status, 200);
    assert.equal(doneRes.body.status, "DONE");

    // 5. Search tasks by text substring
    const searchRes = await request(app)
        .get("/api/tasks?search=kanban")
        .set("x-organization-id", testOrg.id);

    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.body.tasks.length >= 1);
    assert.equal(searchRes.body.tasks[0].id, createdTaskId);

    // 6. Filter tasks by status and label
    const filterRes = await request(app)
        .get("/api/tasks?status=DONE&label=Frontend")
        .set("x-organization-id", testOrg.id);

    assert.equal(filterRes.status, 200);
    assert.equal(filterRes.body.count, 1);
    assert.equal(filterRes.body.tasks[0].id, createdTaskId);

    // 7. Verify project metrics updated with 100% progress
    const projectDetailRes = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set("x-organization-id", testOrg.id);

    assert.equal(projectDetailRes.status, 200);
    assert.equal(projectDetailRes.body.metrics.totalTasks, 1);
    assert.equal(projectDetailRes.body.metrics.completedTasks, 1);
    assert.equal(projectDetailRes.body.metrics.progressPercentage, 100);
});

test("Kanban View: GET /api/tasks?view=kanban groups cards by status columns", async () => {
    const res = await request(app)
        .get("/api/tasks?view=kanban")
        .set("x-organization-id", testOrg.id);

    assert.equal(res.status, 200);
    assert.ok(res.body.columns);
    assert.ok(res.body.columns.todo);
    assert.ok(res.body.columns.inProgress);
    assert.ok(res.body.columns.inReview);
    assert.ok(res.body.columns.done);
    assert.equal(res.body.columns.done.count, 1);
    assert.equal(res.body.columns.done.tasks[0].id, createdTaskId);
});

test("Multi-Criteria Search & Filter Options", async () => {
    // Create second task with LOW priority and Backend label
    const t2 = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .send({
            title: "Database Index Tuning",
            projectId: createdProjectId,
            status: "TODO",
            priority: "LOW",
            label: "Backend"
        });
    assert.equal(t2.status, 201);

    // Filter by priority=LOW
    const lowRes = await request(app)
        .get("/api/tasks?priority=LOW")
        .set("x-organization-id", testOrg.id);
    assert.equal(lowRes.status, 200);
    const lowTask = lowRes.body.tasks.find((t) => t.id === t2.body.id);
    assert.ok(lowTask, "Task with LOW priority must be in results");

    // Filter by multiple statuses: status=TODO,DONE
    const multiStatusRes = await request(app)
        .get("/api/tasks?status=TODO,DONE")
        .set("x-organization-id", testOrg.id);
    assert.equal(multiStatusRes.status, 200);
    assert.ok(multiStatusRes.body.tasks.length >= 2);

    // Filter by unassigned
    const unassignedRes = await request(app)
        .get("/api/tasks?assigneeId=unassigned")
        .set("x-organization-id", testOrg.id);
    assert.equal(unassignedRes.status, 200);
    assert.ok(unassignedRes.body.tasks.length >= 1);
});

test("Validation & Error Responses: 400 Bad Request", async () => {
    // Missing required fields on task creation
    const resNoTitle = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .send({ projectId: createdProjectId });

    assert.equal(resNoTitle.status, 400);
    assert.match(resNoTitle.body.error, /Missing required field/);

    // Nonexistent project reference
    const resBadProj = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .send({
            title: "Valid Title",
            projectId: "nonexistent-project-uuid"
        });

    assert.equal(resBadProj.status, 400);
    assert.match(resBadProj.body.error, /does not exist in this organization/);

    // Invalid status enum
    const resBadStatus = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .send({
            title: "Valid Title",
            projectId: createdProjectId,
            status: "NON_EXISTENT_STATUS"
        });

    assert.equal(resBadStatus.status, 400);
    assert.match(resBadStatus.body.error, /Invalid value for 'status'/);

    // Invalid date string
    const resBadDate = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .send({
            title: "Valid Title",
            projectId: createdProjectId,
            dueDate: "not-a-valid-date"
        });

    assert.equal(resBadDate.status, 400);
    assert.match(resBadDate.body.error, /Invalid dueDate format/);
});

test("Tenant Isolation & 404 Handlers", async () => {
    // Attempt to access task using a different organization ID
    const crossOrgRes = await request(app)
        .get(`/api/tasks/${createdTaskId}`)
        .set("x-organization-id", "foreign-org-id-999");

    assert.equal(crossOrgRes.status, 404);
    assert.match(crossOrgRes.body.error, /Task not found/);

    // Attempt to access project with nonexistent ID
    const notFoundProj = await request(app)
        .get("/api/projects/nonexistent-proj-id")
        .set("x-organization-id", testOrg.id);

    assert.equal(notFoundProj.status, 404);
    assert.match(notFoundProj.body.error, /Project not found/);
});
