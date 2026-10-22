const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { TaskService } = require('../../backend/src/tasks/task.service');
const { resetDb } = require('../../backend/src/data/mockDb');

describe('Week 2 - Day 2: Task Assignment, Priority, Due Dates, Subtasks & Labels', () => {
  beforeEach(() => {
    resetDb();
  });

  const user = { id: 'user_manager_1', orgId: 'org_acme_corp', role: 'MANAGER' };

  test('TC-TASK-01: Create task with assignment, priority, due date, subtasks, and labels', () => {
    const task = TaskService.createTask({
      projectId: 'proj_acme_web',
      title: 'Implement Dark Mode Theme',
      description: 'Add CSS theme toggle with persistence in local storage',
      priority: 'HIGH',
      assigneeId: 'user_employee_1',
      dueDate: '2026-11-15T23:59:59Z',
      labels: ['frontend', 'styling', 'accessibility'],
      subtasks: [
        { title: 'Create CSS variables for palette', isCompleted: true },
        { title: 'Build toggle button in navbar', isCompleted: false },
        { title: 'Test high contrast ratios', isCompleted: false }
      ]
    }, user);

    assert.ok(task.id);
    assert.strictEqual(task.title, 'Implement Dark Mode Theme');
    assert.strictEqual(task.priority, 'HIGH');
    assert.strictEqual(task.assigneeId, 'user_employee_1');
    assert.strictEqual(task.dueDate, '2026-11-15T23:59:59.000Z');
    assert.strictEqual(task.labels.length, 3);
    assert.ok(task.labels.includes('styling'));
    assert.strictEqual(task.subtasks.length, 3);
    assert.strictEqual(task.subtaskProgress, 33); // 1 of 3 = 33%
  });

  test('TC-TASK-02: Priority validation rejects invalid values (400)', () => {
    assert.throws(
      () => {
        TaskService.createTask({
          projectId: 'proj_acme_web',
          title: 'Invalid Priority Task',
          priority: 'SUPER_URGENT' // Not in LOW, MEDIUM, HIGH, URGENT
        }, user);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /invalid priority/i);
        return true;
      }
    );
  });

  test('TC-TASK-03: Assignee must belong to the project and organization', () => {
    assert.throws(
      () => {
        TaskService.createTask({
          projectId: 'proj_acme_web',
          title: 'Assign to External User',
          assigneeId: 'user_external_emp' // Belongs to Beta Tech, not Acme
        }, user);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /organization/i);
        return true;
      }
    );
  });

  test('TC-TASK-04: Invalid due date format is rejected (400)', () => {
    assert.throws(
      () => {
        TaskService.createTask({
          projectId: 'proj_acme_web',
          title: 'Task with Bogus Date',
          dueDate: 'not-a-valid-date-31-02-2026'
        }, user);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /invalid due date/i);
        return true;
      }
    );
  });

  test('TC-TASK-05: Subtask progress calculation updates accurately without division by zero', () => {
    // Zero subtasks -> progress = 0%
    const taskZero = TaskService.createTask({
      projectId: 'proj_acme_web',
      title: 'Zero subtasks task',
      subtasks: []
    }, user);
    assert.strictEqual(taskZero.subtaskProgress, 0);

    // Update with 2 subtasks, both completed -> 100%
    const updated = TaskService.updateTask(taskZero.id, {
      subtasks: [
        { title: 'Subtask A', isCompleted: true },
        { title: 'Subtask B', isCompleted: true }
      ]
    }, user);
    assert.strictEqual(updated.subtaskProgress, 100);
  });

  test('TC-TASK-06: Task labels are normalized and trimmed', () => {
    const task = TaskService.createTask({
      projectId: 'proj_acme_web',
      title: 'Label Normalization Task',
      labels: ['  DevOps  ', 'CI/CD', '']
    }, user);

    assert.deepStrictEqual(task.labels, ['devops', 'ci/cd']);
  });
});
