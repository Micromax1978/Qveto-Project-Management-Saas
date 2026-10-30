/**
 * day4-notifications.test.js
 * Week 3 Day 4: Notifications for assignments, comments, due date changes,
 * read/unread state, overdue near date boundary, deduplication, and simulated email flag.
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetDb, getDb } = require('../../backend/src/data/mockDb');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  checkOverdueTasks
} = require('../../backend/src/collaboration/notification.service');

describe('Week 3 - Day 4: Notifications, Overdue Alerts & Deduplication', () => {
  let acmeUser;
  let acmeManager;

  beforeEach(() => {
    resetDb();
    acmeUser = {
      id: 'user_employee_1',
      name: 'Charlie Dev',
      email: 'charlie@acme.com',
      orgId: 'org_acme_corp',
      role: 'EMPLOYEE'
    };
    acmeManager = {
      id: 'user_manager_1',
      name: 'Bob Manager',
      email: 'bob@acme.com',
      orgId: 'org_acme_corp',
      role: 'MANAGER'
    };
  });

  test('TC-NOTIF-01: Creates notification for task assignment', () => {
    const notif = createNotification(
      {
        userId: acmeUser.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: 'You were assigned to task: Implement Task Filtering',
        relatedTaskId: 'task_3',
        userEmail: acmeUser.email
      },
      acmeManager
    );

    assert.ok(notif.id.startsWith('notif_'));
    assert.equal(notif.userId, acmeUser.id);
    assert.equal(notif.type, 'TASK_ASSIGNED');
    assert.equal(notif.isRead, false);
    assert.equal(notif.inAppDelivered, true);
  });

  test('TC-NOTIF-02: Creates notification for comment added and due date change', () => {
    const commentNotif = createNotification(
      {
        userId: acmeUser.id,
        type: 'COMMENT_ADDED',
        title: 'New Comment on Task',
        message: 'Bob added a comment to your task.',
        relatedTaskId: 'task_2'
      },
      acmeManager
    );
    assert.equal(commentNotif.type, 'COMMENT_ADDED');

    const dueDateNotif = createNotification(
      {
        userId: acmeUser.id,
        type: 'DUE_DATE_CHANGED',
        title: 'Due Date Updated',
        message: 'Due date changed to 2026-11-15',
        relatedTaskId: 'task_2'
      },
      acmeManager
    );
    assert.equal(dueDateNotif.type, 'DUE_DATE_CHANGED');
  });

  test('TC-NOTIF-03: Mark notification as read updates status and timestamp', () => {
    const unreadList = getUserNotifications(acmeUser, { isRead: false });
    assert.ok(unreadList.length > 0);

    const targetId = unreadList[0].id;
    const updated = markAsRead(targetId, acmeUser);

    assert.equal(updated.id, targetId);
    assert.equal(updated.isRead, true);
    assert.ok(updated.readAt);
  });

  test('TC-NOTIF-04: Mark all as read updates all unread notifications for user', () => {
    // Add two unread notifications
    createNotification(
      {
        userId: acmeUser.id,
        type: 'COMMENT_ADDED',
        title: 'Comment 1',
        message: 'Msg 1',
        relatedTaskId: 'task_1'
      },
      acmeManager
    );
    createNotification(
      {
        userId: acmeUser.id,
        type: 'COMMENT_ADDED',
        title: 'Comment 2',
        message: 'Msg 2',
        relatedTaskId: 'task_2'
      },
      acmeManager
    );

    const result = markAllAsRead(acmeUser);
    assert.ok(result.updatedCount >= 2);

    const remainingUnread = getUserNotifications(acmeUser, { isRead: false });
    assert.equal(remainingUnread.length, 0);
  });

  test('TC-NOTIF-05: Deduplication suppresses repeated identical notifications within cooldown', () => {
    const firstAlert = createNotification(
      {
        userId: acmeUser.id,
        type: 'COMMENT_ADDED',
        title: 'Duplicate Test',
        message: 'This should not repeat',
        relatedTaskId: 'task_unique_dedup'
      },
      acmeManager
    );
    assert.ok(firstAlert.id);

    // Second immediate attempt for same user, type, and task
    const secondAlert = createNotification(
      {
        userId: acmeUser.id,
        type: 'COMMENT_ADDED',
        title: 'Duplicate Test',
        message: 'This should not repeat',
        relatedTaskId: 'task_unique_dedup'
      },
      acmeManager
    );

    assert.equal(secondAlert.deduplicated, true);
    assert.ok(secondAlert.message.includes('suppressed'));
  });

  test('TC-NOTIF-06: Overdue detection near date boundary (1 sec before vs 1 sec after)', () => {
    const db = getDb();
    const boundaryTime = new Date('2026-10-25T12:00:00.000Z');

    // Task expiring 1 second AFTER boundary -> NOT overdue yet
    const taskFuture = {
      id: 'task_boundary_future',
      orgId: 'org_acme_corp',
      projectId: 'proj_acme_web',
      title: 'Just In Time Task',
      status: 'IN_PROGRESS',
      assigneeId: acmeUser.id,
      dueDate: '2026-10-25T12:00:01.000Z' // +1s
    };
    db.tasks.push(taskFuture);

    // Task expiring 1 second BEFORE boundary -> IS overdue
    const taskPast = {
      id: 'task_boundary_past',
      orgId: 'org_acme_corp',
      projectId: 'proj_acme_web',
      title: 'Barely Overdue Task',
      status: 'IN_PROGRESS',
      assigneeId: acmeUser.id,
      dueDate: '2026-10-25T11:59:59.000Z' // -1s
    };
    db.tasks.push(taskPast);

    const overdueList = checkOverdueTasks(boundaryTime, 'org_acme_corp');
    const overdueIds = overdueList.map(t => t.taskId);

    assert.ok(overdueIds.includes('task_boundary_past'), 'Task past due by 1s must be overdue');
    assert.ok(!overdueIds.includes('task_boundary_future'), 'Task due in 1s must NOT be overdue');
  });

  test('TC-NOTIF-07: Completed or cancelled tasks are NEVER flagged as overdue', () => {
    const db = getDb();
    const now = new Date('2026-10-30T00:00:00.000Z');

    const doneTask = {
      id: 'task_already_done',
      orgId: 'org_acme_corp',
      projectId: 'proj_acme_web',
      title: 'Completed Task in Past',
      status: 'DONE',
      dueDate: '2026-10-01T00:00:00.000Z'
    };
    db.tasks.push(doneTask);

    const overdue = checkOverdueTasks(now, 'org_acme_corp');
    assert.ok(!overdue.some(t => t.taskId === 'task_already_done'));
  });

  test('TC-NOTIF-08: Email notification is accurately labeled as simulated (never claiming live delivery)', () => {
    const notif = createNotification(
      {
        userId: acmeUser.id,
        type: 'TASK_ASSIGNED',
        title: 'Email Simulation Check',
        message: 'Verification of simulated provider status',
        relatedTaskId: 'task_1',
        userEmail: 'charlie@acme.com'
      },
      acmeManager
    );

    assert.equal(notif.emailDelivery.isSimulated, true);
    assert.equal(notif.emailDelivery.status, 'MOCK_LOGGED_NOT_SENT_TO_INTERNET');
  });
});
