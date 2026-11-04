const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "qveto-upload-"));
const s = require("../../lib/storage");

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(20)]);
const file = (name, buffer) => ({ originalname: name, buffer, size: buffer.length });
const status = (fn) => { try { fn(); return null; } catch (e) { return e.statusCode; } };

test("accepts a real PNG", () => {
    const r = s.validateUpload(file("pic.PNG", PNG));
    assert.equal(r.ext, "png");
    assert.equal(r.mime, "image/png");
});

test("rejects disallowed extensions", () => {
    assert.equal(status(() => s.validateUpload(file("run.exe", Buffer.from("MZ....")))), 400);
    assert.equal(status(() => s.validateUpload(file("page.html", Buffer.from("<html>")))), 400);
    assert.equal(status(() => s.validateUpload(file("noext", Buffer.from("hello")))), 400);
});

test("rejects content that does not match the extension", () => {
    assert.equal(status(() => s.validateUpload(file("fake.png", Buffer.from("MZ executable")))), 400);
    assert.equal(status(() => s.validateUpload(file("fake.pdf", Buffer.from("plain text")))), 400);
    assert.equal(status(() => s.validateUpload(file("fake.txt", Buffer.from("MZ\x90\x00binary")))), 400);
});

test("accepts text and pdf", () => {
    assert.equal(s.validateUpload(file("n.txt", Buffer.from("hello world"))).mime, "text/plain");
    assert.equal(s.validateUpload(file("d.pdf", Buffer.from("%PDF-1.7 ..."))).mime, "application/pdf");
});

test("rejects empty and oversized files", () => {
    assert.equal(status(() => s.validateUpload(file("a.txt", Buffer.alloc(0)))), 400);
    assert.equal(status(() => s.validateUpload(file("a.txt", Buffer.alloc(s.MAX_ATTACHMENT_BYTES + 1, 97)))), 413);
    assert.equal(status(() => s.validateUpload(undefined)), 400);
});

test("sanitizeFileName strips paths and control characters", () => {
    assert.equal(s.sanitizeFileName("../../etc/passwd"), "passwd");
    assert.equal(s.sanitizeFileName("C:\\Windows\\evil.png"), "evil.png");
    assert.equal(s.sanitizeFileName('a"b<c>.txt'), "a_b_c_.txt");
    assert.equal(s.sanitizeFileName(".."), "file");
    assert.equal(s.sanitizeFileName(""), "file");
    assert.ok(s.sanitizeFileName("x".repeat(300) + ".png").length <= 120);
});

test("resolveStoredPath blocks path traversal", () => {
    assert.equal(status(() => s.resolveStoredPath("../../etc/passwd")), 400);
    assert.equal(status(() => s.resolveStoredPath("/etc/passwd")), 400);
    assert.ok(s.resolveStoredPath("org1/file.png").startsWith(s.getUploadRoot()));
});

test("save and remove a file under the upload root", async () => {
    const stored = await s.saveAttachmentFile("org_1", "png", PNG);
    assert.match(stored, /^org_1\/[0-9a-f-]{36}\.png$/);
    const abs = s.resolveStoredPath(stored);
    assert.ok(fs.existsSync(abs));
    await s.removeStoredFile(stored);
    assert.ok(!fs.existsSync(abs));
    await s.removeStoredFile(stored); // already gone: no error
});

test("saveAttachmentFile sanitizes the organization segment", async () => {
    const stored = await s.saveAttachmentFile("../evil", "txt", Buffer.from("x"));
    assert.ok(stored.startsWith("evil/"));
    await s.removeStoredFile(stored);
});

test("contentDisposition is header-safe", () => {
    const h = s.contentDisposition('na"me;é.png');
    assert.ok(!/["\;].*filename\*/.test(h.split("filename*")[0].replace(/^attachment; filename="[^"]*"/, "")));
    assert.ok(h.startsWith('attachment; filename="na_me_'));
    assert.ok(h.includes("filename*=UTF-8''"));
});
