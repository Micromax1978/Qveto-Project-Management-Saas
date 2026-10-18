process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");

test("404 Handler returns uniform error format", async () => {
    const res = await request(app).get("/api/non-existent-route");
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
    assert.match(res.body.error, /Route not found/);
});

test("POST /api/users returns 400 when required fields are missing", async () => {
    const res = await request(app)
        .post("/api/users")
        .send({ name: "Only Name Provided" });

    assert.equal(res.status, 400);
    assert.ok(res.body.error);
    assert.match(res.body.error, /Missing required field\(s\): email/);
});

test("POST /api/organizations returns 400 when name is missing", async () => {
    const res = await request(app)
        .post("/api/organizations")
        .send({});

    assert.equal(res.status, 400);
    assert.ok(res.body.error);
    assert.match(res.body.error, /Missing required field\(s\): name/);
});

test("GET /api/projects rejects request when organization header is missing", async () => {
    const res = await request(app).get("/api/projects");

    assert.equal(res.status, 400);
    assert.ok(res.body.error);
    assert.match(res.body.error, /Organization context required/);
});

test("POST /api/tasks rejects invalid status enum", async () => {
    const res = await request(app)
        .post("/api/tasks")
        .set("x-organization-id", "mock-org-123")
        .send({
            title: "Test Task",
            projectId: "mock-proj-123",
            status: "INVALID_STATUS"
        });

    assert.equal(res.status, 400);
    assert.ok(res.body.error);
    assert.match(res.body.error, /Invalid value for 'status'/);
});

test("All API errors strictly follow { error: message } format", async () => {
    const res = await request(app)
        .post("/api/tasks")
        .send({}); // Missing org header and body

    assert.equal(res.status, 400);
    const keys = Object.keys(res.body);
    assert.deepEqual(keys, ["error"], "Error response must only contain 'error' key");
    assert.equal(typeof res.body.error, "string");
});
