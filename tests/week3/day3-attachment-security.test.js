/**
 * day3-attachment-security.test.js
 * Week 3 Day 3: Attachment downloads security: logged out, cross-organization,
 * public link denial, and security headers.
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetDb } = require('../../backend/src/data/mockDb');
const { downloadAttachment } = require('../../backend/src/collaboration/attachment.service');

describe('Week 3 - Day 3: Attachment Download Security & Boundary Enforcement', () => {
  let acmeManager;
  let acmeEmployee;
  let acmeUnassignedEmployee;
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
    acmeUnassignedEmployee = {
      id: 'user_unassigned',
      name: 'Unassigned Dev',
      email: 'unassigned@acme.com',
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

  test('TC-DOWN-01: Logged-out user trying to download attachment is rejected with 401', () => {
    assert.throws(
      () => downloadAttachment('att_1', null),
      err => err.status === 401 && err.message.includes('Authentication required')
    );
  });

  test('TC-DOWN-02: Public direct link download attempt is rejected with 401 (no public links)', () => {
    assert.throws(
      () => downloadAttachment('att_1', acmeManager, { isPublicLink: true }),
      err => err.status === 401 && err.message.includes('Public links are disabled')
    );
  });

  test('TC-DOWN-03: User from another organization (Org B) cannot download Org A file (404 Isolation)', () => {
    // Eve Beta Owner attempts to download Acme's attachment att_1
    assert.throws(
      () => downloadAttachment('att_1', betaOwner),
      err => err.status === 404 && err.message.includes('Attachment not found')
    );
  });

  test('TC-DOWN-04: Acme user cannot download Beta Technologies attachment att_beta_1 (404 Isolation)', () => {
    assert.throws(
      () => downloadAttachment('att_beta_1', acmeManager),
      err => err.status === 404 && err.message.includes('Attachment not found')
    );
  });

  test('TC-DOWN-05: Authorized project member can download file with secure headers', () => {
    const download = downloadAttachment('att_1', acmeEmployee);

    assert.equal(download.id, 'att_1');
    assert.equal(download.fileName, 'schema-architecture-v1.pdf');
    assert.equal(download.mimeType, 'application/pdf');
    assert.ok(download.headers['Content-Disposition'].includes('attachment'));
    assert.equal(download.headers['X-Content-Type-Options'], 'nosniff');
    assert.ok(download.headers['Cache-Control'].includes('private'));
  });

  test('TC-DOWN-06: Employee not assigned to the project is forbidden from downloading (403)', () => {
    assert.throws(
      () => downloadAttachment('att_1', acmeUnassignedEmployee),
      err => err.status === 403 && err.message.includes('Forbidden')
    );
  });

  test('TC-DOWN-07: Non-existent attachment ID returns 404 Not Found', () => {
    assert.throws(
      () => downloadAttachment('att_missing_99999', acmeManager),
      err => err.status === 404 && err.message.includes('Attachment not found')
    );
  });
});
