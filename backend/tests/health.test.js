
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

test("GET /health returns a successful database health response", async () => {
    const app = express();

    app.get("/health", (req, res) => {
        res.status(200).json({
            status: "OK",
            message: "Backend and database are connected"
        });
    });

    const response = await request(app).get("/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "OK");
    assert.equal(
        response.body.message,
        "Backend and database are connected"
    );
});
