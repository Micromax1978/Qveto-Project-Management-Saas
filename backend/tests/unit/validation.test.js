const test = require("node:test");
const assert = require("node:assert/strict");
const v = require("../../lib/validation");
const { canTransition, isManagerRole } = require("../../lib/constants");

const status = (fn) => { try { fn(); return null; } catch (e) { return e.statusCode; } };

test("requireString trims, enforces required and max length", () => {
    assert.equal(v.requireString("  hi  ", "x"), "hi");
    assert.equal(status(() => v.requireString("   ", "x")), 400);
    assert.equal(status(() => v.requireString(5, "x")), 400);
    assert.equal(status(() => v.requireString("a".repeat(11), "x", { max: 10 })), 400);
});

test("optionalString distinguishes undefined, null and empty", () => {
    assert.equal(v.optionalString(undefined, "x"), undefined);
    assert.equal(v.optionalString(null, "x"), null);
    assert.equal(v.optionalString("  ", "x"), null);
    assert.equal(v.optionalString(" ok ", "x"), "ok");
    assert.equal(status(() => v.optionalString(3, "x")), 400);
});

test("assertEnum accepts only listed values", () => {
    assert.equal(v.assertEnum("A", ["A", "B"], "f"), "A");
    assert.equal(status(() => v.assertEnum("C", ["A", "B"], "f")), 400);
    assert.equal(status(() => v.assertEnum(undefined, ["A"], "f")), 400);
});

test("isValidEmail", () => {
    assert.ok(v.isValidEmail("a@b.co"));
    assert.ok(!v.isValidEmail("a@b"));
    assert.ok(!v.isValidEmail("a b@c.com"));
    assert.ok(!v.isValidEmail(null));
});

test("parseDueDate: date-only means end of day UTC", () => {
    assert.equal(v.parseDueDate("2026-11-30").toISOString(), "2026-11-30T23:59:59.999Z");
});

test("parseDueDate: full timestamps and offsets", () => {
    assert.equal(v.parseDueDate("2026-11-30T09:00:00Z").toISOString(), "2026-11-30T09:00:00.000Z");
    assert.equal(v.parseDueDate("2026-11-30T09:00:00").toISOString(), "2026-11-30T09:00:00.000Z");
    assert.equal(v.parseDueDate("2026-11-30T09:00:00+05:30").toISOString(), "2026-11-30T03:30:00.000Z");
});

test("parseDueDate rejects invalid input", () => {
    for (const bad of ["2026-02-30", "tomorrow", "", "2026-13-01", "1999-01-01T00:00:00Z", 12345, null]) {
        assert.equal(status(() => v.parseDueDate(bad)), 400, `should reject ${bad}`);
    }
});

test("isOverdue rule: past due and not DONE", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    assert.equal(v.isOverdue({ dueDate: new Date("2026-11-10T11:59:59Z"), status: "TODO" }, now), true);
    assert.equal(v.isOverdue({ dueDate: new Date("2026-11-10T12:00:00Z"), status: "TODO" }, now), false);
    assert.equal(v.isOverdue({ dueDate: new Date("2026-11-11T00:00:00Z"), status: "TODO" }, now), false);
    assert.equal(v.isOverdue({ dueDate: new Date("2026-11-01T00:00:00Z"), status: "DONE" }, now), false);
    assert.equal(v.isOverdue({ dueDate: null, status: "TODO" }, now), false);
    assert.equal(v.isOverdue(null, now), false);
});

test("date-only due date is not overdue during its own day", () => {
    const due = v.parseDueDate("2026-11-10");
    assert.equal(v.isOverdue({ dueDate: due, status: "TODO" }, new Date("2026-11-10T20:00:00Z")), false);
    assert.equal(v.isOverdue({ dueDate: due, status: "TODO" }, new Date("2026-11-11T00:00:01Z")), true);
});

test("parsePagination defaults and limits", () => {
    assert.deepEqual(v.parsePagination({}), { page: 1, pageSize: 50, skip: 0, take: 50 });
    assert.deepEqual(v.parsePagination({ page: "3", pageSize: "10" }), { page: 3, pageSize: 10, skip: 20, take: 10 });
    assert.equal(status(() => v.parsePagination({ page: "0" })), 400);
    assert.equal(status(() => v.parsePagination({ pageSize: "101" })), 400);
    assert.equal(status(() => v.parsePagination({ page: "1.5" })), 400);
});

test("queryString rejects repeated params", () => {
    assert.equal(v.queryString({}, "a"), undefined);
    assert.equal(v.queryString({ a: "" }, "a"), undefined);
    assert.equal(v.queryString({ a: " x " }, "a"), "x");
    assert.equal(status(() => v.queryString({ a: ["x", "y"] }, "a")), 400);
});

test("label helpers", () => {
    assert.equal(v.normalizeLabelName("  big   bug "), "big bug");
    assert.equal(status(() => v.normalizeLabelName("")), 400);
    assert.equal(v.optionalHexColor("#ABCDEF"), "#abcdef");
    assert.equal(v.optionalHexColor(undefined), undefined);
    assert.equal(status(() => v.optionalHexColor("red")), 400);
});

test("kanban transitions: only managers may re-open DONE tasks", () => {
    assert.equal(canTransition("TODO", "DONE", false), true);
    assert.equal(canTransition("REVIEW", "TODO", false), true);
    assert.equal(canTransition("DONE", "TODO", false), false);
    assert.equal(canTransition("DONE", "TODO", true), true);
    assert.equal(canTransition("TODO", "TODO", false), true);
    assert.equal(canTransition("TODO", "BOGUS", true), false);
});

test("isManagerRole", () => {
    assert.ok(isManagerRole("manager"));
    assert.ok(isManagerRole("Owner"));
    assert.ok(!isManagerRole("employee"));
    assert.ok(!isManagerRole(undefined));
});
