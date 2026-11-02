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

describe('TASKORA Week 4 - Analytics, Quality Assurance & Data Visualization', () => {
  const { analyticsService } = require('../../frontend/src/services/analyticsService.js');
  const { resetStorage, Storage } = require('../../frontend/src/services/storage.js');

  const refDate = new Date('2026-11-01T12:00:00Z');

  const sampleTasks = [
    {
      id: 'task_1',
      taskCode: 'TSK-1',
      title: 'Setup Database Schema',
      projectId: 'proj_1',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: 'user_dev_1',
      dueDate: '2026-10-20',
      completedAt: '2026-10-19T10:00:00Z', // On-time
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'task_2',
      taskCode: 'TSK-2',
      title: 'Build API Endpoints',
      projectId: 'proj_1',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: 'user_dev_1',
      dueDate: '2026-10-25',
      completedAt: '2026-10-28T15:00:00Z', // Late (completed after due date)
      createdAt: '2026-10-05T08:00:00Z',
    },
    {
      id: 'task_3',
      taskCode: 'TSK-3',
      title: 'Design Kanban Board',
      projectId: 'proj_1',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: 'user_dev_2',
      dueDate: '2026-10-26', // Overdue relative to 2026-11-01
      completedAt: null,
      createdAt: '2026-10-10T08:00:00Z',
    },
    {
      id: 'task_4',
      taskCode: 'TSK-4',
      title: 'Write Unit Tests',
      projectId: 'proj_2',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: 'user_dev_1',
      dueDate: '2026-11-01', // Due today relative to 2026-11-01
      completedAt: null,
      createdAt: '2026-10-15T08:00:00Z',
    },
    {
      id: 'task_5',
      taskCode: 'TSK-5',
      title: 'Prepare Staging Deployment',
      projectId: 'proj_2',
      status: 'IN_REVIEW',
      priority: 'LOW',
      assigneeId: null, // Unassigned
      dueDate: '2026-11-02', // Due tomorrow
      completedAt: null,
      createdAt: '2026-10-20T08:00:00Z',
    },
    {
      id: 'task_6',
      taskCode: 'TSK-6',
      title: 'Deprecated Task',
      projectId: 'proj_2',
      status: 'CANCELLED',
      priority: 'LOW',
      assigneeId: 'user_dev_2',
      dueDate: '2026-10-15',
      completedAt: null,
      createdAt: '2026-10-01T08:00:00Z',
    },
  ];

  const sampleProjects = [
    {
      id: 'proj_1',
      name: 'Cloud Core Platform',
      status: 'ACTIVE',
      members: ['user_owner_1', 'user_dev_1', 'user_dev_2'],
    },
    {
      id: 'proj_2',
      name: 'Mobile Client v1',
      status: 'ACTIVE',
      members: ['user_owner_1', 'user_dev_1'],
    },
  ];

  const sampleUsers = [
    { id: 'user_owner_1', name: 'Alice Owner', role: 'OWNER' },
    { id: 'user_dev_1', name: 'Charlie Dev', role: 'EMPLOYEE' },
    { id: 'user_dev_2', name: 'David QA', role: 'EMPLOYEE' },
  ];

  beforeEach(() => {
    global.localStorage.clear();
    resetStorage();
  });

  // ----------------------------------------------------
  // Module 1: Core Metrics Computations
  // ----------------------------------------------------
  describe('Module 1: Analytical Metrics Mathematical Engine', () => {
    test('TC-AN-01: Task Completion Rate divides completed by eligible tasks excluding CANCELLED', () => {
      // 2 DONE out of 5 eligible (task_6 is CANCELLED) -> 2/5 = 40%
      const metrics = analyticsService.calculateMetrics(sampleTasks, sampleProjects, refDate);
      assert.strictEqual(metrics.totalTasks, 6);
      assert.strictEqual(metrics.completedTasksCount, 2);
      assert.strictEqual(metrics.taskCompletionRate, 40);
    });

    test('TC-AN-02: Division by zero is prevented on empty datasets', () => {
      const metrics = analyticsService.calculateMetrics([], [], refDate);
      assert.strictEqual(metrics.totalTasks, 0);
      assert.strictEqual(metrics.taskCompletionRate, 0);
      assert.strictEqual(metrics.onTimeCompletionRate, 100);
      assert.strictEqual(metrics.overallProjectProgress, 0);
      assert.strictEqual(metrics.assignmentCoverage, 0);
      assert.strictEqual(metrics.overdueCount, 0);
    });

    test('TC-AN-03: On-Time Completion Rate calculates tasks completed on or before due date', () => {
      // 2 completed tasks: task_1 (done 2026-10-19 <= due 2026-10-20, on time), task_2 (done 2026-10-28 > due 2026-10-25, late)
      // 1 on-time out of 2 completed with due dates = 50%
      const metrics = analyticsService.calculateMetrics(sampleTasks, sampleProjects, refDate);
      assert.strictEqual(metrics.onTimeCompletionRate, 50);
    });

    test('TC-AN-04: Overdue Task Count identifies open tasks past due date with DONE immunity', () => {
      // task_3 (IN_PROGRESS, due 2026-10-26 < 2026-11-01) -> Overdue
      // task_1 and task_2 are DONE, so never overdue
      // task_6 is CANCELLED, so never overdue
      const metrics = analyticsService.calculateMetrics(sampleTasks, sampleProjects, refDate);
      assert.strictEqual(metrics.overdueCount, 1);
    });

    test('TC-AN-05: Assignment Coverage computes percentage of active tasks with an assigned owner', () => {
      // Active tasks (excluding CANCELLED): task_1, task_2, task_3, task_4, task_5 (5 tasks)
      // Assigned: task_1 (dev1), task_2 (dev1), task_3 (dev2), task_4 (dev1) = 4 tasks
      // 4 / 5 = 80%
      const metrics = analyticsService.calculateMetrics(sampleTasks, sampleProjects, refDate);
      assert.strictEqual(metrics.assignmentCoverage, 80);
    });

    test('TC-AN-06: Project Progress computes non-archived completed tasks ratio', () => {
      // 2 completed / 6 non-archived = 33%
      const metrics = analyticsService.calculateMetrics(sampleTasks, sampleProjects, refDate);
      assert.strictEqual(metrics.overallProjectProgress, 33);
    });
  });

  // ----------------------------------------------------
  // Module 2: Visualizations & Distributions
  // ----------------------------------------------------
  describe('Module 2: Visual Distribution Data Transformations', () => {
    test('TC-AN-07: Status distribution maps exact categories, colors, and percentages', () => {
      const dist = analyticsService.getStatusDistribution(sampleTasks);
      assert.strictEqual(dist.total, 6);
      assert.strictEqual(dist.counts.TODO, 1);
      assert.strictEqual(dist.counts.IN_PROGRESS, 1);
      assert.strictEqual(dist.counts.IN_REVIEW, 1);
      assert.strictEqual(dist.counts.DONE, 2);

      const doneCat = dist.categories.find((c) => c.key === 'DONE');
      assert.strictEqual(doneCat.percentage, 33); // 2/6 = 33%
    });

    test('TC-AN-08: Project progress calculation maps individual milestone health', () => {
      const projProgress = analyticsService.getProjectProgress(sampleProjects, sampleTasks, refDate);
      assert.strictEqual(projProgress.length, 2);

      // proj_1: task_1 (DONE), task_2 (DONE), task_3 (IN_PROGRESS) -> 2/3 = 67%
      const p1 = projProgress.find((p) => p.id === 'proj_1');
      assert.strictEqual(p1.totalTasks, 3);
      assert.strictEqual(p1.completedTasks, 2);
      assert.strictEqual(p1.progress, 67);
      assert.strictEqual(p1.overdueTasks, 1);

      // proj_2: task_4 (TODO), task_5 (IN_REVIEW), task_6 (CANCELLED) -> 0 completed -> 0%
      const p2 = projProgress.find((p) => p.id === 'proj_2');
      assert.strictEqual(p2.completedTasks, 0);
      assert.strictEqual(p2.progress, 0);
    });

    test('TC-AN-09: Team workload groups tasks by member with overdue flags', () => {
      const workload = analyticsService.getTeamWorkload(sampleUsers, sampleTasks, refDate);
      assert.strictEqual(workload.length, 3);

      // user_dev_1 has task_1 (DONE), task_2 (DONE), task_4 (TODO) -> 3 tasks, 2 completed, 0 overdue
      const dev1 = workload.find((w) => w.user.id === 'user_dev_1');
      assert.strictEqual(dev1.totalTasks, 3);
      assert.strictEqual(dev1.completedTasks, 2);
      assert.strictEqual(dev1.overdueTasks, 0);
      assert.strictEqual(dev1.completionRate, 67);

      // user_dev_2 has task_3 (overdue), task_6 (CANCELLED) -> 2 tasks, 1 overdue
      const dev2 = workload.find((w) => w.user.id === 'user_dev_2');
      assert.strictEqual(dev2.totalTasks, 2);
      assert.strictEqual(dev2.overdueTasks, 1);
    });

    test('TC-AN-10: Deadline horizon identifies Due Today, Tomorrow, and Next 7 Days', () => {
      const deadlines = analyticsService.getOverdueAndDeadlines(
        sampleTasks,
        sampleProjects,
        sampleUsers,
        refDate
      );

      // task_4 is due 2026-11-01 (same as refDate) -> Due Today
      assert.strictEqual(deadlines.dueTodayTasks.length, 1);
      assert.strictEqual(deadlines.dueTodayTasks[0].task.id, 'task_4');

      // task_5 is due 2026-11-02 (1 day after refDate) -> Due Tomorrow
      assert.strictEqual(deadlines.dueTomorrowTasks.length, 1);
      assert.strictEqual(deadlines.dueTomorrowTasks[0].task.id, 'task_5');

      // Overdue by project breakdown
      assert.strictEqual(deadlines.overdueByProject.length, 1);
      assert.strictEqual(deadlines.overdueByProject[0].name, 'Cloud Core Platform');
      assert.strictEqual(deadlines.overdueByProject[0].count, 1);
    });
  });

  // ----------------------------------------------------
  // Module 3: Role-Aware Scoping & Dynamic Filters
  // ----------------------------------------------------
  describe('Module 3: Role-Aware Scoping & Filtering Controls', () => {
    test('TC-AN-11: Employee is restricted to their assigned tasks only', () => {
      const employeeUser = { id: 'user_dev_1', role: 'EMPLOYEE', orgId: 'org_acme' };
      const { filteredTasks } = analyticsService.filterData(
        sampleTasks,
        sampleProjects,
        {},
        employeeUser
      );

      // Charlie Dev should only see tasks assigned to him (task_1, task_2, task_4)
      assert.strictEqual(filteredTasks.length, 3);
      filteredTasks.forEach((t) => {
        assert.strictEqual(t.assigneeId, 'user_dev_1');
      });
    });

    test('TC-AN-12: Owner sees all organizational tasks across all members', () => {
      const ownerUser = { id: 'user_owner_1', role: 'OWNER', orgId: 'org_acme' };
      const { filteredTasks } = analyticsService.filterData(
        sampleTasks,
        sampleProjects,
        {},
        ownerUser
      );

      assert.strictEqual(filteredTasks.length, 6);
    });

    test('TC-AN-13: Project filter restricts analytics to a specific project', () => {
      const ownerUser = { id: 'user_owner_1', role: 'OWNER', orgId: 'org_acme' };
      const { filteredTasks } = analyticsService.filterData(
        sampleTasks,
        sampleProjects,
        { projectId: 'proj_1' },
        ownerUser
      );

      assert.strictEqual(filteredTasks.length, 3);
      filteredTasks.forEach((t) => {
        assert.strictEqual(t.projectId, 'proj_1');
      });
    });

    test('TC-AN-14: Status filter restricts analytics to matching status', () => {
      const { filteredTasks } = analyticsService.filterData(
        sampleTasks,
        sampleProjects,
        { status: 'DONE' },
        null
      );

      assert.strictEqual(filteredTasks.length, 2);
      filteredTasks.forEach((t) => {
        assert.strictEqual(t.status, 'DONE');
      });
    });
  });

  // ----------------------------------------------------
  // Module 4: Report Export Engine
  // ----------------------------------------------------
  describe('Module 4: Analytics Report Generation & CSV Formatting', () => {
    test('TC-AN-15: Generates valid CSV report with summary metrics and task rows', () => {
      const metrics = analyticsService.calculateMetrics(sampleTasks, sampleProjects, refDate);
      const csv = analyticsService.generateCSVReport(metrics, sampleTasks, sampleProjects);

      assert.ok(csv.includes('# TASKORA ANALYTICS & PRODUCTIVITY REPORT'));
      assert.ok(csv.includes('Completion Rate: 40%'));
      assert.ok(csv.includes('Task ID,Title,Project,Status,Priority'));
      assert.ok(csv.includes('TSK-1'));
      assert.ok(csv.includes('Setup Database Schema'));
      assert.ok(csv.includes('Cloud Core Platform'));
    });
  });
});
