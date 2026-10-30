/**
 * day1-comments.test.js
 * Week 3 Day 1: Comments validation, length bounds, role authorization,
 * missing tasks, and multi-tenant isolation.
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetDb } = require('../../backend/src/data/mockDb');
const {
  createComment,
  getCommentsByTask,
  deleteComment,
  MAX_COMMENT_LENGTH
} = require('../../backend/src/collaboration/comment.service');

describe('Week 3 - Day 1: Task Comments & Collaboration Security', () => {
  let acmeManager;
  let acmeEmployee;
  let acmeExternalEmployee;
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
    acmeExternalEmployee = {
      id: 'user_employee_unassigned',
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

  test('TC-COMM-01: Valid comment creation on accessible task succeeds', () => {
    const comment = createComment(
      'task_1',
      { content: 'Reviewed the database schema; ready for migration.' },
      acmeManager
    );

    assert.ok(comment.id.startsWith('comment_'));
    assert.equal(comment.content, 'Reviewed the database schema; ready for migration.');
    assert.equal(comment.authorId, acmeManager.id);
    assert.equal(comment.orgId, acmeManager.orgId);
    assert.ok(comment.createdAt);
  });

  test('TC-COMM-02: Empty comment is rejected with 400 Bad Request', () => {
    assert.throws(
      () => createComment('task_1', { content: '' }, acmeManager),
      err => err.status === 400 && err.message.includes('cannot be empty')
    );

    assert.throws(
      () => createComment('task_1', { content: '    ' }, acmeManager),
      err => err.status === 400 && err.message.includes('cannot be empty')
    );
  });

  test('TC-COMM-03: Comment exceeding MAX_COMMENT_LENGTH (2000 chars) is rejected with 400', () => {
    const overlyLongText = 'A'.repeat(MAX_COMMENT_LENGTH + 1);
    assert.throws(
      () => createComment('task_1', { content: overlyLongText }, acmeManager),
      err => err.status === 400 && err.message.includes('exceeds maximum allowed length')
    );
  });

  test('TC-COMM-04: Commenting on a non-existent task returns 404 Not Found', () => {
    assert.throws(
      () => createComment('task_non_existent_9999', { content: 'Valid content' }, acmeManager),
      err => err.status === 404 && err.message.includes('Task not found')
    );
  });

  test('TC-COMM-05: Unauthorized user from another organization cannot comment (404 Data Isolation)', () => {
    assert.throws(
      () => createComment('task_1', { content: 'Malicious external attempt' }, betaOwner),
      err => err.status === 404 && err.message.includes('Task not found')
    );
  });

  test('TC-COMM-06: Employee not assigned to the project is forbidden from commenting (403)', () => {
    assert.throws(
      () => createComment('task_1', { content: 'Trying to comment on private project' }, acmeExternalEmployee),
      err => err.status === 403 && err.message.includes('Forbidden')
    );
  });

  test('TC-COMM-07: HTML/XSS injection in comment is properly sanitized', () => {
    const xssPayload = '<script>alert("hacked")</script><img src="x" onerror="stealCookie()">';
    const comment = createComment('task_1', { content: xssPayload }, acmeManager);

    assert.ok(!comment.content.includes('<script>'));
    assert.ok(comment.content.includes('&lt;script&gt;'));
    assert.ok(!comment.content.includes('<img'));
    assert.ok(comment.content.includes('&lt;img'));
  });

  test('TC-COMM-08: Get comments returns task comments and masks cross-tenant comments', () => {
    const comments = getCommentsByTask('task_1', acmeManager);
    assert.ok(Array.isArray(comments));
    assert.ok(comments.length >= 1);
    assert.ok(comments.every(c => c.orgId === 'org_acme_corp'));

    // Beta owner cannot read Acme task comments
    assert.throws(
      () => getCommentsByTask('task_1', betaOwner),
      err => err.status === 404
    );
  });

  test('TC-COMM-09: Delete comment authorization: author/manager can delete, other employee is forbidden', () => {
    const comment = createComment('task_1', { content: 'Temporary note' }, acmeEmployee);

    // Another employee tries to delete
    const otherEmployee = {
      id: 'user_employee_2',
      orgId: 'org_acme_corp',
      role: 'EMPLOYEE'
    };
    assert.throws(
      () => deleteComment(comment.id, otherEmployee),
      err => err.status === 403 && err.message.includes('cannot delete another user\'s comment')
    );

    // Author employee can delete
    const result = deleteComment(comment.id, acmeEmployee);
    assert.equal(result.success, true);
  });
});
