const test = require("node:test");
const assert = require("node:assert/strict");
const { createLimiter } = require("../../lib/rateLimit");

test("limiter blocks after max and resets after the window", () => {
    let t = 1000;
    const limiter = createLimiter({ windowMs: 100, max: 2, now: () => t });
    assert.ok(limiter.consume("k").allowed);
    assert.ok(limiter.consume("k").allowed);
    const blocked = limiter.consume("k");
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterMs > 0);
    assert.ok(limiter.consume("other").allowed);
    t += 101;
    assert.ok(limiter.consume("k").allowed);
});

test("sweep removes expired entries", () => {
    let t = 0;
    const limiter = createLimiter({ windowMs: 10, max: 1, now: () => t });
    limiter.consume("a");
    t = 50;
    limiter.sweep();
    assert.equal(limiter.size(), 0);
});
