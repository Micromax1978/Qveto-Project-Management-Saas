const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const h = require("./helpers");

const { api, prisma } = h;

test.before(() => h.start());
test.after(() => h.stop());

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(32, 1)]);

async function setup() {
    const t = await h.createOrg(["alice", "bob"]);
    const project = await h.createProject(t.manager, [t.alice]);
    const task = await h.createTask(t.manager, project.id, { assigneeId: t.alice.id });
    return { ...t, project, task };
}

// ---------------------------------------------------------------- comments
test("comments: add, list, edit (author only), delete (author or manager)", async () => {
    const t = await setup();

    const added = await api("POST", `/api/tasks/${t.task.id}/comments`, { token: t.alice.token, body: { body: "  First!  " } });
    assert.equal(added.status, 201);
    assert.equal(added.data.comment.body, "First!");
    assert.equal(added.data.comment.isEdited, false);

    assert.equal((await api("POST", `/api/tasks/${t.task.id}/comments`, { token: t.alice.token, body: { body: "   " } })).status, 400);
    assert.equal((await api("POST", `/api/tasks/${t.task.id}/comments`, { token: t.alice.token, body: { body: "x".repeat(2001) } })).status, 400);

    const second = await api("POST", `/api/tasks/${t.task.id}/comments`, { token: t.manager.token, body: { body: "Second" } });
    const list = await api("GET", `/api/tasks/${t.task.id}/comments`, { token: t.alice.token });
    assert.deepEqual(list.data.comments.map((c) => c.body), ["First!", "Second"]);

    // Only the author can edit.
    assert.equal((await api("PATCH", `/api/comments/${added.data.comment.id}`, { token: t.manager.token, body: { body: "hijack" } })).status, 403);
    const edited = await api("PATCH", `/api/comments/${added.data.comment.id}`, { token: t.alice.token, body: { body: "Edited" } });
    assert.equal(edited.status, 200);
    assert.equal(edited.data.comment.isEdited, true);

    // Employees cannot delete others' comments; managers can moderate.
    assert.equal((await api("DELETE", `/api/comments/${second.data.comment.id}`, { token: t.alice.token })).status, 403);
    assert.equal((await api("DELETE", `/api/comments/${added.data.comment.id}`, { token: t.manager.token })).status, 200);
    assert.equal((await api("DELETE", `/api/comments/${second.data.comment.id}`, { token: t.manager.token })).status, 200);

    const detail = await api("GET", `/api/tasks/${t.task.id}`, { token: t.manager.token });
    assert.equal(detail.data.task.commentCount, 0);
});

test("comments: users outside the project or organization are blocked", async () => {
    const t = await setup();
    const other = await h.createOrg(["carol"]);
    const comment = await api("POST", `/api/tasks/${t.task.id}/comments`, { token: t.alice.token, body: { body: "private" } });

    // bob: same organization, not in the project.
    assert.equal((await api("GET", `/api/tasks/${t.task.id}/comments`, { token: t.bob.token })).status, 404);
    assert.equal((await api("PATCH", `/api/comments/${comment.data.comment.id}`, { token: t.bob.token, body: { body: "x" } })).status, 404);
    assert.equal((await api("DELETE", `/api/comments/${comment.data.comment.id}`, { token: t.bob.token })).status, 404);
    // another organization
    assert.equal((await api("DELETE", `/api/comments/${comment.data.comment.id}`, { token: other.manager.token })).status, 404);
});

test("comments: notify assignee and creator, never the author; produce activity", async () => {
    const t = await setup();

    await api("POST", `/api/tasks/${t.task.id}/comments`, { token: t.manager.token, body: { body: "Please review" } });

    const aliceNotes = await api("GET", "/api/notifications", { token: t.alice.token });
    assert.ok(aliceNotes.data.notifications.some((n) => n.type === "COMMENT_ADDED"));

    const managerNotes = await prisma.notification.count({ where: { userId: t.manager.id, type: "COMMENT_ADDED" } });
    assert.equal(managerNotes, 0, "the author is not notified about their own comment");

    const activity = await api("GET", `/api/tasks/${t.task.id}/activities`, { token: t.alice.token });
    assert.ok(activity.data.activities.some((a) => a.type === "COMMENT_ADDED"));
});

