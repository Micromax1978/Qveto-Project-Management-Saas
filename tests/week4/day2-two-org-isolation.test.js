/**
 * day2-two-org-isolation.test.js
 * Week 4 Day 2: Two-Organization Multi-Tenant Data Isolation Test Suite
 * 
 * Objectives:
 * - Instantiate two distinct organizations: Acme Corporation (Org A) and Beta Technologies (Org B)
 * - Rigorously test cross-tenant boundary isolation against URL/ID tampering attacks
 * - Verify that cross-tenant resources return HTTP 404 (Masking existence, zero data leakage)
 * - Verify Projects, Tasks, Comments, Attachments, Notifications, and Analytics are strictly partitioned.
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

describe('Week 4 - Day 2: Two-Organization Strict Isolation & ID Tampering Tests', () => {
  let acmeOwner, acmeManager, acmeDev;
  let betaOwner, betaDev;

  beforeEach(() => {
    resetDb();

    // Authenticate Org A (Acme Corporation) users
    acmeOwner = AuthService.login('alice@acme.com', 'password123').user;
    acmeManager = AuthService.login('bob@acme.com', 'password123').user;
    acmeDev = AuthService.login('charlie@acme.com', 'password123').user;

    // Authenticate Org B (Beta Technologies) users
    betaOwner = AuthService.login('eve@beta.com', 'password123').user;
    betaDev = AuthService.login('frank@beta.com', 'password123').user;
  });

  // -------------------------------------------------------------
  // Test 1: Project Isolation & Cross-Tenant Tampering
  // -------------------------------------------------------------
  test('TC-ISO-01: Cross-organization project access and mutation returns 404', () => {
    // Org B Owner attempts to read Org A project (Acme Web App)
    assert.throws(
      () => ProjectService.getProjectById('proj_acme_web', betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Project not found');
        return true;
      },
      'Beta Owner should receive 404 when querying Acme project ID'
    );

    // Org A Owner attempts to read Org B project (Beta CRM)
    assert.throws(
      () => ProjectService.getProjectById('proj_beta_crm', acmeOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Project not found');
        return true;
      },
      'Acme Owner should receive 404 when querying Beta project ID'
    );

    // Org B Owner listing projects only gets Org B projects
    const betaProjects = ProjectService.listProjects(betaOwner);
    assert.strictEqual(betaProjects.length, 1);
    assert.strictEqual(betaProjects[0].id, 'proj_beta_crm');
    assert.strictEqual(betaProjects.some(p => p.orgId === 'org_acme_corp'), false);

    // Org A Manager listing projects only gets Org A projects
    const acmeProjects = ProjectService.listProjects(acmeManager);
    assert.strictEqual(acmeProjects.length, 2);
    assert.strictEqual(acmeProjects.some(p => p.orgId === 'org_beta_tech'), false);
  });

  // -------------------------------------------------------------
  // Test 2: Task Isolation & ID Tampering
  // -------------------------------------------------------------
  test('TC-ISO-02: Cross-organization task query and mutation returns 404', () => {
    // Beta Dev attempts to read Acme task_1
    assert.throws(
      () => TaskService.getTaskById('task_1', betaDev),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Task not found');
        return true;
      }
    );

    // Beta Dev attempts to modify Acme task_1
    assert.throws(
      () => TaskService.updateTask('task_1', { title: 'Tampered Title' }, betaDev),
      err => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );

    // Beta Owner attempts to move Acme task_1 on Kanban
    assert.throws(
      () => TaskService.updateKanbanStatus('task_1', { targetStatus: 'DONE' }, betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );

    // Beta Owner attempts to create a task injected into Acme project
    assert.throws(
      () => TaskService.createTask({
        projectId: 'proj_acme_web',
        title: 'Trojan Task in Acme Project',
        priority: 'URGENT'
      }, betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Project not found in your organization');
        return true;
      }
    );

    // Acme Dev attempts to read Beta task
    assert.throws(
      () => TaskService.getTaskById('task_beta_1', acmeDev),
      err => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });

  // -------------------------------------------------------------
  // Test 3: Comment Isolation & Cross-Tenant Tampering
  // -------------------------------------------------------------
  test('TC-ISO-03: Cross-organization comment reading and creation returns 404', () => {
    // Beta Dev attempts to fetch comments for Acme task_1
    assert.throws(
      () => CommentService.getCommentsByTask('task_1', betaDev),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Task not found');
        return true;
      }
    );

    // Beta Owner attempts to post a comment on Acme task_1
    assert.throws(
      () => CommentService.createComment('task_1', {
        content: 'Unauthorized comment injection attempt'
      }, betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Task not found');
        return true;
      }
    );

    // Acme Manager attempts to delete Beta Tech comment_beta_1
    assert.throws(
      () => CommentService.deleteComment('comment_beta_1', acmeManager),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Comment not found');
        return true;
      }
    );
  });

  // -------------------------------------------------------------
  // Test 4: File Attachment Download & Upload Isolation
  // -------------------------------------------------------------
  test('TC-ISO-04: Cross-organization attachment download and upload returns 404', () => {
    // Beta Owner attempts to download Acme architecture diagram (att_1)
    assert.throws(
      () => AttachmentService.downloadAttachment('att_1', betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Attachment not found');
        return true;
      }
    );

    // Acme Owner attempts to download Beta confidential contract (att_beta_1)
    assert.throws(
      () => AttachmentService.downloadAttachment('att_beta_1', acmeOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Attachment not found');
        return true;
      }
    );

    // Beta Dev attempts to upload an attachment to Acme task_1
    assert.throws(
      () => AttachmentService.uploadAttachment('task_1', {
        fileName: 'malicious-payload.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      }, betaDev),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Task not found');
        return true;
      }
    );
  });

  // -------------------------------------------------------------
  // Test 5: Notification Isolation & Mark-As-Read Tampering
  // -------------------------------------------------------------
  test('TC-ISO-05: Notifications are strictly partitioned between organizations', () => {
    // Beta Owner queries notifications -> must be 0 Acme notifications
    const betaNotifs = NotificationService.getUserNotifications(betaOwner);
    assert.strictEqual(betaNotifs.some(n => n.orgId === 'org_acme_corp'), false);

    // Beta Owner attempts to mark Acme notification (notif_1) as read
    assert.throws(
      () => NotificationService.markAsRead('notif_1', betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Notification not found');
        return true;
      }
    );

    // Acme Dev querying notifications only receives Acme notifications
    const acmeDevNotifs = NotificationService.getUserNotifications(acmeDev);
    assert.ok(acmeDevNotifs.length > 0);
    acmeDevNotifs.forEach(n => {
      assert.strictEqual(n.orgId, 'org_acme_corp');
      assert.strictEqual(n.userId, acmeDev.id);
    });
  });

  // -------------------------------------------------------------
  // Test 6: Analytics & KPI Multi-Tenant Partitioning
  // -------------------------------------------------------------
  test('TC-ISO-06: Cross-organization reporting and executive analytics returns 404', () => {
    // Beta Owner attempts to generate KPI report for Acme Web App
    assert.throws(
      () => ReportService.getProjectKPIs('proj_acme_web', betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'Project not found');
        return true;
      }
    );

    // Beta Owner attempts to generate progress calculation for Acme Web App
    assert.throws(
      () => ReportService.calculateProjectProgress('proj_acme_web', betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );

    // Acme Manager attempts to generate KPI report for Beta CRM
    assert.throws(
      () => ReportService.getProjectKPIs('proj_beta_crm', acmeManager),
      err => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );

    // Acme Executive Summary contains only Acme entities
    const acmeExecutive = ReportService.getOrganizationExecutiveSummary(acmeOwner);
    assert.strictEqual(acmeExecutive.organizationId, 'org_acme_corp');
    assert.strictEqual(acmeExecutive.totalProjects, 2);
    assert.strictEqual(acmeExecutive.projectsOverview.some(p => p.id === 'proj_beta_crm'), false);

    // Beta Executive Summary contains only Beta entities
    const betaExecutive = ReportService.getOrganizationExecutiveSummary(betaOwner);
    assert.strictEqual(betaExecutive.organizationId, 'org_beta_tech');
    assert.strictEqual(betaExecutive.totalProjects, 1);
    assert.strictEqual(betaExecutive.projectsOverview[0].id, 'proj_beta_crm');
  });

  // -------------------------------------------------------------
  // Test 7: User Profile Cross-Tenant Directory Masking
  // -------------------------------------------------------------
  test('TC-ISO-07: Cross-organization user lookup is masked with 404', () => {
    // Acme Owner attempts to query Beta Dev profile
    assert.throws(
      () => AuthService.getUserProfile(betaDev.id, acmeOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'User not found');
        return true;
      }
    );

    // Beta Owner attempts to query Acme Dev profile
    assert.throws(
      () => AuthService.getUserProfile(acmeDev.id, betaOwner),
      err => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, 'User not found');
        return true;
      }
    );

    // Valid intra-org lookup succeeds
    const profile = AuthService.getUserProfile(acmeDev.id, acmeManager);
    assert.strictEqual(profile.id, acmeDev.id);
    assert.strictEqual(profile.email, 'charlie@acme.com');
  });
});
