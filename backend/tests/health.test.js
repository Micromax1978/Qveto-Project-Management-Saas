process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");

test("GET / returns 200 and server running info", async () => {
    const response = await request(app).get("/");

    assert.equal(response.status, 200);
    assert.equal(typeof response.body.message, "string");
    assert.match(response.body.message, /Qveto/);
});

test("GET /health checks database connection and returns standard format", async () => {
    const response = await request(app).get("/health");

    // Depending on local DB connectivity, response will be 200 or 500
    if (response.status === 200) {
        assert.equal(response.body.status, "OK");
        assert.equal(response.body.message, "Backend and database are connected");
    } else {
        // If PostgreSQL is not currently running locally, errorHandler must format the error
        assert.equal(response.status, 500);
        assert.ok(response.body.error, "Error property must exist on failure");
    }
});
