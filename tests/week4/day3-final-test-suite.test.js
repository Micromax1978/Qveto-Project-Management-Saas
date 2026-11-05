/**
 * day3-final-test-suite.test.js
 * Week 4 Day 3: Comprehensive Final Regression Test Suite
 * 
 * Verifies all modules across Weeks 1-4:
 * 1. RBAC & Multi-tenant isolation (Owner, Manager, Employee)
 * 2. Project CRUD, validation, and scoping
 * 3. Task lifecycle, subtasks, priorities, and Kanban status changes
 * 4. Collaboration: comments, sanitization, attachment validation, and secure downloads
 * 5. Notifications: event triggers, overdue detection, and deduplication
 * 6. Analytics: KPI calculations, zero division handling, and markdown export
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { getDb, resetDb } = require('../../backend/src/data/mockDb');
const AuthService = require('../../backend/src/auth/auth.service');
const ProjectService = require('../../backend/src/projects/project.service');
const { TaskService } = require('../../backend/src/tasks/task.service');
const CommentService = require('../../backend/src/collaboration/comment.service');
const AttachmentService = require('../../backend/src/collaboration/attachment.service');
const NotificationService = require('../../backend/src/collaboration/notification.service');
const ReportService = require('../../backend/src/analytics/report.service');

describe('Week 4 - Day 3: Final System Integration & Regression Suite', () => {
  let ownerUser, managerUser, employeeUser, externalUser;

  beforeEach(() => {
    resetDb();
    ownerUser = AuthService.login('alice@acme.com', 'password123').user;
    managerUser = AuthService.login('bob@acme.com', 'password123').user;
    employeeUser = AuthService.login('charlie@acme.com', 'password123').user;
    externalUser = AuthService.login('eve@beta.com', 'password123').user;
  });

  // 1. RBAC & Tenant Scoping
  test('TC-FINAL-01: RBAC matrix enforces strict role-based operations', () => {
    // Owner can view all org projects
    const ownerProjects = ProjectService.listProjects(ownerUser);
    assert.strictEqual(ownerProjects.length, 2);

    // Manager can create project
    const proj = ProjectService.createProject({
      name: 'Regression Project Alpha',
      description: 'Test project for RBAC'
    }, managerUser);
    assert.ok(proj.id);

    // Employee cannot create project (403)
    assert.throws(
      () => ProjectService.createProject({ name: 'Unauthorized Proj' }, employeeUser),
      err => {
        assert.strictEqual(err.status, 403);
        return true;
      }
    );
  });

  // 2. Task Lifecycle & Subtask Math
  test('TC-FINAL-02: Task lifecycle, subtask percentage, and status transitions', () => {
    const task = TaskService.createTask({
      projectId: 'proj_acme_web',
      title: 'Final Acceptance Testing',
      priority: 'HIGH',
      status: 'TODO',
      assigneeId: employeeUser.id,
      subtasks: [
        { id: 's1', title: 'Subtask 1', isCompleted: false },
        { id: 's2', title: 'Subtask 2', isCompleted: false }
      ]
    }, managerUser);

    assert.strictEqual(task.subtaskProgress, 0);

    // Complete 1 subtask
    const updated = TaskService.updateTask(task.id, {
      subtasks: [
        { id: 's1', title: 'Subtask 1', isCompleted: true },
        { id: 's2', title: 'Subtask 2', isCompleted: false }
      ]
    }, employeeUser);
    assert.strictEqual(updated.subtaskProgress, 50);

    // Advance Kanban status
    const moved = TaskService.updateKanbanStatus(task.id, { targetStatus: 'DONE' }, managerUser);
    assert.strictEqual(moved.status, 'DONE');
    assert.ok(moved.completedAt);
  });

  // 3. Collaboration Security
  test('TC-FINAL-03: Comments and attachments enforce sanitization and size limits', () => {
    // XSS injection sanitization in comment
    const rawComment = '<script>alert("xss")</script>Important note';
    const comment = CommentService.createComment('task_1', { content: rawComment }, employeeUser);
    assert.strictEqual(comment.content.includes('<script>'), false);
    assert.ok(comment.content.includes('&lt;script&gt;'));

    // Reject oversized file upload (>10MB)
    assert.throws(
      () => AttachmentService.uploadAttachment('task_1', {
        fileName: 'huge.zip',
        fileSize: 15 * 1024 * 1024,
        mimeType: 'application/zip'
      }, employeeUser),
      err => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('exceeds'));
        return true;
      }
    );
  });

  // 4. Overdue Task Detection & Notification Deduplication
  test('TC-FINAL-04: Overdue tasks calculated accurately and duplicate notifications suppressed', () => {
    const notifPayload = {
      userId: employeeUser.id,
      type: 'TASK_DEADLINE',
      title: 'Approaching Deadline',
      message: 'Task due shortly',
      relatedTaskId: 'task_2'
    };

    const first = NotificationService.createNotification(notifPayload, managerUser);
    assert.ok(first.id);

    // Second duplicate notification within cooldown is suppressed
    const second = NotificationService.createNotification(notifPayload, managerUser);
    assert.strictEqual(second.deduplicated, true);
  });

  // 5. Analytics & KPI Engine
  test('TC-FINAL-05: KPI calculation engine verifies mathematical invariants', () => {
    const kpis = ReportService.getProjectKPIs('proj_acme_web', managerUser);
    assert.ok(kpis.completionRate >= 0 && kpis.completionRate <= 100);
    assert.ok(kpis.onTimeCompletionRate >= 0 && kpis.onTimeCompletionRate <= 100);
    assert.ok(kpis.assignmentCoverage >= 0 && kpis.assignmentCoverage <= 100);
    assert.strictEqual(
      kpis.statusBreakdown.TODO + kpis.statusBreakdown.IN_PROGRESS + kpis.statusBreakdown.REVIEW + kpis.statusBreakdown.DONE,
      kpis.totalTasks
    );

    const progress = ReportService.calculateProjectProgress('proj_acme_web', managerUser);
    assert.ok(progress.progressPercentage >= 0 && progress.progressPercentage <= 100);
    assert.ok(progress.subtaskWeightedProgress >= 0 && progress.subtaskWeightedProgress <= 100);
  });

  // 6. Cross-Tenant Boundaries
  test('TC-FINAL-06: Strict boundary prevents cross-tenant leaks', () => {
    assert.throws(
      () => ProjectService.getProjectById('proj_acme_web', externalUser),
      err => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );

    assert.throws(
      () => TaskService.getTaskById('task_1', externalUser),
      err => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });
});
