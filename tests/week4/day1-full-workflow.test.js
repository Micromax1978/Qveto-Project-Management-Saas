/**
 * day1-full-workflow.test.js
 * Week 4 Day 1: End-to-End Full Workflow Test Suite
 * 
 * Flow Tested:
 * 1. User Authentication (Login & Session Token)
 * 2. Project Lifecycle (Creation, Membership, Scoping)
 * 3. Task Management (Creation, Assignment, Subtasks, Priority)
 * 4. Kanban Workflow (Status transitions TODO -> IN_PROGRESS -> REVIEW -> DONE)
 * 5. Collaboration (Comments, Threading, Moderation)
 * 6. File Attachments (Validation, Upload, Secure Retrieval)
 * 7. Notifications (Triggering, Delivery, Read Tracking)
 * 8. Analytics & Reporting (Project Progress, Completion Rate, Workload, Markdown Export)
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

describe('Week 4 - Day 1: End-to-End Full Workflow Integration', () => {
  beforeEach(() => {
    resetDb();
  });

  test('TC-W4-FLOW-01: Full user journey from authentication to analytics reporting', () => {
    // -------------------------------------------------------------
    // Step 1: Login & Identity Establishment
    // -------------------------------------------------------------
    const aliceSession = AuthService.login('alice@acme.com', 'password123');
    assert.ok(aliceSession.token, 'Alice should receive a session token');
    assert.strictEqual(aliceSession.user.role, 'OWNER');
    assert.strictEqual(aliceSession.user.orgId, 'org_acme_corp');

    const bobSession = AuthService.login('bob@acme.com', 'password123');
    assert.strictEqual(bobSession.user.role, 'MANAGER');

    const charlieSession = AuthService.login('charlie@acme.com', 'password123');
    assert.strictEqual(charlieSession.user.role, 'EMPLOYEE');

    const ownerUser = aliceSession.user;
    const managerUser = bobSession.user;
    const devUser = charlieSession.user;

    // -------------------------------------------------------------
    // Step 2: Project Creation & Membership
    // -------------------------------------------------------------
    const newProject = ProjectService.createProject({
      name: 'Qveto Cloud Infrastructure',
      description: 'Production containerization and CI/CD pipelines',
      members: [ownerUser.id, managerUser.id, devUser.id]
    }, managerUser);

    assert.ok(newProject.id, 'Project should be assigned an ID');
    assert.strictEqual(newProject.orgId, 'org_acme_corp');
    assert.strictEqual(newProject.status, 'ACTIVE');
    assert.strictEqual(newProject.members.length, 3);

    // Verify project appears in Charlie's project list
    const devProjects = ProjectService.listProjects(devUser);
    const hasProject = devProjects.some(p => p.id === newProject.id);
    assert.strictEqual(hasProject, true, 'Charlie should see project he is assigned to');

    // -------------------------------------------------------------
    // Step 3: Task Creation with Subtasks & Priority
    // -------------------------------------------------------------
    const taskData = {
      projectId: newProject.id,
      title: 'Configure Production Kubernetes Cluster',
      description: 'Setup multi-zone cluster with automated node scaling and secrets management',
      priority: 'HIGH',
      status: 'TODO',
      assigneeId: devUser.id,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days in future
      labels: ['devops', 'kubernetes', 'infrastructure'],
      subtasks: [
        { id: 'sub_k8s_1', title: 'Provision master and worker node pools', isCompleted: false },
        { id: 'sub_k8s_2', title: 'Install Ingress Controller and TLS cert-manager', isCompleted: false },
        { id: 'sub_k8s_3', title: 'Configure RBAC service accounts', isCompleted: false }
      ]
    };

    const createdTask = TaskService.createTask(taskData, managerUser);
    assert.ok(createdTask.id, 'Task should have a valid ID');
    assert.strictEqual(createdTask.status, 'TODO');
    assert.strictEqual(createdTask.subtasks.length, 3);

    // Subtask progress should initially be 0%
    assert.strictEqual(TaskService.calculateSubtaskProgress(createdTask.subtasks), 0);

    // -------------------------------------------------------------
    // Step 4: Subtask Updates & Progress Tracking
    // -------------------------------------------------------------
    // Charlie marks 2 of 3 subtasks complete
    const updatedSubtasks = [
      { id: 'sub_k8s_1', title: 'Provision master and worker node pools', isCompleted: true },
      { id: 'sub_k8s_2', title: 'Install Ingress Controller and TLS cert-manager', isCompleted: true },
      { id: 'sub_k8s_3', title: 'Configure RBAC service accounts', isCompleted: false }
    ];

    const taskWithSubtasks = TaskService.updateTask(createdTask.id, { subtasks: updatedSubtasks }, devUser);
    const subtaskProgress = TaskService.calculateSubtaskProgress(taskWithSubtasks.subtasks);
    assert.strictEqual(subtaskProgress, 67, '2/3 completed subtasks must calculate to 67%');

    // -------------------------------------------------------------
    // Step 5: Kanban Status Transitions & Completion Timestamp
    // -------------------------------------------------------------
    // Transition TODO -> IN_PROGRESS
    const inProgressTask = TaskService.updateKanbanStatus(createdTask.id, { targetStatus: 'IN_PROGRESS' }, devUser);
    assert.strictEqual(inProgressTask.status, 'IN_PROGRESS');
    assert.strictEqual(inProgressTask.completedAt, null);

    // Transition IN_PROGRESS -> REVIEW via accessible keyboard navigation control
    const reviewTask = TaskService.moveKanbanAccessible(createdTask.id, 'NEXT', devUser);
    assert.strictEqual(reviewTask.status, 'REVIEW');

    // Manager marks task as DONE via Kanban status update
    const doneTask = TaskService.updateKanbanStatus(createdTask.id, { targetStatus: 'DONE' }, managerUser);
    assert.strictEqual(doneTask.status, 'DONE');
    assert.ok(doneTask.completedAt, 'completedAt must be populated upon reaching DONE status');

    // -------------------------------------------------------------
    // Step 6: Collaboration Comments
    // -------------------------------------------------------------
    const comment1 = CommentService.createComment(createdTask.id, {
      content: 'Cluster nodes are healthy and ingress rules verified.'
    }, devUser);
    assert.ok(comment1.id, 'Comment should be saved');
    assert.strictEqual(comment1.authorId, devUser.id);

    const comment2 = CommentService.createComment(createdTask.id, {
      content: 'Approved for staging rollout.'
    }, managerUser);
    assert.ok(comment2.id);

    const taskComments = CommentService.getCommentsByTask(createdTask.id, devUser);
    assert.strictEqual(taskComments.length, 2, 'Should list both comments in chronological order');

    // -------------------------------------------------------------
    // Step 7: File Attachment Workflow
    // -------------------------------------------------------------
    const sampleAttachment = {
      fileName: 'k8s-architecture-topology.png',
      fileSize: 2048576, // 2MB
      mimeType: 'image/png'
    };

    const uploaded = AttachmentService.uploadAttachment(createdTask.id, sampleAttachment, devUser);
    assert.ok(uploaded.id, 'Uploaded file should receive ID');
    assert.ok(uploaded.storagePath.includes('org_acme_corp'), 'File path must be tenant-partitioned');

    // Verify authorized download
    const download = AttachmentService.downloadAttachment(uploaded.id, managerUser);
    assert.strictEqual(download.fileName, 'k8s-architecture-topology.png');
    assert.strictEqual(download.mimeType, 'image/png');

    // -------------------------------------------------------------
    // Step 8: In-App Notifications
    // -------------------------------------------------------------
    const notif = NotificationService.createNotification({
      userId: devUser.id,
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: `Assigned to task: ${createdTask.title}`,
      relatedTaskId: createdTask.id
    }, managerUser);
    assert.ok(notif.id);
    assert.strictEqual(notif.emailDelivery.isSimulated, true, 'Email delivery is transparently simulated');

    const devNotifs = NotificationService.getUserNotifications(devUser);
    const targetNotif = devNotifs.find(n => n.id === notif.id);
    assert.ok(targetNotif, 'Notification should be present in user inbox');

    const readNotif = NotificationService.markAsRead(notif.id, devUser);
    assert.strictEqual(readNotif.isRead, true);

    // -------------------------------------------------------------
    // Step 9: Analytics & Reporting
    // -------------------------------------------------------------
    const progress = ReportService.calculateProjectProgress(newProject.id, managerUser);
    assert.strictEqual(progress.totalTasks, 1);
    assert.strictEqual(progress.completedTasks, 1);
    assert.strictEqual(progress.progressPercentage, 100);

    const kpis = ReportService.getProjectKPIs(newProject.id, managerUser);
    assert.strictEqual(kpis.completionRate, 100);
    assert.strictEqual(kpis.onTimeCompletionRate, 100);
    assert.strictEqual(kpis.overdueTaskCount, 0);
    assert.strictEqual(kpis.assignmentCoverage, 100);
    assert.strictEqual(kpis.statusBreakdown.DONE, 1);

    const workload = ReportService.getTeamWorkload(newProject.id, managerUser);
    assert.strictEqual(workload.length, 1);
    assert.strictEqual(workload[0].userId, devUser.id);
    assert.strictEqual(workload[0].completedTasks, 1);

    const markdownReport = ReportService.exportReportMarkdown(newProject.id, managerUser);
    assert.ok(markdownReport.includes('Project Analytics Report: Qveto Cloud Infrastructure'));
    assert.ok(markdownReport.includes('100%'));

    const orgSummary = ReportService.getOrganizationExecutiveSummary(ownerUser);
    assert.strictEqual(orgSummary.organizationId, 'org_acme_corp');
    assert.ok(orgSummary.totalTasks >= 5);
  });

  test('TC-W4-FLOW-02: Handling edge situations across the full flow', () => {
    const managerUser = { id: 'user_manager_1', orgId: 'org_acme_corp', role: 'MANAGER' };

    // Empty project reports
    const emptyProj = ProjectService.createProject({
      name: 'Empty Project for Reporting',
      description: 'Zero tasks testing'
    }, managerUser);

    const emptyProgress = ReportService.calculateProjectProgress(emptyProj.id, managerUser);
    assert.strictEqual(emptyProgress.progressPercentage, 0);
    assert.strictEqual(emptyProgress.totalTasks, 0);

    const emptyKpis = ReportService.getProjectKPIs(emptyProj.id, managerUser);
    assert.strictEqual(emptyKpis.completionRate, 0);
    assert.strictEqual(emptyKpis.overdueTaskCount, 0);

    // Overdue task calculation check
    const overdueTask = TaskService.createTask({
      projectId: emptyProj.id,
      title: 'Past Due Bugfix',
      priority: 'URGENT',
      status: 'TODO',
      dueDate: '2026-01-01T00:00:00Z' // explicitly in the past
    }, managerUser);

    const kpisWithOverdue = ReportService.getProjectKPIs(emptyProj.id, managerUser);
    assert.strictEqual(kpisWithOverdue.overdueTaskCount, 1);
    assert.ok(kpisWithOverdue.overdueTaskIds.includes(overdueTask.id));
  });
});
