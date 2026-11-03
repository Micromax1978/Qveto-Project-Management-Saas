process.env.NODE_ENV = "test";

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");
const prisma = require("../config/prisma");

describe("Week 3 — Collaboration, Attachments, Notifications & Overdue Detection", () => {
    // Test fixtures
    const orgIdA = "org-week3-tenant-a";
    const orgIdB = "org-week3-tenant-b";

    const userAuthor = {
        id: "usr-author-w3",
        name: "Alice Author",
        email: "alice@acme.test",
        role: "EMPLOYEE",
    };

    const userManager = {
        id: "usr-manager-w3",
        name: "Bob Manager",
        email: "bob@acme.test",
        role: "MANAGER",
    };

    const userOtherEmployee = {
        id: "usr-other-w3",
        name: "Charlie Colleague",
        email: "charlie@acme.test",
        role: "EMPLOYEE",
    };

    const userTenantB = {
        id: "usr-tenant-b-w3",
        name: "Dave Foreign",
        email: "dave@othercorp.test",
        role: "EMPLOYEE",
    };

    let projectA;
    let taskA;
    let overdueTaskA;
    let donePastTaskA;

    test.before(async () => {
        // Create Organizations
        await prisma.organization.create({
            data: { id: orgIdA, name: "Acme Corp Tenant A" }
        });
        await prisma.organization.create({
            data: { id: orgIdB, name: "OtherCorp Tenant B" }
        });

        // Create Users & Memberships
        for (const u of [userAuthor, userManager, userOtherEmployee]) {
            await prisma.user.create({
                data: { id: u.id, name: u.name, email: u.email }
            });
            await prisma.membership.create({
                data: {
                    organizationId: orgIdA,
                    userId: u.id,
                    role: u.role
                }
            });
        }

        await prisma.user.create({
            data: { id: userTenantB.id, name: userTenantB.name, email: userTenantB.email }
        });
        await prisma.membership.create({
            data: {
                organizationId: orgIdB,
                userId: userTenantB.id,
                role: userTenantB.role
            }
        });

        // Create Project in Tenant A
        projectA = await prisma.project.create({
            data: {
                id: "proj-week3-a",
                name: "Week 3 Project",
                organizationId: orgIdA,
                status: "ACTIVE"
            }
        });

        // Create standard Task in Tenant A (assigned to Charlie, created by Alice)
        taskA = await prisma.task.create({
            data: {
                id: "task-week3-a",
                title: "Collaboration & Attachments Implementation",
                projectId: projectA.id,
                organizationId: orgIdA,
                status: "TODO",
                createdById: userAuthor.id,
                assigneeId: userOtherEmployee.id,
            }
        });

        // Create Overdue Task (due 5 days ago, status IN_PROGRESS)
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        overdueTaskA = await prisma.task.create({
            data: {
                id: "task-week3-overdue",
                title: "Critical Overdue Release Milestone",
                projectId: projectA.id,
                organizationId: orgIdA,
                status: "IN_PROGRESS",
                dueDate: fiveDaysAgo,
                assigneeId: userOtherEmployee.id,
                createdById: userManager.id
            }
        });

        // Create Completed Past Task (due 10 days ago, status DONE - must NOT be returned as overdue)
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        donePastTaskA = await prisma.task.create({
            data: {
                id: "task-week3-done-past",
                title: "Completed Milestone",
                projectId: projectA.id,
                organizationId: orgIdA,
                status: "DONE",
                dueDate: tenDaysAgo,
                assigneeId: userOtherEmployee.id,
                createdById: userManager.id
            }
        });
    });

    test.after(async () => {
        // Cleanup all test records
        try {
            await prisma.notification.deleteMany({ where: { organizationId: { in: [orgIdA, orgIdB] } } });
            await prisma.activity.deleteMany({ where: { organizationId: { in: [orgIdA, orgIdB] } } });
            await prisma.attachment.deleteMany({ where: { organizationId: { in: [orgIdA, orgIdB] } } });
            await prisma.comment.deleteMany({ where: { organizationId: { in: [orgIdA, orgIdB] } } });
            await prisma.task.deleteMany({ where: { organizationId: { in: [orgIdA, orgIdB] } } });
            await prisma.project.deleteMany({ where: { organizationId: { in: [orgIdA, orgIdB] } } });
            await prisma.membership.deleteMany({ where: { organizationId: { in: [orgIdA, orgIdB] } } });
            await prisma.user.deleteMany({
                where: { id: { in: [userAuthor.id, userManager.id, userOtherEmployee.id, userTenantB.id] } }
            });
            await prisma.organization.deleteMany({ where: { id: { in: [orgIdA, orgIdB] } } });
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    // =========================================================================
    // 1. COMMENTS MODULE
    // =========================================================================
    describe("1. Comments & Collaboration", () => {
        let createdCommentId;

        test("POST /api/tasks/:taskId/comments adds a comment with author info", async () => {
            const res = await request(app)
                .post(`/api/tasks/${taskA.id}/comments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .set("x-user-role", "EMPLOYEE")
                .send({ content: "Initial comment discussing PR review feedback." });

            assert.equal(res.status, 201);
            assert.ok(res.body.data);
            assert.equal(res.body.data.taskId, taskA.id);
            assert.equal(res.body.data.content, "Initial comment discussing PR review feedback.");
            assert.equal(res.body.data.userId, userAuthor.id);
            assert.equal(res.body.data.isEdited, false);
            createdCommentId = res.body.data.id;
        });

        test("POST /api/tasks/:taskId/comments rejects empty or whitespace-only comments (400)", async () => {
            const res = await request(app)
                .post(`/api/tasks/${taskA.id}/comments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .send({ content: "    " });

            assert.equal(res.status, 400);
            assert.ok(res.body.error);
        });

        test("GET /api/tasks/:taskId/comments retrieves comments in chronological order", async () => {
            // Add a second comment
            await request(app)
                .post(`/api/tasks/${taskA.id}/comments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userManager.id)
                .set("x-user-role", "MANAGER")
                .send({ content: "Manager following up on progress." });

            const res = await request(app)
                .get(`/api/tasks/${taskA.id}/comments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id);

            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.body.data));
            assert.ok(res.body.data.length >= 2);

            // Chronological order verification (oldest to newest)
            for (let i = 0; i < res.body.data.length - 1; i++) {
                const tA = new Date(res.body.data[i].createdAt).getTime();
                const tB = new Date(res.body.data[i + 1].createdAt).getTime();
                assert.ok(tA <= tB, "Comments should be in chronological order");
            }
        });

        test("PATCH /api/comments/:commentId allows author to edit comment and sets isEdited", async () => {
            const res = await request(app)
                .patch(`/api/comments/${createdCommentId}`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .send({ content: "Edited content with additional details." });

            assert.equal(res.status, 200);
            assert.equal(res.body.data.content, "Edited content with additional details.");
            assert.equal(res.body.data.isEdited, true);
        });

        test("PATCH /api/comments/:commentId rejects non-author Employee from editing (403)", async () => {
            const res = await request(app)
                .patch(`/api/comments/${createdCommentId}`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userOtherEmployee.id)
                .set("x-user-role", "EMPLOYEE")
                .send({ content: "Unauthorized edit attempt." });

            assert.equal(res.status, 403);
            assert.ok(res.body.error);
        });

        test("DELETE /api/comments/:commentId rejects non-author Employee from deleting (403)", async () => {
            const res = await request(app)
                .delete(`/api/comments/${createdCommentId}`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userOtherEmployee.id)
                .set("x-user-role", "EMPLOYEE");

            assert.equal(res.status, 403);
            assert.ok(res.body.error);
        });

        test("DELETE /api/comments/:commentId allows Manager to moderate and delete comment", async () => {
            // Manager moderating Alice's comment
            const res = await request(app)
                .delete(`/api/comments/${createdCommentId}`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userManager.id)
                .set("x-user-role", "MANAGER");

            assert.equal(res.status, 200);
            assert.equal(res.body.success, true);
        });

        test("Comments reject cross-tenant access with 404 (Data Isolation)", async () => {
            const res = await request(app)
                .get(`/api/tasks/${taskA.id}/comments`)
                .set("x-organization-id", orgIdB)
                .set("x-user-id", userTenantB.id);

            assert.equal(res.status, 404);
        });
    });

    // =========================================================================
    // 2. ATTACHMENTS MODULE
    // =========================================================================
    describe("2. File Attachments & Security Validation", () => {
        let createdAttachmentId;

        test("POST /api/tasks/:taskId/attachments uploads valid attachment", async () => {
            const res = await request(app)
                .post(`/api/tasks/${taskA.id}/attachments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .set("x-user-role", "EMPLOYEE")
                .send({
                    name: "architecture_spec.pdf",
                    size: 250000,
                    type: "application/pdf"
                });

            assert.equal(res.status, 201);
            assert.ok(res.body.data);
            assert.equal(res.body.data.name, "architecture_spec.pdf");
            assert.equal(res.body.data.taskId, taskA.id);
            assert.ok(res.body.data.downloadUrl);
            createdAttachmentId = res.body.data.id;
        });

        test("POST /api/tasks/:taskId/attachments rejects files exceeding 10MB limit (400)", async () => {
            const res = await request(app)
                .post(`/api/tasks/${taskA.id}/attachments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .send({
                    name: "huge_backup.zip",
                    size: 15 * 1024 * 1024, // 15MB
                    type: "application/zip"
                });

            assert.equal(res.status, 400);
            assert.ok(res.body.error);
            assert.match(res.body.error, /exceeds/i);
        });

        test("POST /api/tasks/:taskId/attachments blocks executables and scripts (.exe, .sh, .bat) (400)", async () => {
            const resExe = await request(app)
                .post(`/api/tasks/${taskA.id}/attachments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .send({
                    name: "virus_payload.exe",
                    size: 1024,
                    type: "application/x-msdownload"
                });

            assert.equal(resExe.status, 400);
            assert.match(resExe.body.error, /forbidden|security/i);

            const resSh = await request(app)
                .post(`/api/tasks/${taskA.id}/attachments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .send({
                    name: "exploit.sh",
                    size: 1024,
                    type: "text/x-shellscript"
                });

            assert.equal(resSh.status, 400);
        });

        test("GET /api/attachments/:attachmentId/download securely streams authorized file", async () => {
            const res = await request(app)
                .get(`/api/attachments/${createdAttachmentId}/download`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id);

            assert.equal(res.status, 200);
            assert.ok(res.headers["content-disposition"]);
            assert.match(res.headers["content-disposition"], /architecture_spec\.pdf/);
        });

        test("GET /api/attachments/:attachmentId/download blocks cross-tenant unauthorized access (404/403)", async () => {
            const res = await request(app)
                .get(`/api/attachments/${createdAttachmentId}/download`)
                .set("x-organization-id", orgIdB)
                .set("x-user-id", userTenantB.id);

            assert.ok([403, 404].includes(res.status), "Cross-tenant download must be rejected");
        });

        test("DELETE /api/attachments/:attachmentId removes attachment for author or manager", async () => {
            const res = await request(app)
                .delete(`/api/attachments/${createdAttachmentId}`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userManager.id)
                .set("x-user-role", "MANAGER");

            assert.equal(res.status, 200);
            assert.equal(res.body.success, true);
        });
    });

    // =========================================================================
    // 3. ACTIVITY AUDIT STREAM
    // =========================================================================
    describe("3. Activity Audit History", () => {
        test("Activity events are automatically logged for task status transitions", async () => {
            // Update taskA status to IN_PROGRESS
            await request(app)
                .patch(`/api/tasks/${taskA.id}/status`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .send({ status: "IN_PROGRESS" });

            const res = await request(app)
                .get(`/api/tasks/${taskA.id}/activities`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id);

            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.body.data));
            const statusActivity = res.body.data.find((a) => a.type === "STATUS_CHANGED");
            assert.ok(statusActivity, "Status change must generate activity event");
            assert.equal(statusActivity.newValue, "IN_PROGRESS");
        });

        test("GET /api/tasks/:taskId/activities returns events in reverse chronological order", async () => {
            const res = await request(app)
                .get(`/api/tasks/${taskA.id}/activities`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id);

            assert.equal(res.status, 200);
            assert.ok(res.body.data.length >= 2);

            for (let i = 0; i < res.body.data.length - 1; i++) {
                const tA = new Date(res.body.data[i].createdAt).getTime();
                const tB = new Date(res.body.data[i + 1].createdAt).getTime();
                assert.ok(tA >= tB, "Activities must be reverse chronologically sorted");
            }
        });

        test("Activities reject cross-tenant access with 404", async () => {
            const res = await request(app)
                .get(`/api/tasks/${taskA.id}/activities`)
                .set("x-organization-id", orgIdB)
                .set("x-user-id", userTenantB.id);

            assert.equal(res.status, 404);
        });
    });

    // =========================================================================
    // 4. IN-APP NOTIFICATIONS & PRIVACY
    // =========================================================================
    describe("4. In-App Notifications & User Privacy", () => {
        let recipientNotifId;

        test("Posting a comment generates notification for assigned user", async () => {
            // Alice comments on taskA, which is assigned to Charlie
            await request(app)
                .post(`/api/tasks/${taskA.id}/comments`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id)
                .send({ content: "Charlie, please review the latest updates on this task." });

            const res = await request(app)
                .get("/api/notifications")
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userOtherEmployee.id); // Charlie

            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.body.data));
            const notif = res.body.data.find((n) => n.taskId === taskA.id && n.type === "COMMENT_ADDED");
            assert.ok(notif, "Charlie should receive a notification");
            assert.equal(notif.recipientId, userOtherEmployee.id);
            recipientNotifId = notif.id;
        });

        test("User B cannot see notifications belonging to User A (Strict Privacy)", async () => {
            const res = await request(app)
                .get("/api/notifications")
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userAuthor.id); // Alice

            assert.equal(res.status, 200);
            const found = res.body.data.some((n) => n.id === recipientNotifId);
            assert.equal(found, false, "Alice must not see Charlie's private notification");
        });

        test("GET /api/notifications/unread-count returns accurate unread count", async () => {
            const res = await request(app)
                .get("/api/notifications/unread-count")
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userOtherEmployee.id);

            assert.equal(res.status, 200);
            assert.equal(typeof res.body.unreadCount, "number");
            assert.ok(res.body.unreadCount >= 1);
        });

        test("PATCH /api/notifications/:id/read marks notification as read", async () => {
            const res = await request(app)
                .patch(`/api/notifications/${recipientNotifId}/read`)
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userOtherEmployee.id);

            assert.equal(res.status, 200);
            assert.equal(res.body.data.isRead, true);
        });

        test("PATCH /api/notifications/read-all marks all notifications for user as read", async () => {
            const res = await request(app)
                .patch("/api/notifications/read-all")
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userOtherEmployee.id);

            assert.equal(res.status, 200);
            assert.equal(res.body.success, true);

            const countRes = await request(app)
                .get("/api/notifications/unread-count")
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userOtherEmployee.id);

            assert.equal(countRes.body.unreadCount, 0);
        });
    });

    // =========================================================================
    // 5. OVERDUE TASK DETECTION
    // =========================================================================
    describe("5. Overdue Task Detection & Filtering", () => {
        test("GET /api/tasks/overdue returns past-due active tasks and excludes DONE tasks", async () => {
            const res = await request(app)
                .get("/api/tasks/overdue")
                .set("x-organization-id", orgIdA)
                .set("x-user-id", userManager.id);

            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.body.data));

            // Must include overdueTaskA
            const foundOverdue = res.body.data.find((t) => t.id === overdueTaskA.id);
            assert.ok(foundOverdue, "Overdue active task must be included");

            // Must NOT include donePastTaskA
            const foundDone = res.body.data.find((t) => t.id === donePastTaskA.id);
            assert.equal(foundDone, undefined, "Completed tasks must never be returned as overdue");
        });
    });
});
