const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../server");
const prisma = require("../config/prisma");
const activityService = require("../services/activityService");

let testOrg;
let otherOrg;
let testUser;
let otherUser;
let testProject;
let testTask;

test.before(async () => {
    // 1. Setup primary test organization
    testOrg = await prisma.organization.upsert({
        where: { id: "test-org-comments-week3" },
        update: {},
        create: {
            id: "test-org-comments-week3",
            name: "Week 3 Comments Test Org"
        }
    });

    // 2. Setup secondary (tenant-isolated) organization
    otherOrg = await prisma.organization.upsert({
        where: { id: "test-other-org-week3" },
        update: {},
        create: {
            id: "test-other-org-week3",
            name: "Week 3 Other Tenant Org"
        }
    });

    // 3. Setup test users
    testUser = await prisma.user.upsert({
        where: { email: "commenter@test.com" },
        update: {},
        create: {
            id: "user-commenter-week3",
            name: "Jane Commenter",
            email: "commenter@test.com"
        }
    });

    otherUser = await prisma.user.upsert({
        where: { email: "other-tenant-user@test.com" },
        update: {},
        create: {
            id: "user-other-tenant-week3",
            name: "Bob Foreign",
            email: "other-tenant-user@test.com"
        }
    });

    // 4. Setup memberships
    await prisma.membership.upsert({
        where: {
            organizationId_userId: {
                organizationId: testOrg.id,
                userId: testUser.id
            }
        },
        update: {},
        create: {
            organizationId: testOrg.id,
            userId: testUser.id,
            role: "MANAGER"
        }
    });

    await prisma.membership.upsert({
        where: {
            organizationId_userId: {
                organizationId: otherOrg.id,
                userId: otherUser.id
            }
        },
        update: {},
        create: {
            organizationId: otherOrg.id,
            userId: otherUser.id,
            role: "EMPLOYEE"
        }
    });

    // 5. Setup test project and task
    testProject = await prisma.project.upsert({
        where: {
            id_organizationId: {
                id: "proj-comments-week3",
                organizationId: testOrg.id
            }
        },
        update: {},
        create: {
            id: "proj-comments-week3",
            organizationId: testOrg.id,
            name: "Comments Evaluation Project"
        }
    });

    testTask = await prisma.task.upsert({
        where: {
            id_organizationId: {
                id: "task-comments-week3",
                organizationId: testOrg.id
            }
        },
        update: {},
        create: {
            id: "task-comments-week3",
            organizationId: testOrg.id,
            projectId: testProject.id,
            title: "Task with Comments Discussion",
            status: "IN_PROGRESS"
        }
    });

    // Clear any previous test comments on this task
    await prisma.comment.deleteMany({
        where: { taskId: testTask.id }
    });

    activityService.resetActivityLog();
});

test("TC-COMM-01: Successful comment creation with author and timestamp", async () => {
    const res = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", testUser.id)
        .send({ text: "First comment on task for review." });

    assert.strictEqual(res.statusCode, 201);
    assert.ok(res.body.id);
    assert.strictEqual(res.body.taskId, testTask.id);
    assert.strictEqual(res.body.authorId, testUser.id);
    assert.strictEqual(res.body.organizationId, testOrg.id);
    assert.strictEqual(res.body.text, "First comment on task for review.");
    assert.ok(res.body.createdAt);
    assert.strictEqual(res.body.author.id, testUser.id);
    assert.strictEqual(res.body.author.name, "Jane Commenter");
    assert.strictEqual(res.body.author.initials, "JC");
});

test("TC-COMM-02: Retrieve comments and verify oldest-first ordering", async () => {
    // Add second comment
    await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", testUser.id)
        .send({ text: "Second comment posted shortly after." });

    const res = await request(app)
        .get(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.count, 2);
    assert.strictEqual(res.body.comments.length, 2);

    // Oldest first: First comment appears before second comment
    const first = res.body.comments[0];
    const second = res.body.comments[1];
    assert.strictEqual(first.text, "First comment on task for review.");
    assert.strictEqual(second.text, "Second comment posted shortly after.");
    assert.ok(new Date(first.createdAt) <= new Date(second.createdAt));
});

test("TC-COMM-03: Empty comment rejection (400 Bad Request)", async () => {
    // Whitespace only
    const res1 = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", testUser.id)
        .send({ text: "    " });

    assert.strictEqual(res1.statusCode, 400);
    assert.strictEqual(res1.body.error, "Comment text cannot be empty");

    // Missing text field
    const res2 = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", testUser.id)
        .send({});

    assert.strictEqual(res2.statusCode, 400);
    assert.strictEqual(res2.body.error, "Comment text cannot be empty");
});

test("TC-COMM-04: Excessively long comment rejection (400 Bad Request)", async () => {
    const hugeText = "A".repeat(5001);
    const res = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", testUser.id)
        .send({ text: hugeText });

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /exceeds maximum allowed length/i);
});

test("TC-COMM-05: Missing task returns 404 Not Found", async () => {
    const nonExistentTaskId = "non-existent-task-uuid-12345";
    const res = await request(app)
        .post(`/api/tasks/${nonExistentTaskId}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", testUser.id)
        .send({ text: "Comment on ghost task" });

    assert.strictEqual(res.statusCode, 404);
    assert.match(res.body.error, /Task not found/i);
});

test("TC-COMM-06: Invalid task ID format returns 400 Bad Request", async () => {
    const invalidTaskId = "invalid id with spaces!";
    const res = await request(app)
        .get(`/api/tasks/${encodeURIComponent(invalidTaskId)}/comments`)
        .set("x-organization-id", testOrg.id);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, "Invalid task ID format");
});

test("TC-COMM-07: Unauthenticated user rejected on comment creation (401)", async () => {
    const res = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id)
        .send({ text: "Unauthenticated comment attempt" });

    assert.strictEqual(res.statusCode, 401);
    assert.match(res.body.error, /Unauthorized/i);
});

test("TC-COMM-08: User from another organization rejected (Cross-tenant boundary)", async () => {
    // OtherUser belongs to otherOrg, attempts to comment on testTask in testOrg
    const res = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set("x-organization-id", testOrg.id)
        .set("x-user-id", otherUser.id)
        .send({ text: "Intruder comment across organization boundary" });

    assert.strictEqual(res.statusCode, 403);
    assert.match(res.body.error, /not a member of this organization/i);
});

test("TC-COMM-09: Activity event recorded on successful comment creation", async () => {
    const activities = activityService.getRecentActivities(testOrg.id);
    assert.ok(activities.length >= 2, "Should have recorded activities for the comments created");

    const latest = activities[0]; // Most recent first
    assert.strictEqual(latest.eventType, "COMMENT_CREATED");
    assert.strictEqual(latest.organizationId, testOrg.id);
    assert.strictEqual(latest.actor.id, testUser.id);
    assert.strictEqual(latest.task.id, testTask.id);
    assert.ok(latest.entity.id);
    assert.ok(latest.timestamp);
});
