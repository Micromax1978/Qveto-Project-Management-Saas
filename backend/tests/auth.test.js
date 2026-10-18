const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");

test("POST /api/auth/signup rejects request when required fields are missing", async () => {
    const res = await request(app)
        .post("/api/auth/signup")
        .send({
            email: "test@example.com"
        });

    assert.equal(res.status, 400);
    assert.ok(res.body.error || res.body.message);
});

test("POST /api/auth/login rejects request when password is missing", async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({
            email: "test@example.com"
        });

    assert.equal(res.status, 400);
    assert.ok(res.body.error || res.body.message);
});

test("GET /api/health returns OK status", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "OK");
});
