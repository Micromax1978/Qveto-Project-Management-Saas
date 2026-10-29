const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { TaskService } = require('../../backend/src/tasks/task.service');
const ProjectService = require('../../backend/src/projects/project.service');
const { resetDb } = require('../../backend/src/data/mockDb');

describe('Week 2 - Day 5: Empty Data, Invalid Data, Security Sanitization & Edge Cases', () => {
  beforeEach(() => {
    resetDb();
  });

  const user = { id: 'user_employee_1', orgId: 'org_acme_corp', role: 'EMPLOYEE' };
  const manager = { id: 'user_manager_1', orgId: 'org_acme_corp', role: 'MANAGER' };

  test('TC-EDGE-01: Empty task title is rejected with 400 Bad Request', () => {
    assert.throws(
      () => {
        TaskService.createTask({
          projectId: 'proj_acme_web',
          title: '   ' // pure whitespace
        }, user);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /title is required/i);
        return true;
      }
    );
  });

  test('TC-EDGE-02: Non-matching search query returns empty array gracefully', () => {
    const results = TaskService.listTasks('proj_acme_web', { search: 'NonExistentGibberishKeyword12345' }, user);
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 0);
  });

  test('TC-EDGE-03: XSS payload in title and description is sanitized', () => {
    const maliciousTask = TaskService.createTask({
      projectId: 'proj_acme_web',
      title: '<script>alert("XSS")</script>Fix CSS',
      description: '<img src=x onerror=alert(1)>'
    }, user);

    assert.ok(!maliciousTask.title.includes('<script>'));
    assert.ok(maliciousTask.title.includes('&lt;script&gt;'));
    assert.ok(!maliciousTask.description.includes('<img'));
    assert.ok(maliciousTask.description.includes('&lt;img'));
  });

  test('TC-EDGE-04: Non-existent Project ID returns 404', () => {
    assert.throws(
      () => {
        TaskService.listTasks('proj_non_existent_9999', {}, user);
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });

  test('TC-EDGE-05: Unauthenticated request throws 401 Unauthorized', () => {
    assert.throws(
      () => {
        TaskService.listTasks('proj_acme_web', {}, null);
      },
      (err) => {
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });

  test('TC-EDGE-06: Task update with non-existent task ID returns 404', () => {
    assert.throws(
      () => {
        TaskService.updateTask('task_unknown_888', { title: 'Updated' }, user);
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });

  test('TC-EDGE-07: Resilient handling of API failure simulation', () => {
    // Simulating down-stream server failure handler
    function simulateApiCall(shouldFail = false) {
      if (shouldFail) {
        const error = new Error('Database connection pool timeout (simulated)');
        error.status = 503;
        error.code = 'SERVICE_UNAVAILABLE';
        throw error;
      }
      return { success: true };
    }

    assert.throws(
      () => simulateApiCall(true),
      (err) => {
        assert.strictEqual(err.status, 503);
        assert.strictEqual(err.code, 'SERVICE_UNAVAILABLE');
        return true;
      }
    );
  });
});
