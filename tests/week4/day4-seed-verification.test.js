const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { computeTaskMetrics } = require('../../backend/services/analyticsService');
const ProjectService = require('../../backend/src/projects/project.service');
const { getDb, resetDb } = require('../../backend/src/data/mockDb');

describe('Week 4 - Day 4: Seed Data & Initial Dataset Verification Tests', () => {
  beforeEach(() => {
    resetDb();
  });

  const ownerA = { id: 'user_owner_1', orgId: 'org_acme_corp', role: 'OWNER' };
  const ownerB = { id: 'user_external_owner', orgId: 'org_beta_tech', role: 'OWNER' };

  test('TC-SEED-01: Prisma seed dataset - Organization A (Website Project A) calculation verification', () => {
    // Seed task definition from backend/prisma/seed.ts:
    // taskA: title: "Design homepage", status: "TODO", priority: "HIGH"
    const seedTasksOrgA = [
      {
        id: 'seed_task_a',
        organizationId: '11111111-1111-4111-8111-111111111111',
        projectId: 'project_a_id',
        title: 'Design homepage',
        status: 'TODO',
        priority: 'HIGH'
      }
    ];

    const metrics = computeTaskMetrics(seedTasksOrgA);

    // Independent calculation:
    // Total = 1, Completed = 0, Cancelled = 0, Eligible = 1, Remaining = 1, Progress = (0/1)*100 = 0%
    assert.strictEqual(metrics.totalTasks, 1, 'Total tasks should be 1');
    assert.strictEqual(metrics.completedTasks, 0, 'Completed tasks should be 0');
    assert.strictEqual(metrics.todoTasks, 1, 'TODO tasks should be 1');
    assert.strictEqual(metrics.inProgressTasks, 0, 'IN_PROGRESS tasks should be 0');
    assert.strictEqual(metrics.inReviewTasks, 0, 'IN_REVIEW tasks should be 0');
    assert.strictEqual(metrics.cancelledTasks, 0, 'CANCELLED tasks should be 0');
    assert.strictEqual(metrics.remainingTasks, 1, 'Remaining tasks should be 1');
    assert.strictEqual(metrics.eligibleTasks, 1, 'Eligible tasks should be 1');
    assert.strictEqual(metrics.completionPercentage, 0, 'Completion percentage should be 0%');
    assert.strictEqual(metrics.progress, 0, 'Progress should match completionPercentage');
    assert.strictEqual(metrics.projectProgress, 0, 'Project progress should match');
  });

  test('TC-SEED-02: Prisma seed dataset - Organization B (Website Project B) calculation verification', () => {
    // Seed task definition from backend/prisma/seed.ts:
    // taskB: title: "Build login page", status: "IN_PROGRESS", priority: "MEDIUM"
    const seedTasksOrgB = [
      {
        id: 'seed_task_b',
        organizationId: '22222222-2222-4222-8222-222222222222',
        projectId: 'project_b_id',
        title: 'Build login page',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM'
      }
    ];

    const metrics = computeTaskMetrics(seedTasksOrgB);

    // Independent calculation:
    // Total = 1, Completed = 0, In-Progress = 1, Cancelled = 0, Eligible = 1, Remaining = 1, Progress = (0/1)*100 = 0%
    assert.strictEqual(metrics.totalTasks, 1);
    assert.strictEqual(metrics.completedTasks, 0);
    assert.strictEqual(metrics.todoTasks, 0);
    assert.strictEqual(metrics.inProgressTasks, 1);
    assert.strictEqual(metrics.inReviewTasks, 0);
    assert.strictEqual(metrics.cancelledTasks, 0);
    assert.strictEqual(metrics.remainingTasks, 1);
    assert.strictEqual(metrics.eligibleTasks, 1);
    assert.strictEqual(metrics.completionPercentage, 0);
  });

  test('TC-SEED-03: Mock DB seed dataset - Acme Web project status verification', () => {
    // In mockDb: proj_acme_web has 4 tasks:
    // task_1: DONE
    // task_2: IN_PROGRESS
    // task_3: TODO
    // task_4: REVIEW
    const analytics = ProjectService.getProjectAnalytics('proj_acme_web', ownerA);

    assert.strictEqual(analytics.totalTasks, 4, 'Total tasks in mock seed should be 4');
    assert.strictEqual(analytics.completedTasks, 1, 'Completed tasks (DONE) should be 1');
    assert.strictEqual(analytics.todoTasks, 1, 'TODO tasks should be 1');
    assert.strictEqual(analytics.inProgressTasks, 1, 'IN_PROGRESS tasks should be 1');
    assert.strictEqual(analytics.inReviewTasks, 1, 'IN_REVIEW/REVIEW tasks should be 1');
    assert.strictEqual(analytics.cancelledTasks, 0, 'CANCELLED tasks should be 0');
    assert.strictEqual(analytics.remainingTasks, 3, 'Remaining tasks (TODO + IN_PROGRESS + REVIEW) should be 3');
    assert.strictEqual(analytics.eligibleTasks, 4, 'Eligible tasks should be 4');

    // Expected progress: (1 / 4) * 100 = 25%
    assert.strictEqual(analytics.completionPercentage, 25, 'Expected 25% completion');
    assert.strictEqual(analytics.progress, 25);
  });

  test('TC-SEED-04: Mock DB seed dataset - Empty project (Acme Mobile) verification', () => {
    // In mockDb: proj_acme_mobile has 0 tasks
    const analytics = ProjectService.getProjectAnalytics('proj_acme_mobile', ownerA);

    assert.strictEqual(analytics.totalTasks, 0);
    assert.strictEqual(analytics.completedTasks, 0);
    assert.strictEqual(analytics.remainingTasks, 0);
    assert.strictEqual(analytics.cancelledTasks, 0);
    assert.strictEqual(analytics.eligibleTasks, 0);
    assert.strictEqual(analytics.completionPercentage, 0, 'Empty project must be 0% without NaN or division by zero');
    assert.strictEqual(analytics.progress, 0);
  });

  test('TC-SEED-05: Mock DB seed dataset - Cross-tenant project (Beta CRM) verification', () => {
    // In mockDb: proj_beta_crm has 1 task with status 'TODO'
    const analytics = ProjectService.getProjectAnalytics('proj_beta_crm', ownerB);

    assert.strictEqual(analytics.totalTasks, 1);
    assert.strictEqual(analytics.completedTasks, 0);
    assert.strictEqual(analytics.todoTasks, 1);
    assert.strictEqual(analytics.remainingTasks, 1);
    assert.strictEqual(analytics.completionPercentage, 0);
  });

  test('TC-SEED-06: Task status dictionary breakdown conforms to schema enum', () => {
    const db = getDb();
    const acmeTasks = db.tasks.filter((t) => t.projectId === 'proj_acme_web');
    const metrics = computeTaskMetrics(acmeTasks);

    assert.ok(metrics.tasksByStatus, 'tasksByStatus dictionary must exist');
    assert.strictEqual(metrics.tasksByStatus.TODO, 1);
    assert.strictEqual(metrics.tasksByStatus.IN_PROGRESS, 1);
    assert.strictEqual(metrics.tasksByStatus.IN_REVIEW, 1);
    assert.strictEqual(metrics.tasksByStatus.DONE, 1);
    assert.strictEqual(metrics.tasksByStatus.CANCELLED, 0);
  });
});
