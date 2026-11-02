const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { computeTaskMetrics } = require('../../backend/services/analyticsService');
const ProjectService = require('../../backend/src/projects/project.service');
const { resetDb } = require('../../backend/src/data/mockDb');

describe('Week 4 - Day 5: Analytics Calculations & Progress Edge Cases Testing', () => {
  beforeEach(() => {
    resetDb();
  });

  const ownerA = { id: 'user_owner_1', orgId: 'org_acme_corp', role: 'OWNER' };
  const ownerB = { id: 'user_external_owner', orgId: 'org_beta_tech', role: 'OWNER' };

  test('TC-EDGE-01: Empty project with zero tasks returns 0% without NaN or Infinity', () => {
    const emptyTasks = [];
    const metrics = computeTaskMetrics(emptyTasks);

    assert.strictEqual(metrics.totalTasks, 0);
    assert.strictEqual(metrics.completedTasks, 0);
    assert.strictEqual(metrics.remainingTasks, 0);
    assert.strictEqual(metrics.cancelledTasks, 0);
    assert.strictEqual(metrics.eligibleTasks, 0);
    assert.strictEqual(metrics.completionPercentage, 0);
    assert.strictEqual(metrics.progress, 0);
    assert.ok(!Number.isNaN(metrics.completionPercentage), 'Must not be NaN');
    assert.ok(Number.isFinite(metrics.completionPercentage), 'Must be finite');
  });

  test('TC-EDGE-02: Project containing only cancelled tasks returns 0% (division by zero avoided)', () => {
    const cancelledOnlyTasks = [
      { id: 't1', status: 'CANCELLED' },
      { id: 't2', status: 'CANCELLED' },
      { id: 't3', status: 'CANCELLED' }
    ];
    const metrics = computeTaskMetrics(cancelledOnlyTasks);

    assert.strictEqual(metrics.totalTasks, 3);
    assert.strictEqual(metrics.cancelledTasks, 3);
    assert.strictEqual(metrics.eligibleTasks, 0);
    assert.strictEqual(metrics.completedTasks, 0);
    assert.strictEqual(metrics.remainingTasks, 0);
    assert.strictEqual(metrics.completionPercentage, 0, 'Progress must be 0% when eligible tasks <= 0');
    assert.ok(!Number.isNaN(metrics.completionPercentage), 'Must avoid NaN');
    assert.ok(Number.isFinite(metrics.completionPercentage), 'Must avoid Infinity');
  });

  test('TC-EDGE-03: Project containing only completed tasks returns exactly 100%', () => {
    const completedTasks = [
      { id: 't1', status: 'DONE' },
      { id: 't2', status: 'DONE' },
      { id: 't3', status: 'DONE' }
    ];
    const metrics = computeTaskMetrics(completedTasks);

    assert.strictEqual(metrics.totalTasks, 3);
    assert.strictEqual(metrics.completedTasks, 3);
    assert.strictEqual(metrics.remainingTasks, 0);
    assert.strictEqual(metrics.completionPercentage, 100);
    assert.strictEqual(metrics.progress, 100);
  });

  test('TC-EDGE-04: Project containing only unfinished tasks returns 0%', () => {
    const unfinishedTasks = [
      { id: 't1', status: 'TODO' },
      { id: 't2', status: 'IN_PROGRESS' },
      { id: 't3', status: 'IN_REVIEW' }
    ];
    const metrics = computeTaskMetrics(unfinishedTasks);

    assert.strictEqual(metrics.totalTasks, 3);
    assert.strictEqual(metrics.completedTasks, 0);
    assert.strictEqual(metrics.remainingTasks, 3);
    assert.strictEqual(metrics.todoTasks, 1);
    assert.strictEqual(metrics.inProgressTasks, 1);
    assert.strictEqual(metrics.inReviewTasks, 1);
    assert.strictEqual(metrics.completionPercentage, 0);
  });

  test('TC-EDGE-05: Project containing a mixture of task statuses computes rounded percentage correctly', () => {
    // 10 tasks total:
    // 3 DONE
    // 2 IN_PROGRESS
    // 2 IN_REVIEW
    // 1 TODO
    // 2 CANCELLED
    // Eligible = 10 - 2 = 8
    // Progress = (3 / 8) * 100 = 37.5 -> rounded to 38%
    const mixedTasks = [
      { id: 't1', status: 'DONE' },
      { id: 't2', status: 'DONE' },
      { id: 't3', status: 'DONE' },
      { id: 't4', status: 'IN_PROGRESS' },
      { id: 't5', status: 'IN_PROGRESS' },
      { id: 't6', status: 'IN_REVIEW' },
      { id: 't7', status: 'IN_REVIEW' },
      { id: 't8', status: 'TODO' },
      { id: 't9', status: 'CANCELLED' },
      { id: 't10', status: 'CANCELLED' }
    ];
    const metrics = computeTaskMetrics(mixedTasks);

    assert.strictEqual(metrics.totalTasks, 10);
    assert.strictEqual(metrics.completedTasks, 3);
    assert.strictEqual(metrics.inProgressTasks, 2);
    assert.strictEqual(metrics.inReviewTasks, 2);
    assert.strictEqual(metrics.todoTasks, 1);
    assert.strictEqual(metrics.cancelledTasks, 2);
    assert.strictEqual(metrics.remainingTasks, 5); // 2 + 2 + 1 = 5
    assert.strictEqual(metrics.eligibleTasks, 8); // 10 - 2 = 8
    assert.strictEqual(metrics.completionPercentage, 38, '3/8 * 100 = 37.5% -> round to 38%');
    assert.strictEqual(metrics.progress, 38);
    assert.ok(metrics.progress >= 0 && metrics.progress <= 100, 'Progress must be between 0 and 100');
  });

  test('TC-EDGE-06: Cancelled tasks are strictly excluded from the progress denominator', () => {
    // Project with 4 DONE tasks and 4 CANCELLED tasks:
    // If cancelled tasks were included in denominator: 4 / 8 = 50% (Incorrect)
    // Formula requirement: 4 / (8 - 4) = 4 / 4 = 100% (Correct)
    const tasks = [
      { id: 't1', status: 'DONE' },
      { id: 't2', status: 'DONE' },
      { id: 't3', status: 'DONE' },
      { id: 't4', status: 'DONE' },
      { id: 't5', status: 'CANCELLED' },
      { id: 't6', status: 'CANCELLED' },
      { id: 't7', status: 'CANCELLED' },
      { id: 't8', status: 'CANCELLED' }
    ];
    const metrics = computeTaskMetrics(tasks);

    assert.strictEqual(metrics.totalTasks, 8);
    assert.strictEqual(metrics.completedTasks, 4);
    assert.strictEqual(metrics.cancelledTasks, 4);
    assert.strictEqual(metrics.eligibleTasks, 4);
    assert.strictEqual(metrics.remainingTasks, 0);
    assert.strictEqual(metrics.completionPercentage, 100, 'All eligible tasks are done, progress must be 100%');
  });

  test('TC-EDGE-07: Missing or invalid project ID is rejected with 400 Bad Request', () => {
    // Empty string project ID
    assert.throws(
      () => {
        ProjectService.getProjectAnalytics('', ownerA);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /Project ID is required/i);
        return true;
      }
    );

    // Whitespace project ID
    assert.throws(
      () => {
        ProjectService.getProjectAnalytics('   ', ownerA);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /Project ID is required/i);
        return true;
      }
    );

    // Non-existent project ID
    assert.throws(
      () => {
        ProjectService.getProjectAnalytics('non_existent_project_999', ownerA);
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        assert.match(err.message, /Project not found/i);
        return true;
      }
    );
  });

  test('TC-EDGE-08: Organization isolation - user cannot access another organization analytics', () => {
    // proj_beta_crm belongs to org_beta_tech
    // ownerA belongs to org_acme_corp
    assert.throws(
      () => {
        ProjectService.getProjectAnalytics('proj_beta_crm', ownerA);
      },
      (err) => {
        // Multi-tenant isolation: Cross-tenant lookup returns 404 to avoid leaking project existence
        assert.strictEqual(err.status, 404);
        assert.match(err.message, /Project not found/i);
        return true;
      }
    );
  });
});
