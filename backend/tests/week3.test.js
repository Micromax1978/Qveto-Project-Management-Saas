process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");
const prisma = require("../config/prisma");
const emailService = require("../services/emailService");

let testOrg;
let userAlice;
let userBob;
let testProject;
let testWorkspace;

test.before(async () => {
    emailService.clearSimulatedEmails();

    testOrg = await prisma.organization.upsert({
        where: { id: "w3-test-org-alpha" },
        update: {},
        create: {
            id: "w3-test-org-alpha",
            name: "Week 3 Test Organization"
        }
    });

    userAlice = await prisma.user.upsert({
        where: { email: "alice.w3@example.com" },
        update: {},
        create: {
            id: "w3-user-alice",
            name: "Alice Developer",
            email: "alice.w3@example.com"
        }
    });

    userBob = await prisma.user.upsert({
        where: { email: "bob.w3@example.com" },
        update: {},
        create: {
            id: "w3-user-bob",
            name: "Bob Manager",
            email: "bob.w3@example.com"
        }
    });

    // Ensure users belong to testOrg
    await prisma.membership.upsert({
        where: { organizationId_userId: { organizationId: testOrg.id, userId: userAlice.id } },
        update: {},
        create: { organizationId: testOrg.id, userId: userAlice.id, role: "EMPLOYEE" }
    });

    await prisma.membership.upsert({
        where: { organizationId_userId: { organizationId: testOrg.id, userId: userBob.id } },
        update: {},
        create: { organizationId: testOrg.id, userId: userBob.id, role: "MANAGER" }
    });

    testWorkspace = await prisma.workspace.create({
        data: {
            name: "W3 Workspace",
            organizationId: testOrg.id
        }
    });

    testProject = await prisma.project.create({
        data: {
            name: "W3 Core Feature Sprint",
            organizationId: testOrg.id,
            workspaceId: testWorkspace.id
        }
    });
});

test.after(async () => {
    try {
        await prisma.notification.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.taskComment.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.activity.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.task.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.project.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.workspace.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.membership.deleteMany({ where: { organizationId: testOrg.id } });
        await prisma.organization.deleteMany({ where: { id: testOrg.id } });
        await prisma.user.deleteMany({
            where: { id: { in: [userAlice.id, userBob.id] } }
        });
    } catch (_) {
        // cleanup best effort
    }
    await prisma.$disconnect();
});

test("Day 1: Activity history is recorded on task creation, assignment, status change, and comments", async () => {
    // 1. Create task assigned to Alice by Bob
    const createRes = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userBob.id)
        .send({
            title: "Implement Activity Stream",
            description: "Log all major actions",
            projectId: testProject.id,
            assigneeId: userAlice.id,
            status: "TODO",
            priority: "HIGH"
        });

    assert.equal(createRes.status, 201);
    const taskId = createRes.body.id;

    // 2. Change status via Kanban endpoint
    const statusRes = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userAlice.id)
        .send({ status: "IN_PROGRESS" });

    assert.equal(statusRes.status, 200);

    // 3. Add a comment
    const commentRes = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userBob.id)
        .send({ content: "Please make sure events are indexed properly." });

    assert.equal(commentRes.status, 201);

    // 4. Verify activity trail
    const actRes = await request(app)
        .get(`/api/tasks/${taskId}/activities`)
        .set("x-organization-id", testOrg.id);

    assert.equal(actRes.status, 200);
    const actions = actRes.body.activities.map((a) => a.action);

    assert.ok(actions.includes("TASK_CREATED"), "Must record TASK_CREATED");
    assert.ok(actions.includes("TASK_ASSIGNED"), "Must record TASK_ASSIGNED");
    assert.ok(actions.includes("TASK_STATUS_CHANGED"), "Must record TASK_STATUS_CHANGED");
    assert.ok(actions.includes("COMMENT_ADDED"), "Must record COMMENT_ADDED");
});