// ---------------------------------------------------------------- attachments
test("attachments: upload, list, authorized download, delete", async () => {
    const t = await setup();

    const upload = await api("POST", `/api/tasks/${t.task.id}/attachments`, {
        token: t.alice.token,
        form: h.fileForm("diagram.png", PNG, "image/png")
    });
    assert.equal(upload.status, 201);
    const att = upload.data.attachment;
    assert.equal(att.originalName, "diagram.png");
    assert.equal(att.mimeType, "image/png");
    assert.equal(att.sizeBytes, PNG.length);
    assert.equal(att.storedName, undefined, "the storage location is never exposed");

    const list = await api("GET", `/api/tasks/${t.task.id}/attachments`, { token: t.manager.token });
    assert.equal(list.data.count, 1);

    const download = await api("GET", att.downloadUrl, { token: t.alice.token });
    assert.equal(download.status, 200);
    assert.ok(Buffer.compare(download.data, PNG) === 0);
    assert.match(download.headers.get("content-disposition"), /^attachment; filename="diagram\.png"/);
    assert.equal(download.headers.get("x-content-type-options"), "nosniff");

    // The file lives under the upload root with a random name.
    const stored = await prisma.attachment.findUnique({ where: { id: att.id } });
    assert.ok(stored.storedName.startsWith(`${t.org.id}/`));
    assert.ok(!stored.storedName.includes("diagram"));
    const absolute = path.join(process.env.UPLOAD_DIR, stored.storedName);
    assert.ok(fs.existsSync(absolute));

    // Only the uploader or a manager can delete.
    assert.equal((await api("DELETE", `/api/attachments/${att.id}`, { token: t.bob.token })).status, 404);
    assert.equal((await api("DELETE", `/api/attachments/${att.id}`, { token: t.alice.token })).status, 200);
    assert.ok(!fs.existsSync(absolute), "the file is removed from disk");
    assert.equal((await api("GET", att.downloadUrl, { token: t.alice.token })).status, 404);
});

test("attachments: unauthorized users cannot download or upload", async () => {
    const t = await setup();
    const other = await h.createOrg(["carol"]);

    const upload = await api("POST", `/api/tasks/${t.task.id}/attachments`, {
        token: t.manager.token,
        form: h.fileForm("secret.txt", "top secret", "text/plain")
    });
    const url = upload.data.attachment.downloadUrl;

    assert.equal((await api("GET", url)).status, 401, "no token");
    assert.equal((await api("GET", url, { token: other.manager.token })).status, 404, "other organization");
    assert.equal((await api("GET", url, { token: t.bob.token })).status, 404, "same org, not in project");
    assert.equal((await api("GET", url, { token: t.alice.token })).status, 200, "project member");

    for (const user of [other.manager, t.bob]) {
        const res = await api("POST", `/api/tasks/${t.task.id}/attachments`, {
            token: user.token,
            form: h.fileForm("x.txt", "hello", "text/plain")
        });
        assert.equal(res.status, 404);
    }

    // Removing someone from the project revokes download access.
    await api("DELETE", `/api/projects/${t.project.id}/members/${t.alice.id}`, { token: t.manager.token });
    assert.equal((await api("GET", url, { token: t.alice.token })).status, 404);
});

