const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { TaskService } = require('../../backend/src/tasks/task.service');
const { resetDb } = require('../../backend/src/data/mockDb');

describe('Week 2 - Day 4: Search, Filters, Role Limits & Multi-Tenant Organization Limits', () => {
  beforeEach(() => {
    resetDb();
  });

  const acmeUser = { id: 'user_employee_1', orgId: 'org_acme_corp', role: 'EMPLOYEE' };
  const betaUser = { id: 'user_external_emp', orgId: 'org_beta_tech', role: 'EMPLOYEE' };

  test('TC-SEARCH-01: Search tasks by keyword in title and description', () => {
    const results = TaskService.listTasks('proj_acme_web', { search: 'Kanban' }, acmeUser);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'task_2');
    assert.match(results[0].title, /Kanban Board/i);
  });

  test('TC-FILTER-02: Filter tasks by Status', () => {
    const inProgressTasks = TaskService.listTasks('proj_acme_web', { status: 'IN_PROGRESS' }, acmeUser);
    assert.ok(inProgressTasks.length >= 1);
    assert.ok(inProgressTasks.every(t => t.status === 'IN_PROGRESS'));
  });

  test('TC-FILTER-03: Filter tasks by Priority', () => {
    const highTasks = TaskService.listTasks('proj_acme_web', { priority: 'HIGH' }, acmeUser);
    assert.ok(highTasks.length >= 2);
    assert.ok(highTasks.every(t => t.priority === 'HIGH'));
  });

  test('TC-FILTER-04: Filter tasks by Assignee', () => {
    const charlieTasks = TaskService.listTasks('proj_acme_web', { assigneeId: 'user_employee_1' }, acmeUser);
    assert.ok(charlieTasks.length >= 2);
    assert.ok(charlieTasks.every(t => t.assigneeId === 'user_employee_1'));
  });

  test('TC-FILTER-05: Filter tasks by Label/Tag', () => {
    const dbTasks = TaskService.listTasks('proj_acme_web', { label: 'database' }, acmeUser);
    assert.strictEqual(dbTasks.length, 1);
    assert.strictEqual(dbTasks[0].id, 'task_1');
    assert.ok(dbTasks[0].labels.includes('database'));
  });

  test('TC-FILTER-06: Combined multi-criteria filtering', () => {
    const filtered = TaskService.listTasks('proj_acme_web', {
      status: 'DONE',
      priority: 'HIGH',
      label: 'architecture'
    }, acmeUser);

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'task_1');
  });

  test('TC-TENANT-07: Organization A cannot read tasks of Organization B (Strict Data Isolation)', () => {
    // Acme user attempts to query tasks from Beta Tech's project 'proj_beta_crm'
    assert.throws(
      () => {
        TaskService.listTasks('proj_beta_crm', {}, acmeUser);
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });

  test('TC-TENANT-08: Tampering task ID across tenant boundary returns 404', () => {
    // Acme user attempts to retrieve 'task_beta_1' directly by ID
    assert.throws(
      () => {
        TaskService.getTaskById('task_beta_1', acmeUser);
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );

    // Beta user CAN legitimately view their own task
    const betaTask = TaskService.getTaskById('task_beta_1', betaUser);
    assert.ok(betaTask);
    assert.strictEqual(betaTask.id, 'task_beta_1');
  });
});