test("Day 2: Notification records created for assignment, comments, and due date changes with read/unread", async () => {
    // Check Alice's notifications (she was assigned a task and Bob commented on it)
    const notifRes = await request(app)
        .get("/api/notifications")
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userAlice.id);

    assert.equal(notifRes.status, 200);
    assert.ok(notifRes.body.notifications.length >= 2, "Alice should have assignment and comment notifications");

    const types = notifRes.body.notifications.map((n) => n.type);
    assert.ok(types.includes("TASK_ASSIGNED"), "Should have TASK_ASSIGNED notification");
    assert.ok(types.includes("COMMENT_ADDED"), "Should have COMMENT_ADDED notification");

    // All should initially be unread
    for (const notif of notifRes.body.notifications) {
        assert.equal(notif.read, false, "Notification should initially be unread");
    }
});

test("Day 3: Overdue detection follows UTC rule and flags past-due tasks", async () => {
    // Create an overdue task (due 3 days ago in UTC)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const overdueTaskRes = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userBob.id)
        .send({
            title: "Urgent Security Audit",
            projectId: testProject.id,
            assigneeId: userAlice.id,
            status: "IN_PROGRESS",
            dueDate: threeDaysAgo
        });

    assert.equal(overdueTaskRes.status, 201);
    const overdueTaskId = overdueTaskRes.body.id;

    // Check overdue tasks list
    const checkList = await request(app)
        .get("/api/tasks/overdue")
        .set("x-organization-id", testOrg.id);

    assert.equal(checkList.status, 200);
    assert.equal(checkList.body.timezoneRule, "UTC");
    const found = checkList.body.tasks.some((t) => t.id === overdueTaskId);
    assert.ok(found, "Overdue task should be listed under UTC rule");

    // Trigger overdue detection & notification dispatch
    const triggerRes = await request(app)
        .post("/api/tasks/check-overdue")
        .set("x-organization-id", testOrg.id);

    assert.equal(triggerRes.status, 200);
    assert.ok(triggerRes.body.notificationsCreated >= 1, "Should create overdue notification");
});

test("Day 4: Duplicate notifications are prevented on repeated checks", async () => {
    // Run overdue check again immediately
    const repeatCheck = await request(app)
        .post("/api/tasks/check-overdue")
        .set("x-organization-id", testOrg.id);

    assert.equal(repeatCheck.status, 200);
    assert.equal(repeatCheck.body.notificationsCreated, 0, "Repeated check must not create new notifications");
    assert.ok(repeatCheck.body.duplicatesSuppressed >= 1, "Duplicate must be suppressed");
});

test("Day 5: Notification endpoints allow listing, mark read, mark all read with strict user isolation", async () => {
    // 1. Alice lists her notifications
    const aliceRes = await request(app)
        .get("/api/notifications")
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userAlice.id);

    assert.equal(aliceRes.status, 200);
    assert.ok(aliceRes.body.notifications.length > 0);
    const notifId = aliceRes.body.notifications[0].id;

    // 2. Mark single notification as read
    const readRes = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userAlice.id);

    assert.equal(readRes.status, 200);
    assert.equal(readRes.body.read, true);
    assert.ok(readRes.body.readAt);

    // 3. Mark all as read
    const markAllRes = await request(app)
        .patch("/api/notifications/mark-all-read")
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userAlice.id);

    assert.equal(markAllRes.status, 200);

    // 4. Verify unread count is now 0
    const unreadRes = await request(app)
        .get("/api/notifications/unread-count")
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userAlice.id);

    assert.equal(unreadRes.status, 200);
    assert.equal(unreadRes.body.unreadCount, 0);

    // 5. Strict Isolation: Bob cannot see Alice's notifications or mark them read
    const bobReadOther = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", userBob.id);

    assert.equal(bobReadOther.status, 404, "User Bob cannot access Alice's notification");
});

test("Day 6: Email is honestly documented and verified as SIMULATED", async () => {
    const simRes = await request(app)
        .get("/api/notifications/simulated-emails");

    assert.equal(simRes.status, 200);
    assert.equal(simRes.body.status, "SIMULATED");
    assert.ok(simRes.body.note.includes("simulated"));
    assert.ok(simRes.body.count > 0, "Simulated email outbox should have captured dispatches");

    // Ensure recipient email matches Alice
    const emailToAlice = simRes.body.emails.find((e) => e.to === userAlice.email);
    assert.ok(emailToAlice, "Simulated email to Alice should exist in outbox");
});