test("attachments: type, content, size and path validation", async () => {
    const t = await setup();
    const up = (name, content, type) =>
        api("POST", `/api/tasks/${t.task.id}/attachments`, { token: t.manager.token, form: h.fileForm(name, content, type) });

    assert.equal((await up("run.exe", "MZ binary", "application/octet-stream")).status, 400);
    assert.equal((await up("page.html", "<script>alert(1)</script>", "text/html")).status, 400);
    assert.equal((await up("fake.png", "this is not a png", "image/png")).status, 400);
    assert.equal((await up("empty.txt", "", "text/plain")).status, 400);

    const big = Buffer.alloc(10 * 1024 * 1024 + 1024, 97);
    assert.equal((await up("big.txt", big, "text/plain")).status, 413);

    // Path traversal in the client file name is neutralized.
    const sneaky = await up("../../../etc/passwd.txt", "harmless text", "text/plain");
    assert.equal(sneaky.status, 201);
    assert.equal(sneaky.data.attachment.originalName, "passwd.txt");
    const stored = await prisma.attachment.findUnique({ where: { id: sneaky.data.attachment.id } });
    assert.ok(!stored.storedName.includes(".."));

    // No file at all.
    const none = await api("POST", `/api/tasks/${t.task.id}/attachments`, { token: t.manager.token, form: new FormData() });
    assert.equal(none.status, 400);
});

test("attachments: deleting a task removes its files from disk", async () => {
    const t = await setup();
    const upload = await api("POST", `/api/tasks/${t.task.id}/attachments`, {
        token: t.manager.token,
        form: h.fileForm("notes.txt", "some notes", "text/plain")
    });
    const stored = await prisma.attachment.findUnique({ where: { id: upload.data.attachment.id } });
    const absolute = path.join(process.env.UPLOAD_DIR, stored.storedName);
    assert.ok(fs.existsSync(absolute));

    assert.equal((await api("DELETE", `/api/tasks/${t.task.id}`, { token: t.manager.token })).status, 200);
    assert.ok(!fs.existsSync(absolute));
    assert.equal(await prisma.attachment.count({ where: { id: stored.id } }), 0);
});

// ---------------------------------------------------------------- notifications
test("notifications: list, unread count, mark read, mark all, privacy", async () => {
    const t = await setup();

    // Alice already has "added to project" and "assigned" notifications.
    const first = await api("GET", "/api/notifications", { token: t.alice.token });
    assert.ok(first.data.total >= 2);
    assert.equal(first.data.unreadCount, first.data.total);

    const count = await api("GET", "/api/notifications/unread-count", { token: t.alice.token });
    assert.equal(count.data.unreadCount, first.data.total);

    const target = first.data.notifications[0];
    assert.equal((await api("PATCH", `/api/notifications/${target.id}/read`, { token: t.bob.token })).status, 404, "cannot touch others' notifications");
    assert.equal((await api("PATCH", `/api/notifications/${target.id}/read`, { token: t.alice.token })).status, 200);

    const unread = await api("GET", "/api/notifications?unread=true", { token: t.alice.token });
    assert.equal(unread.data.total, first.data.total - 1);

    const all = await api("PATCH", "/api/notifications/read-all", { token: t.alice.token });
    assert.equal(all.data.updated, first.data.total - 1);
    assert.equal((await api("GET", "/api/notifications/unread-count", { token: t.alice.token })).data.unreadCount, 0);

    // Bob never sees Alice's notifications.
    const bob = await api("GET", "/api/notifications", { token: t.bob.token });
    assert.equal(bob.data.total, 0);

    assert.equal((await api("GET", "/api/notifications")).status, 401);
});

test("notifications: status changes notify the assignee, not the actor", async () => {
    const t = await setup();
    await api("PATCH", `/api/tasks/${t.task.id}/status`, { token: t.manager.token, body: { status: "REVIEW" } });

    const alice = await prisma.notification.count({ where: { userId: t.alice.id, type: "TASK_STATUS_CHANGED" } });
    const manager = await prisma.notification.count({ where: { userId: t.manager.id, type: "TASK_STATUS_CHANGED" } });
    assert.equal(alice, 1);
    assert.equal(manager, 0);
});

