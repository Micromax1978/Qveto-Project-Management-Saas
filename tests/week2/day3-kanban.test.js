const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { TaskService } = require('../../backend/src/tasks/task.service');
const { resetDb } = require('../../backend/src/data/mockDb');

describe('Week 2 - Day 3: Kanban Board Workflows, Drag & Drop, Alternative Controls & Persistence', () => {
  beforeEach(() => {
    resetDb();
  });

  const user = { id: 'user_employee_1', orgId: 'org_acme_corp', role: 'EMPLOYEE' };

  test('TC-KANBAN-01: Drag and drop status transition (TODO -> IN_PROGRESS)', () => {
    // task_3 is currently in TODO
    const initial = TaskService.getTaskById('task_3', user);
    assert.strictEqual(initial.status, 'TODO');

    // Simulate drag & drop to IN_PROGRESS at column index 1
    const moved = TaskService.updateKanbanStatus('task_3', {
      targetStatus: 'IN_PROGRESS',
      newOrderIndex: 1
    }, user);

    assert.strictEqual(moved.status, 'IN_PROGRESS');
    assert.strictEqual(moved.orderIndex, 1);
  });

  test('TC-KANBAN-02: Alternative keyboard/accessible control moves task to NEXT stage', () => {
    // task_3 starts in TODO. Moving NEXT should advance it to IN_PROGRESS
    const step1 = TaskService.moveKanbanAccessible('task_3', 'NEXT', user);
    assert.strictEqual(step1.status, 'IN_PROGRESS');

    // Moving NEXT again should advance it to REVIEW
    const step2 = TaskService.moveKanbanAccessible('task_3', 'NEXT', user);
    assert.strictEqual(step2.status, 'REVIEW');

    // Moving PREV should bring it back to IN_PROGRESS
    const step3 = TaskService.moveKanbanAccessible('task_3', 'PREV', user);
    assert.strictEqual(step3.status, 'IN_PROGRESS');
  });

  test('TC-KANBAN-03: Refresh and check correct task state was saved (Persistence)', () => {
    // Perform update
    TaskService.updateKanbanStatus('task_3', { targetStatus: 'DONE', newOrderIndex: 2 }, user);

    // Simulate page refresh / new query from database
    const freshQuery = TaskService.getTaskById('task_3', user);
    assert.strictEqual(freshQuery.status, 'DONE');
    assert.strictEqual(freshQuery.orderIndex, 2);
    assert.ok(freshQuery.completedAt, 'Moving to DONE must set completedAt timestamp');
  });

  test('TC-KANBAN-04: Moving back from DONE clears completedAt timestamp', () => {
    // task_1 is currently DONE
    const initial = TaskService.getTaskById('task_1', user);
    assert.strictEqual(initial.status, 'DONE');
    assert.ok(initial.completedAt);

    // Reopen task to IN_PROGRESS
    const reopened = TaskService.updateKanbanStatus('task_1', { targetStatus: 'IN_PROGRESS' }, user);
    assert.strictEqual(reopened.status, 'IN_PROGRESS');
    assert.strictEqual(reopened.completedAt, null);
  });

  test('TC-KANBAN-05: Invalid Kanban target status is rejected (400)', () => {
    assert.throws(
      () => {
        TaskService.updateKanbanStatus('task_3', { targetStatus: 'CANCELLED_INVALID' }, user);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /invalid kanban status/i);
        return true;
      }
    );
  });
});
