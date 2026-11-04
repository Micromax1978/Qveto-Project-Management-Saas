const test = require("node:test");
const assert = require("node:assert/strict");
const a = require("../../lib/analytics");

test("completionRate handles zero and rounding", () => {
    assert.equal(a.completionRate(0, 0), 0);
    assert.equal(a.completionRate(1, 3), 33.3);
    assert.equal(a.completionRate(2, 3), 66.7);
    assert.equal(a.completionRate(5, 5), 100);
});

test("zeroFill includes missing keys", () => {
    const out = a.zeroFill(["A", "B", "C"], [{ k: "A", n: 2 }, { k: "A", n: 1 }], (r) => r.k, (r) => r.n);
    assert.deepEqual(out, { A: 3, B: 0, C: 0 });
});

test("bucketByDay returns N ordered days with zeros", () => {
    const now = new Date("2026-11-10T15:00:00Z");
    const out = a.bucketByDay(
        [new Date("2026-11-10T01:00:00Z"), new Date("2026-11-10T22:00:00Z"), new Date("2026-11-08T05:00:00Z"), new Date("2026-10-01T00:00:00Z")],
        4,
        now
    );
    assert.deepEqual(out, [
        { date: "2026-11-07", count: 0 },
        { date: "2026-11-08", count: 1 },
        { date: "2026-11-09", count: 0 },
        { date: "2026-11-10", count: 2 }
    ]);
});

test("startOfWindow is the first bucket's day", () => {
    assert.equal(a.startOfWindow(14, new Date("2026-11-14T10:00:00Z")).toISOString(), "2026-11-01T00:00:00.000Z");
});