// ---------------------------------------------------------------- overdue
test("overdue: scan notifies the assignee once, and again only after the due date changes", async () => {
    const t = await setup();
    const past = new Date(Date.now() - 3 * 86400000).toISOString();

    const task = await h.createTask(t.manager, t.project.id, { title: "Late task", assigneeId: t.alice.id, dueDate: past });
    assert.equal(task.isOverdue, true);

    const done = await h.createTask(t.manager, t.project.id, { title: "Late but done", assigneeId: t.alice.id, dueDate: past, status: "DONE" });
    const unassigned = await h.createTask(t.manager, t.project.id, { title: "Late, nobody", dueDate: past });
    const future = await h.createTask(t.manager, t.project.id, { title: "Future", assigneeId: t.alice.id, dueDate: new Date(Date.now() + 86400000).toISOString() });
    void done; void unassigned; void future;

    // Employees cannot trigger a scan.
    assert.equal((await api("POST", "/api/notifications/scan-overdue", { token: t.alice.token })).status, 403);

    const scan = await api("POST", "/api/notifications/scan-overdue", { token: t.manager.token });
    assert.equal(scan.status, 200);
    assert.equal(scan.data.notified, 1);

    const overdueNotes = await prisma.notification.findMany({ where: { userId: t.alice.id, type: "TASK_OVERDUE" } });
    assert.equal(overdueNotes.length, 1);
    assert.equal(overdueNotes[0].taskId, task.id);

    // A second scan does not duplicate it.
    const again = await api("POST", "/api/notifications/scan-overdue", { token: t.manager.token });
    assert.equal(again.data.notified, 0);

    // Moving the due date re-arms the alert.
    await api("PATCH", `/api/tasks/${task.id}`, { token: t.manager.token, body: { dueDate: new Date(Date.now() - 86400000).toISOString() } });
    const rearmed = await api("POST", "/api/notifications/scan-overdue", { token: t.manager.token });
    assert.equal(rearmed.data.notified, 1);

    const activity = await api("GET", `/api/tasks/${task.id}/activity`, { token: t.manager.token });
    assert.ok(activity.data.activities.some((a) => a.type === "TASK_OVERDUE"));
});

test("overdue: a task completed before the scan is not flagged", async () => {
    const t = await setup();
    const task = await h.createTask(t.manager, t.project.id, {
        assigneeId: t.alice.id,
        dueDate: new Date(Date.now() - 86400000).toISOString()
    });
    await api("PATCH", `/api/tasks/${task.id}/status`, { token: t.manager.token, body: { status: "DONE" } });

    const scan = await api("POST", "/api/notifications/scan-overdue", { token: t.manager.token });
    assert.equal(scan.data.notified, 0);
    const detail = await api("GET", `/api/tasks/${task.id}`, { token: t.manager.token });
    assert.equal(detail.data.task.isOverdue, false);
});

// ---------------------------------------------------------------- activity history
test("activity: task and project history, newest first, scoped", async () => {
    const t = await setup();
    const other = await h.createOrg([]);

    await api("PATCH", `/api/tasks/${t.task.id}`, { token: t.manager.token, body: { priority: "URGENT" } });
    await api("POST", `/api/tasks/${t.task.id}/subtasks`, { token: t.manager.token, body: { title: "Do it" } });

    const taskActivity = await api("GET", `/api/tasks/${t.task.id}/activity`, { token: t.alice.token });
    const types = taskActivity.data.activities.map((a) => a.type);
    assert.equal(types[0], "SUBTASK_ADDED");
    assert.ok(types.includes("TASK_UPDATED"));
    assert.ok(types.includes("TASK_CREATED"));

    const projectActivity = await api("GET", `/api/projects/${t.project.id}/activity`, { token: t.alice.token });
    assert.ok(projectActivity.data.total >= types.length);
    assert.equal(projectActivity.data.activities[0].actor.id, t.manager.id);

    assert.equal((await api("GET", `/api/projects/${t.project.id}/activity`, { token: t.bob.token })).status, 404);
    assert.equal((await api("GET", `/api/projects/${t.project.id}/activity`, { token: other.manager.token })).status, 404);

    // Deleting a task keeps a history entry.
    await api("DELETE", `/api/tasks/${t.task.id}`, { token: t.manager.token });
    const afterDelete = await api("GET", `/api/projects/${t.project.id}/activity?type=TASK_DELETED`, { token: t.manager.token });
    assert.equal(afterDelete.data.total, 1);
});
