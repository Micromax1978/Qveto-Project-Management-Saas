const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// In node environment, mock localStorage
const mockStorageData = {};
global.localStorage = {
  getItem: (key) => mockStorageData[key] || null,
  setItem: (key, val) => {
    mockStorageData[key] = String(val);
  },
  removeItem: (key) => {
    delete mockStorageData[key];
  },
  clear: () => {
    Object.keys(mockStorageData).forEach((k) => delete mockStorageData[k]);
  },
};

describe('TASKORA Week 3 - Collaboration, Attachments & Notifications', () => {
  const { ROLES, Permissions } = require('../../frontend/src/constants/roles');
  const {
    isTaskOverdue,
    getDeadlineStatus,
    formatRelativeTime,
  } = require('../../frontend/src/utils/dateUtils');
  const {
    validateAttachmentFile,
    formatFileSize,
  } = require('../../frontend/src/services/attachmentService');
  const { commentService } = require('../../frontend/src/services/commentService');
  const { attachmentService } = require('../../frontend/src/services/attachmentService');
  const { activityService } = require('../../frontend/src/services/activityService');
  const { notificationService } = require('../../frontend/src/services/notificationService');
  const { taskService } = require('../../frontend/src/services/taskService');
  const { resetStorage, Storage } = require('../../frontend/src/services/storage');

  beforeEach(() => {
    global.localStorage.clear();
    resetStorage();
  });

  // ----------------------------------------------------
  // MODULE 1: Task Comments & Collaboration
  // ----------------------------------------------------
  describe('Module 1: Task Comments & Collaboration Logic', () => {
    const managerUser = {
      id: 'user_manager_1',
      name: 'Bob Manager',
      role: 'MANAGER',
      orgId: 'org_acme_corp',
    };
    const employeeUser = {
      id: 'user_employee_1',
      name: 'Charlie Dev',
      role: 'EMPLOYEE',
      orgId: 'org_acme_corp',
    };
    const employee2User = {
      id: 'user_employee_2',
      name: 'David QA',
      role: 'EMPLOYEE',
      orgId: 'org_acme_corp',
    };

    test('TC-FE-COMM-01: List comments in chronological order for a task', async () => {
      const comments = await commentService.getComments('task_2', managerUser);
      assert.ok(Array.isArray(comments));
      assert.ok(comments.length >= 2);
      // Verify chronological order (oldest to newest)
      for (let i = 0; i < comments.length - 1; i++) {
        const timeA = new Date(comments[i].createdAt).getTime();
        const timeB = new Date(comments[i + 1].createdAt).getTime();
        assert.ok(timeA <= timeB, 'Comments should be sorted chronologically');
      }
    });

    test('TC-FE-COMM-02: Add comment with author identity and persistence', async () => {
      const newComment = await commentService.addComment(
        'task_2',
        'Testing responsive layout on mobile drawer.',
        employeeUser
      );
      assert.ok(newComment.id);
      assert.strictEqual(newComment.taskId, 'task_2');
      assert.strictEqual(newComment.userId, employeeUser.id);
      assert.strictEqual(newComment.content, 'Testing responsive layout on mobile drawer.');
      assert.strictEqual(newComment.isEdited, false);

      // Verify comment appears in list
      const list = await commentService.getComments('task_2', employeeUser);
      assert.ok(list.some((c) => c.id === newComment.id));
    });

    test('TC-FE-COMM-03: Empty or whitespace comment is rejected with 400', async () => {
      await assert.rejects(
        async () => {
          await commentService.addComment('task_2', '   ', employeeUser);
        },
        (err) => err.status === 400
      );
    });

    test('TC-FE-COMM-04: Author can edit their own comment and sets isEdited flag', async () => {
      const comment = await commentService.addComment(
        'task_2',
        'Initial drafting of tests',
        employeeUser
      );
      const updated = await commentService.updateComment(
        comment.id,
        'Updated comment with new details',
        employeeUser
      );
      assert.strictEqual(updated.content, 'Updated comment with new details');
      assert.strictEqual(updated.isEdited, true);
    });

    test('TC-FE-COMM-05: Non-author Employee cannot edit another user comment (403)', async () => {
      const comment = await commentService.addComment(
        'task_2',
        'Manager instructions',
        managerUser
      );
      await assert.rejects(
        async () => {
          await commentService.updateComment(comment.id, 'Employee trying to tamper', employeeUser);
        },
        (err) => err.status === 403
      );
    });

    test('TC-FE-COMM-06: Author can delete their own comment', async () => {
      const comment = await commentService.addComment('task_2', 'Temporary note', employeeUser);
      const res = await commentService.deleteComment(comment.id, employeeUser);
      assert.strictEqual(res.success, true);

      const list = await commentService.getComments('task_2', employeeUser);
      assert.ok(!list.some((c) => c.id === comment.id));
    });

    test('TC-FE-COMM-07: Manager can moderate and delete employee comment', async () => {
      const comment = await commentService.addComment('task_2', 'Comment to moderate', employeeUser);
      const res = await commentService.deleteComment(comment.id, managerUser);
      assert.strictEqual(res.success, true);
    });

    test('TC-FE-COMM-08: Employee cannot delete another employee comment (403)', async () => {
      const comment = await commentService.addComment('task_2', 'David note', employee2User);
      await assert.rejects(
        async () => {
          await commentService.deleteComment(comment.id, employeeUser);
        },
        (err) => err.status === 403
      );
    });
  });

  // ----------------------------------------------------
  // MODULE 2: File Attachments
  // ----------------------------------------------------
  describe('Module 2: File Attachments Validation & Storage', () => {
    const employeeUser = {
      id: 'user_employee_1',
      name: 'Charlie Dev',
      role: 'EMPLOYEE',
      orgId: 'org_acme_corp',
    };
    const managerUser = {
      id: 'user_manager_1',
      name: 'Bob Manager',
      role: 'MANAGER',
      orgId: 'org_acme_corp',
    };

    test('TC-FE-ATT-01: Accepts valid files within allowed extensions and size', () => {
      const mockFile = { name: 'architecture-diagram.png', size: 1024 * 500 };
      const val = validateAttachmentFile(mockFile);
      assert.strictEqual(val.isValid, true);
      assert.strictEqual(val.error, null);
    });

    test('TC-FE-ATT-02: Executable files (.exe, .sh, .bat) are blocked with security violation', () => {
      const exeFile = { name: 'malware.exe', size: 1024 };
      const valExe = validateAttachmentFile(exeFile);
      assert.strictEqual(valExe.isValid, false);
      assert.ok(valExe.error.includes('Security violation'));

      const shFile = { name: 'hack.sh', size: 1024 };
      const valSh = validateAttachmentFile(shFile);
      assert.strictEqual(valSh.isValid, false);
    });

    test('TC-FE-ATT-03: Files exceeding 10MB limit are rejected', () => {
      const largeFile = { name: 'huge-video.mp4', size: 15 * 1024 * 1024 };
      const val = validateAttachmentFile(largeFile);
      assert.strictEqual(val.isValid, false);
      assert.ok(val.error.includes('exceeds'));
    });

    test('TC-FE-ATT-04: Empty (0-byte) files are rejected', () => {
      const emptyFile = { name: 'empty.pdf', size: 0 };
      const val = validateAttachmentFile(emptyFile);
      assert.strictEqual(val.isValid, false);
    });

    test('TC-FE-ATT-05: Upload attachment records metadata with progress', async () => {
      let reportedProgress = 0;
      const file = { name: 'wireframe.png', size: 350000, type: 'image/png' };
      const att = await attachmentService.uploadAttachment(
        'task_2',
        file,
        employeeUser,
        (progress) => {
          reportedProgress = progress;
        }
      );

      assert.ok(att.id);
      assert.strictEqual(att.name, 'wireframe.png');
      assert.strictEqual(att.size, 350000);
      assert.strictEqual(att.userId, employeeUser.id);
      assert.strictEqual(reportedProgress, 100);

      const list = await attachmentService.getAttachments('task_2', employeeUser);
      assert.ok(list.some((a) => a.id === att.id));
    });

    test('TC-FE-ATT-06: Uploader or Manager can remove attachment', async () => {
      const file = { name: 'temp.pdf', size: 12000, type: 'application/pdf' };
      const att = await attachmentService.uploadAttachment('task_2', file, employeeUser);

      const res = await attachmentService.deleteAttachment(att.id, employeeUser);
      assert.strictEqual(res.success, true);

      const list = await attachmentService.getAttachments('task_2', employeeUser);
      assert.ok(!list.some((a) => a.id === att.id));
    });
  });

  // ----------------------------------------------------
  // MODULE 3: Activity History & Audit Timeline
  // ----------------------------------------------------
  describe('Module 3: Activity History & Audit Stream', () => {
    const employeeUser = {
      id: 'user_employee_1',
      name: 'Charlie Dev',
      role: 'EMPLOYEE',
      orgId: 'org_acme_corp',
    };

    test('TC-FE-ACT-01: Activity history is retrieved reverse chronologically (newest first)', async () => {
      const activities = await activityService.getActivities('task_2', employeeUser);
      assert.ok(Array.isArray(activities));
      assert.ok(activities.length >= 2);

      for (let i = 0; i < activities.length - 1; i++) {
        const timeA = new Date(activities[i].createdAt).getTime();
        const timeB = new Date(activities[i + 1].createdAt).getTime();
        assert.ok(timeA >= timeB, 'Activities must be reverse chronologically ordered');
      }
    });

    test('TC-FE-ACT-02: Task status change automatically logs audit activity', async () => {
      await taskService.updateStatus('task_3', 'IN_PROGRESS', employeeUser);

      const activities = await activityService.getActivities('task_3', employeeUser);
      const statusActivity = activities.find((a) => a.type === 'STATUS_CHANGED');
      assert.ok(statusActivity, 'Status change activity must be logged');
      assert.strictEqual(statusActivity.oldValue, 'TODO');
      assert.strictEqual(statusActivity.newValue, 'IN_PROGRESS');
    });

    test('TC-FE-ACT-03: Subtask completion automatically logs audit activity', async () => {
      await taskService.toggleSubtask('task_3', 'sub_6', employeeUser);

      const activities = await activityService.getActivities('task_3', employeeUser);
      const subtaskActivity = activities.find((a) => a.type === 'SUBTASK_TOGGLED');
      assert.ok(subtaskActivity, 'Subtask toggle activity must be logged');
    });
  });

  // ----------------------------------------------------
  // MODULE 4: In-App Notification Center
  // ----------------------------------------------------
  describe('Module 4: In-App Notification Center', () => {
    const employeeUser = {
      id: 'user_employee_1',
      name: 'Charlie Dev',
      role: 'EMPLOYEE',
      orgId: 'org_acme_corp',
    };
    const managerUser = {
      id: 'user_manager_1',
      name: 'Bob Manager',
      role: 'MANAGER',
      orgId: 'org_acme_corp',
    };

    test('TC-FE-NOTIF-01: Returns notifications scoped to current user', async () => {
      const notifs = await notificationService.getNotifications(employeeUser);
      assert.ok(Array.isArray(notifs));
      assert.ok(notifs.length >= 2);
      assert.ok(notifs.every((n) => n.recipientId === employeeUser.id || !n.recipientId));
    });

    test('TC-FE-NOTIF-02: Correct unread notification count', async () => {
      const unreadCount = await notificationService.getUnreadCount(employeeUser);
      assert.strictEqual(typeof unreadCount, 'number');
      assert.ok(unreadCount >= 1);
    });

    test('TC-FE-NOTIF-03: Mark single notification as read', async () => {
      const notifs = await notificationService.getNotifications(employeeUser, { unreadOnly: true });
      assert.ok(notifs.length > 0);
      const target = notifs[0];

      const updated = await notificationService.markAsRead(target.id, employeeUser);
      assert.strictEqual(updated.isRead, true);

      const afterCount = await notificationService.getUnreadCount(employeeUser);
      assert.ok(afterCount >= 0);
    });

    test('TC-FE-NOTIF-04: Mark all notifications as read', async () => {
      const res = await notificationService.markAllAsRead(employeeUser);
      assert.strictEqual(res.success, true);

      const count = await notificationService.getUnreadCount(employeeUser);
      assert.strictEqual(count, 0);
    });

    test('TC-FE-NOTIF-05: Adding comment triggers notification to task assignee', async () => {
      // Bob manager comments on task_2 (which is assigned to Charlie Dev)
      await commentService.addComment(
        'task_2',
        'Charlie, please check the mobile touch triggers.',
        managerUser
      );

      const charlieNotifs = await notificationService.getNotifications(employeeUser);
      const commentNotif = charlieNotifs.find(
        (n) => n.type === 'COMMENT_ADDED' && n.message.includes('Charlie, please check')
      );
      assert.ok(commentNotif, 'Assignee should receive notification when comment is posted');
    });
  });

  // ----------------------------------------------------
  // MODULE 5: Overdue Task Alerts & Date Utils
  // ----------------------------------------------------
  describe('Module 5: Overdue Task Identification & Date Rules', () => {
    test('TC-FE-DATE-01: Correctly identifies overdue task past its due date', () => {
      const pastTask = {
        title: 'Old task',
        dueDate: '2026-10-20',
        status: 'IN_PROGRESS',
      };
      // Reference date is 2026-10-26
      const refDate = new Date('2026-10-26T12:00:00Z');
      assert.strictEqual(isTaskOverdue(pastTask, refDate), true);
    });

    test('TC-FE-DATE-02: Completed task (DONE) is never overdue even with past due date', () => {
      const doneTask = {
        title: 'Completed task',
        dueDate: '2026-10-10',
        status: 'DONE',
      };
      const refDate = new Date('2026-10-26T12:00:00Z');
      assert.strictEqual(isTaskOverdue(doneTask, refDate), false);
    });

    test('TC-FE-DATE-03: Task without due date is never overdue', () => {
      const noDueDateTask = {
        title: 'Backlog item',
        dueDate: null,
        status: 'TODO',
      };
      assert.strictEqual(isTaskOverdue(noDueDateTask), false);
    });

    test('TC-FE-DATE-04: getDeadlineStatus computes correct overdue days and label', () => {
      const task = {
        title: 'Task 3 days overdue',
        dueDate: '2026-10-23',
        status: 'IN_PROGRESS',
      };
      const refDate = new Date('2026-10-26T12:00:00Z');
      const deadline = getDeadlineStatus(task, refDate);

      assert.strictEqual(deadline.isOverdue, true);
      assert.strictEqual(deadline.overdueDays, 3);
      assert.strictEqual(deadline.label, 'Overdue by 3 days');
      assert.strictEqual(deadline.shortLabel, '3d overdue');
    });

    test('TC-FE-DATE-05: getDeadlineStatus identifies Due today and Due tomorrow', () => {
      const refDate = new Date('2026-10-26T12:00:00Z');

      const todayTask = { title: 'Today task', dueDate: '2026-10-26', status: 'TODO' };
      const todayStatus = getDeadlineStatus(todayTask, refDate);
      assert.strictEqual(todayStatus.isDueToday, true);
      assert.strictEqual(todayStatus.label, 'Due today');

      const tomorrowTask = { title: 'Tomorrow task', dueDate: '2026-10-27', status: 'TODO' };
      const tomorrowStatus = getDeadlineStatus(tomorrowTask, refDate);
      assert.strictEqual(todayStatus.isDueTomorrow, false);
      assert.strictEqual(tomorrowStatus.isDueTomorrow, true);
      assert.strictEqual(tomorrowStatus.label, 'Due tomorrow');
    });

    test('TC-FE-DATE-06: formatRelativeTime handles recent times and days ago', () => {
      const now = new Date();
      assert.strictEqual(formatRelativeTime(now.toISOString()), 'just now');

      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
      assert.strictEqual(formatRelativeTime(tenMinsAgo.toISOString()), '10 minutes ago');

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      assert.strictEqual(formatRelativeTime(twoHoursAgo.toISOString()), '2 hours ago');
    });
  });
});

