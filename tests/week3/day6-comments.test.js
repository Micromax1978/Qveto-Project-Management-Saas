const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { TaskService } = require('../../backend/src/tasks/task.service');
const { resetDb, getDb } = require('../../backend/src/data/mockDb');

describe('Week 3 - Day 6: Task Comments Discussion, Ordering & Activity Tests', () => {
  beforeEach(() => {
    resetDb();
  });

  const manager = { id: 'user_manager_1', orgId: 'org_acme_corp', role: 'MANAGER', name: 'Bob Manager' };
  const employee = { id: 'user_employee_1', orgId: 'org_acme_corp', role: 'EMPLOYEE', name: 'Charlie Dev' };
  const foreignUser = { id: 'user_external_owner', orgId: 'org_beta_tech', role: 'OWNER', name: 'Eve Beta' };

  test('TC-COMM-01: Authenticated user can successfully create a comment on a task', () => {
    const comment = TaskService.createComment('task_1', {
      text: 'Database schema and ER diagrams look comprehensive. Proceeding to migration.'
    }, manager);

    assert.ok(comment.id, 'Comment ID must be generated');
    assert.strictEqual(comment.taskId, 'task_1');
    assert.strictEqual(comment.authorId, manager.id);
    assert.strictEqual(comment.orgId, manager.orgId);
    assert.strictEqual(comment.text, 'Database schema and ER diagrams look comprehensive. Proceeding to migration.');
    assert.ok(comment.createdAt, 'Timestamp must be present');
    assert.strictEqual(comment.author.id, manager.id);
    assert.strictEqual(comment.author.name, 'Bob Manager');
  });

  test('TC-COMM-02: Retrieving comments returns list in oldest-first chronological order', () => {
    // Add two comments sequentially
    TaskService.createComment('task_1', { text: 'Comment #1: Initial kick-off' }, manager);
    TaskService.createComment('task_1', { text: 'Comment #2: Follow up question' }, employee);

    const comments = TaskService.listComments('task_1', manager);

    assert.strictEqual(comments.length, 2);
    assert.strictEqual(comments[0].text, 'Comment #1: Initial kick-off');
    assert.strictEqual(comments[1].text, 'Comment #2: Follow up question');
    assert.ok(new Date(comments[0].createdAt) <= new Date(comments[1].createdAt));
  });

  test('TC-COMM-03: Empty comment rejection (400 Bad Request)', () => {
    assert.throws(
      () => {
        TaskService.createComment('task_1', { text: '    ' }, manager);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /empty/i);
        return true;
      }
    );
  });

  test('TC-COMM-04: Excessively long comment rejection (> 5000 chars throws 400)', () => {
    const tooLong = 'Z'.repeat(5001);
    assert.throws(
      () => {
        TaskService.createComment('task_1', { text: tooLong }, manager);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /exceeds maximum allowed length/i);
        return true;
      }
    );
  });

  test('TC-COMM-05: Missing task returns 404 Not Found', () => {
    assert.throws(
      () => {
        TaskService.createComment('ghost_task_9999', { text: 'Hello void' }, manager);
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        assert.match(err.message, /Task not found/i);
        return true;
      }
    );
  });

  test('TC-COMM-06: Unauthenticated user rejected on comment creation (401)', () => {
    assert.throws(
      () => {
        TaskService.createComment('task_1', { text: 'Anonymous message' }, null);
      },
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.match(err.message, /Unauthorized/i);
        return true;
      }
    );
  });

  test('TC-COMM-07: User from another organization rejected (Cross-tenant isolation)', () => {
    // task_1 belongs to org_acme_corp; foreignUser belongs to org_beta_tech
    assert.throws(
      () => {
        TaskService.createComment('task_1', { text: 'Corporate espionage attempt' }, foreignUser);
      },
      (err) => {
        assert.strictEqual(err.status, 404); // Data isolation masks existence
        assert.match(err.message, /Task not found/i);
        return true;
      }
    );
  });

  test('TC-COMM-08: Activity audit log event recorded on successful comment creation', () => {
    TaskService.createComment('task_1', { text: 'Audit trail test comment' }, manager);

    const db = getDb();
    const auditRecord = (db.auditLogs || []).find(
      (log) => log.action === 'COMMENT_CREATED' && log.taskId === 'task_1'
    );

    assert.ok(auditRecord, 'Activity event must be recorded in audit log');
    assert.strictEqual(auditRecord.actorId, manager.id);
    assert.strictEqual(auditRecord.orgId, manager.orgId);
    assert.ok(auditRecord.entityId);
    assert.ok(auditRecord.timestamp);
  });
});
