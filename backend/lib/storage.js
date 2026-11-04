// Attachment storage and upload validation.
//
// Rules (documented in the README):
//  - Max size: 10 MB per file, max 20 attachments per task.
//  - Only the extensions in ALLOWED_TYPES are accepted, and the file content
//    must match the type (magic bytes), so renaming malware.exe to a .png fails.
//  - Files are stored outside the web root under UPLOAD_DIR (default:
//    backend/storage/attachments) with a random name. The client-supplied
//    name is never used as a path.
//  - Downloads always go through an authorized API route.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { HttpError } = require("./errors");

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_TASK = 20;

const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

function startsWith(buffer, signature) {
    return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
}

function looksLikeText(buffer) {
    const sample = buffer.subarray(0, 8192);

    if (sample.includes(0)) {
        return false;
    }

    // Reject executables disguised as text (Windows PE and Linux ELF).
    if (startsWith(sample, Buffer.from("MZ")) || startsWith(sample, Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) {
        return false;
    }

    return true;
}

const ALLOWED_TYPES = {
    png: { mime: "image/png", check: (b) => startsWith(b, Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
    jpg: { mime: "image/jpeg", check: (b) => startsWith(b, Buffer.from([0xff, 0xd8, 0xff])) },
    jpeg: { mime: "image/jpeg", check: (b) => startsWith(b, Buffer.from([0xff, 0xd8, 0xff])) },
    gif: {
        mime: "image/gif",
        check: (b) => startsWith(b, Buffer.from("GIF87a")) || startsWith(b, Buffer.from("GIF89a"))
    },
    webp: {
        mime: "image/webp",
        check: (b) => startsWith(b, Buffer.from("RIFF")) && b.length > 12 && b.subarray(8, 12).toString() === "WEBP"
    },
    pdf: { mime: "application/pdf", check: (b) => startsWith(b, Buffer.from("%PDF-")) },
    txt: { mime: "text/plain", check: looksLikeText },
    csv: { mime: "text/csv", check: looksLikeText },
    md: { mime: "text/markdown", check: looksLikeText },
    docx: {
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        check: (b) => startsWith(b, ZIP_SIGNATURE)
    },
    xlsx: {
        mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        check: (b) => startsWith(b, ZIP_SIGNATURE)
    },
    pptx: {
        mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        check: (b) => startsWith(b, ZIP_SIGNATURE)
    }
};

function getUploadRoot() {
    return path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "storage", "attachments"));
}

// Strip any directory part and unsafe characters from a client file name.
function sanitizeFileName(name) {
    const normalized = String(name || "").replace(/\\/g, "/");
    const base = path.posix.basename(normalized);
    // eslint-disable-next-line no-control-regex
    const cleaned = base.replace(/[\u0000-\u001f\u007f"<>:|?*]/g, "_").trim();

    if (!cleaned || cleaned === "." || cleaned === "..") {
        return "file";
    }

    if (cleaned.length <= 120) {
        return cleaned;
    }

    const ext = path.posix.extname(cleaned);
    return cleaned.slice(0, 120 - ext.length) + ext;
}

// Validates a multer file object. Returns { ext, mime, originalName } or throws.
function validateUpload(file) {
    if (!file || !Buffer.isBuffer(file.buffer)) {
        throw new HttpError(400, "A file is required (multipart field name: file)");
    }

    if (file.size === 0 || file.buffer.length === 0) {
        throw new HttpError(400, "The uploaded file is empty");
    }

    if (file.buffer.length > MAX_ATTACHMENT_BYTES) {
        throw new HttpError(413, "File exceeds the 10 MB limit");
    }

    const originalName = sanitizeFileName(file.originalname);
    const ext = path.posix.extname(originalName).slice(1).toLowerCase();
    const type = ALLOWED_TYPES[ext];

    if (!type) {
        throw new HttpError(
            400,
            `File type not allowed. Allowed types: ${Object.keys(ALLOWED_TYPES).join(", ")}`
        );
    }

    if (!type.check(file.buffer)) {
        throw new HttpError(400, "File content does not match its extension");
    }

    return { ext, mime: type.mime, originalName };
}

// Resolve a stored name to an absolute path and make sure it stays inside the upload root.
function resolveStoredPath(storedName) {
    const root = getUploadRoot();
    const resolved = path.resolve(root, storedName);

    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        throw new HttpError(400, "Invalid storage location");
    }

    return resolved;
}

// Saves the file and returns the stored (relative) name, e.g. "<orgId>/<uuid>.png".
async function saveAttachmentFile(organizationId, ext, buffer) {
    const safeOrg = String(organizationId).replace(/[^a-zA-Z0-9_-]/g, "");

    if (!safeOrg) {
        throw new HttpError(400, "Invalid organization");
    }

    const storedName = `${safeOrg}/${crypto.randomUUID()}.${ext}`;
    const absolute = resolveStoredPath(storedName);

    await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
    await fs.promises.writeFile(absolute, buffer, { flag: "wx", mode: 0o640 });

    return storedName;
}

async function removeStoredFile(storedName) {
    try {
        await fs.promises.unlink(resolveStoredPath(storedName));
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
}

// Content-Disposition header value that is safe for any file name.
function contentDisposition(fileName) {
    const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\;]/g, "_");
    return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

module.exports = {
    MAX_ATTACHMENT_BYTES,
    MAX_ATTACHMENTS_PER_TASK,
    ALLOWED_TYPES,
    getUploadRoot,
    sanitizeFileName,
    validateUpload,
    resolveStoredPath,
    saveAttachmentFile,
    removeStoredFile,
    contentDisposition
};
