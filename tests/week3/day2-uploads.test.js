/**
 * day2-uploads.test.js
 * Week 3 Day 2: Attachment uploads, allowed formats, size limits,
 * clear failure messages, and sanitization.
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetDb } = require('../../backend/src/data/mockDb');
const {
  uploadAttachment,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS
} = require('../../backend/src/collaboration/attachment.service');

describe('Week 3 - Day 2: File Uploads & Security Validation', () => {
  let acmeManager;
  let acmeEmployee;
  let betaOwner;

  beforeEach(() => {
    resetDb();
    acmeManager = {
      id: 'user_manager_1',
      name: 'Bob Manager',
      email: 'bob@acme.com',
      orgId: 'org_acme_corp',
      role: 'MANAGER'
    };
    acmeEmployee = {
      id: 'user_employee_1',
      name: 'Charlie Dev',
      email: 'charlie@acme.com',
      orgId: 'org_acme_corp',
      role: 'EMPLOYEE'
    };
    betaOwner = {
      id: 'user_external_owner',
      name: 'Eve Beta Owner',
      email: 'eve@beta.com',
      orgId: 'org_beta_tech',
      role: 'OWNER'
    };
  });

  test('TC-UPLOAD-01: Allowed file types upload successfully with metadata and private storage path', () => {
    const validUpload = uploadAttachment(
      'task_1',
      {
        fileName: 'architecture-spec.pdf',
        fileSize: 1024 * 500, // 500 KB
        mimeType: 'application/pdf'
      },
      acmeManager
    );

    assert.ok(validUpload.id.startsWith('att_'));
    assert.equal(validUpload.fileName, 'architecture-spec.pdf');
    assert.equal(validUpload.isPublic, false);
    assert.equal(validUpload.orgId, 'org_acme_corp');
    assert.ok(validUpload.storagePath.includes('org_acme_corp'));
  });

  test('TC-UPLOAD-02: Disallowed file types (.exe, .sh, .bat, .dll) are rejected with clear message', () => {
    const invalidTypes = [
      { fileName: 'malware.exe', mimeType: 'application/x-msdownload' },
      { fileName: 'script.sh', mimeType: 'application/x-sh' },
      { fileName: 'trojan.bat', mimeType: 'application/x-bat' },
      { fileName: 'hack.js', mimeType: 'application/javascript' }
    ];

    for (const item of invalidTypes) {
      assert.throws(
        () =>
          uploadAttachment(
            'task_1',
            {
              fileName: item.fileName,
              fileSize: 1024 * 50,
              mimeType: item.mimeType
            },
            acmeManager
          ),
        err => {
          return (
            err.status === 400 &&
            err.message.includes('Disallowed file type') &&
            err.message.includes('Allowed formats: PDF, PNG, JPG, CSV, DOCX, TXT, ZIP')
          );
        },
        `Expected rejection for disallowed file: ${item.fileName}`
      );
    }
  });

  test('TC-UPLOAD-03: File size exceeding 10MB is rejected with clear descriptive message', () => {
    const oversizedBytes = MAX_FILE_SIZE + 1024 * 1024 * 5; // ~15MB
    assert.throws(
      () =>
        uploadAttachment(
          'task_1',
          {
            fileName: 'giant-dump.zip',
            fileSize: oversizedBytes,
            mimeType: 'application/zip'
          },
          acmeManager
        ),
      err => {
        return (
          err.status === 400 &&
          err.message.includes('exceeds maximum limit of 10MB') &&
          err.message.includes('15.00MB')
        );
      }
    );
  });

  test('TC-UPLOAD-04: Empty (0-byte) file is rejected with 400 Bad Request', () => {
    assert.throws(
      () =>
        uploadAttachment(
          'task_1',
          {
            fileName: 'empty.txt',
            fileSize: 0,
            mimeType: 'text/plain'
          },
          acmeManager
        ),
      err => err.status === 400 && err.message.includes('empty')
    );
  });

  test('TC-UPLOAD-05: Path traversal sequences in filename are sanitized', () => {
    const upload = uploadAttachment(
      'task_1',
      {
        fileName: '../../../../etc/shadow.png',
        fileSize: 1024 * 80,
        mimeType: 'image/png'
      },
      acmeManager
    );

    assert.ok(!upload.fileName.includes('/'));
    assert.ok(!upload.fileName.includes('\\'));
    assert.ok(!upload.fileName.includes('..'));
    assert.ok(upload.fileName.includes('shadow.png'));
  });

  test('TC-UPLOAD-06: Unauthenticated file upload is rejected with 401', () => {
    assert.throws(
      () =>
        uploadAttachment('task_1', {
          fileName: 'doc.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf'
        }, null),
      err => err.status === 401
    );
  });

  test('TC-UPLOAD-07: Cross-tenant upload attempt is masked with 404 Not Found', () => {
    assert.throws(
      () =>
        uploadAttachment(
          'task_1',
          {
            fileName: 'leak.pdf',
            fileSize: 1000,
            mimeType: 'application/pdf'
          },
          betaOwner
        ),
      err => err.status === 404 && err.message.includes('Task not found')
    );
  });
});
