/**
 * day5-boundaries-regression.test.js
 * Week 3 Day 5: Organization A vs Organization B isolation across all entities
 * and regression testing of Week 1 and Week 2 functionality.
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetDb } = require('../../backend/src/data/mockDb');
const ProjectService = require('../../backend/src/projects/project.service');
const { TaskService } = require('../../backend/src/tasks/task.service');
const { createComment, getCommentsByTask } = require('../../backend/src/collaboration/comment.service');
const { downloadAttachment } = require('../../backend/src/collaboration/attachment.service');
const { getUserNotifications } = require('../../backend/src/collaboration/notification.service');

describe('Week 3 - Day 5: Multi-Tenant Boundary Isolation & System Regression', () => {
  let acmeOwner;
  let acmeManager;
  let acmeEmployee;
  let betaOwner;
  let betaEmployee;

  beforeEach(() => {
    resetDb();
    acmeOwner = {
      id: 'user_owner_1',
      name: 'Alice Owner',
      email: 'alice@acme.com',
      orgId: 'org_acme_corp',
      role: 'OWNER'
    };
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
    betaEmployee = {
      id: 'user_external_emp',
      name: 'Frank Beta Dev',
      email: 'frank@beta.com',
      orgId: 'org_beta_tech',
      role: 'EMPLOYEE'
    };
  });

  // --- Multi-Tenant Isolation Tests ---

  test('TC-BOUND-01: Beta Tech cannot access Acme projects (404 Not Found)', () => {
    assert.throws(
      () => ProjectService.getProjectById('proj_acme_web', betaOwner),
      err => err.status === 404 && err.message.includes('Project not found')
    );
  });

  test('TC-BOUND-02: Acme cannot access Beta Tech CRM project (404 Not Found)', () => {
    assert.throws(
      () => ProjectService.getProjectById('proj_beta_crm', acmeOwner),
      err => err.status === 404 && err.message.includes('Project not found')
    );
  });

  test('TC-BOUND-03: Beta Tech cannot read or mutate Acme tasks (404 Not Found)', () => {
    assert.throws(
      () => TaskService.getTaskById('task_1', betaOwner),
      err => err.status === 404 && err.message.includes('Task not found')
    );

    assert.throws(
      () => TaskService.updateTask('task_1', { title: 'Hacked Title' }, betaOwner),
      err => err.status === 404 && err.message.includes('Task not found')
    );
  });

  test('TC-BOUND-04: Acme cannot access Beta Tech task comments (404 Not Found)', () => {
    assert.throws(
      () => getCommentsByTask('task_beta_1', acmeManager),
      err => err.status === 404 && err.message.includes('Task not found')
    );

    assert.throws(
      () => createComment('task_beta_1', { content: 'Intrusion attempt' }, acmeManager),
      err => err.status === 404 && err.message.includes('Task not found')
    );
  });

  test('TC-BOUND-05: Beta Tech cannot download Acme private attachments (404 Not Found)', () => {
    assert.throws(
      () => downloadAttachment('att_1', betaOwner),
      err => err.status === 404 && err.message.includes('Attachment not found')
    );
  });

  test('TC-BOUND-06: Notifications are strictly scoped to user and tenant (No Cross-Leak)', () => {
    const acmeNotifs = getUserNotifications(acmeEmployee);
    assert.ok(acmeNotifs.every(n => n.orgId === 'org_acme_corp'));

    const betaNotifs = getUserNotifications(betaEmployee);
    assert.ok(betaNotifs.every(n => n.orgId === 'org_beta_tech'));
  });

  // --- Regression Tests for Week 1 & Week 2 Core Workflows ---

  test('TC-REG-07: Week 1 Regression - Role permission prevents employee project creation', () => {
    assert.throws(
      () => ProjectService.createProject({ name: 'Unauthorized Employee Project' }, acmeEmployee),
      err => err.status === 403 && err.message.includes('Forbidden')
    );
  });

  test('TC-REG-08: Week 2 Regression - Kanban status transition and completion timestamp', () => {
    const moved = TaskService.updateKanbanStatus('task_2', { targetStatus: 'DONE', newOrderIndex: 0 }, acmeManager);
    assert.equal(moved.status, 'DONE');
    assert.ok(moved.completedAt);

    // Reopen task clears timestamp
    const reopened = TaskService.updateKanbanStatus('task_2', { targetStatus: 'IN_PROGRESS', newOrderIndex: 0 }, acmeManager);
    assert.equal(reopened.status, 'IN_PROGRESS');
    assert.equal(reopened.completedAt, null);
  });

  test('TC-REG-09: Week 2 Regression - Accessible keyboard Kanban controls', () => {
    const stepped = TaskService.moveKanbanAccessible('task_3', 'NEXT', acmeEmployee);
    assert.equal(stepped.status, 'IN_PROGRESS');

    const stepBack = TaskService.moveKanbanAccessible('task_3', 'PREV', acmeEmployee);
    assert.equal(stepBack.status, 'TODO');
  });

  test('TC-REG-10: Week 2 Regression - Subtask progress calculation avoids zero division', () => {
    const zeroTask = TaskService.createTask({
      projectId: 'proj_acme_web',
      title: 'Regression Zero Subtasks',
      subtasks: []
    }, acmeManager);
    assert.equal(zeroTask.subtaskProgress, 0);

    const fullTask = TaskService.updateTask(zeroTask.id, {
      subtasks: [
        { title: 'Subtask A', isCompleted: true },
        { title: 'Subtask B', isCompleted: true }
      ]
    }, acmeManager);
    assert.equal(fullTask.subtaskProgress, 100);
  });
});
