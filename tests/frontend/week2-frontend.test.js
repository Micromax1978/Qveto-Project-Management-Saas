const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// In node environment, localStorage mock
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

describe('TASKORA Week 2 - Frontend Logic & Architecture Tests', () => {
  // Test 1: Role Permissions Matrix
  describe('Role-Aware UI Permissions (docs/permission-matrix.md)', () => {
    const { ROLES, Permissions } = require('../../frontend/src/constants/roles');

    test('TC-FE-PERM-01: Owner has full management permissions', () => {
      assert.strictEqual(Permissions.canCreateProject(ROLES.OWNER), true);
      assert.strictEqual(Permissions.canEditProject(ROLES.OWNER), true);
      assert.strictEqual(Permissions.canDeleteProject(ROLES.OWNER), true);
      assert.strictEqual(Permissions.canDeleteTask(ROLES.OWNER), true);
      assert.strictEqual(Permissions.canAssignTaskToOthers(ROLES.OWNER), true);
    });

    test('TC-FE-PERM-02: Manager can create/edit projects & tasks, but cannot delete projects', () => {
      assert.strictEqual(Permissions.canCreateProject(ROLES.MANAGER), true);
      assert.strictEqual(Permissions.canEditProject(ROLES.MANAGER), true);
      assert.strictEqual(Permissions.canDeleteProject(ROLES.MANAGER), false);
      assert.strictEqual(Permissions.canDeleteTask(ROLES.MANAGER), true);
      assert.strictEqual(Permissions.canAssignTaskToOthers(ROLES.MANAGER), true);
    });

    test('TC-FE-PERM-03: Employee cannot create projects or delete tasks', () => {
      assert.strictEqual(Permissions.canCreateProject(ROLES.EMPLOYEE), false);
      assert.strictEqual(Permissions.canEditProject(ROLES.EMPLOYEE), false);
      assert.strictEqual(Permissions.canDeleteProject(ROLES.EMPLOYEE), false);
      assert.strictEqual(Permissions.canDeleteTask(ROLES.EMPLOYEE), false);
      assert.strictEqual(Permissions.canAssignTaskToOthers(ROLES.EMPLOYEE), false);
      assert.strictEqual(Permissions.canCreateTask(ROLES.EMPLOYEE), true);
      assert.strictEqual(Permissions.canMoveKanbanCard(ROLES.EMPLOYEE), true);
      assert.strictEqual(Permissions.canManageSubtasks(ROLES.EMPLOYEE), true);
    });
  });

  // Test 2: Status & Priority Centralization
  describe('Centralized Constants Consistency', () => {
    const {
      TASK_STATUSES,
      TASK_STATUS_LIST,
      TASK_PRIORITIES,
      TASK_PRIORITY_LIST,
    } = require('../../frontend/src/constants/status');

    test('TC-FE-CONST-01: All 4 Kanban columns are defined in correct workflow sequence', () => {
      const columnIds = TASK_STATUS_LIST.map((c) => c.id);
      assert.deepStrictEqual(columnIds, ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
    });

    test('TC-FE-CONST-02: Priorities defined with correct ordering', () => {
      assert.strictEqual(TASK_PRIORITIES.LOW.order, 1);
      assert.strictEqual(TASK_PRIORITIES.MEDIUM.order, 2);
      assert.strictEqual(TASK_PRIORITIES.HIGH.order, 3);
      assert.strictEqual(TASK_PRIORITIES.URGENT.order, 4);
    });
  });

  // Test 3: Subtask Progress Calculation
  describe('Subtask Progress Percentage Calculation', () => {
    const { calculateSubtaskProgress } = require('../../frontend/src/services/taskService');

    test('TC-FE-SUB-01: Returns 0 for null, empty or non-array input avoiding division by zero', () => {
      assert.strictEqual(calculateSubtaskProgress(null), 0);
      assert.strictEqual(calculateSubtaskProgress([]), 0);
      assert.strictEqual(calculateSubtaskProgress(undefined), 0);
    });

    test('TC-FE-SUB-02: Computes correct rounded percentage for completed subtasks', () => {
      const subtasks = [
        { id: '1', title: 'A', isCompleted: true },
        { id: '2', title: 'B', isCompleted: false },
        { id: '3', title: 'C', isCompleted: true },
      ];
      // 2 / 3 = 66.666% -> 67%
      assert.strictEqual(calculateSubtaskProgress(subtasks), 67);
    });

    test('TC-FE-SUB-03: Returns 100% when all subtasks completed', () => {
      const subtasks = [
        { id: '1', title: 'A', isCompleted: true },
        { id: '2', title: 'B', isCompleted: true },
      ];
      assert.strictEqual(calculateSubtaskProgress(subtasks), 100);
    });
  });

  // Test 4: Frontend Project Service
  describe('Project Service Layer & Data Isolation', () => {
    const { projectService } = require('../../frontend/src/services/projectService');
    const { resetStorage } = require('../../frontend/src/services/storage');

    beforeEach(() => {
      resetStorage();
    });

    const manager = { id: 'user_manager_1', orgId: 'org_acme_corp', role: 'MANAGER' };
    const employee1 = { id: 'user_employee_1', orgId: 'org_acme_corp', role: 'EMPLOYEE' };
    const employee2 = { id: 'user_employee_2', orgId: 'org_acme_corp', role: 'EMPLOYEE' };

    test('TC-FE-PROJ-01: Manager can list all organization projects', async () => {
      const list = await projectService.listProjects(manager);
      assert.ok(list.length >= 2);
      list.forEach((p) => assert.strictEqual(p.orgId, 'org_acme_corp'));
    });

    test('TC-FE-PROJ-02: Employee only lists projects where they are assigned as members', async () => {
      const listEmp2 = await projectService.listProjects(employee2);
      // employee2 is only in proj_acme_web in mockDb
      assert.ok(listEmp2.every((p) => p.members.includes(employee2.id)));
    });

    test('TC-FE-PROJ-03: Manager can create a new project successfully', async () => {
      const newProj = await projectService.createProject(
        {
          name: 'Sprint 42 Automation Engine',
          description: 'Automated CI/CD webhook triage',
        },
        manager
      );
      assert.ok(newProj.id);
      assert.strictEqual(newProj.name, 'Sprint 42 Automation Engine');
      assert.strictEqual(newProj.createdById, manager.id);
    });

    test('TC-FE-PROJ-04: Employee is rejected when attempting to create a project (403)', async () => {
      await assert.rejects(
        async () => {
          await projectService.createProject(
            { name: 'Unauthorized Employee Project' },
            employee1
          );
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          assert.match(err.message, /employees cannot create projects/i);
          return true;
        }
      );
    });

    test('TC-FE-PROJ-05: Duplicate project name within org is rejected (400)', async () => {
      await assert.rejects(
        async () => {
          await projectService.createProject(
            { name: 'Acme SaaS Web App' }, // already exists
            manager
          );
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          assert.match(err.message, /already exists/i);
          return true;
        }
      );
    });
  });

  // Test 5: Frontend Task Service CRUD & Kanban transitions
  describe('Task Service Layer, CRUD & Kanban Transitions', () => {
    const { taskService } = require('../../frontend/src/services/taskService');
    const { resetStorage } = require('../../frontend/src/services/storage');

    beforeEach(() => {
      resetStorage();
    });

    const manager = { id: 'user_manager_1', orgId: 'org_acme_corp', role: 'MANAGER' };

    test('TC-FE-TASK-01: Create task with assignment, priority, and subtasks', async () => {
      const task = await taskService.createTask(
        {
          projectId: 'proj_acme_web',
          title: 'Implement Dark Mode Theme Tokens',
          description: 'Add CSS variables for slate-950 dark palettes',
          priority: 'HIGH',
          status: 'TODO',
          assigneeId: 'user_employee_1',
          dueDate: '2026-11-05',
          labels: ['frontend', 'ui/ux'],
          subtasks: [
            { title: 'Define HSL tokens', isCompleted: true },
            { title: 'Update Tailwind config', isCompleted: false },
          ],
        },
        manager
      );

      assert.ok(task.id);
      assert.strictEqual(task.title, 'Implement Dark Mode Theme Tokens');
      assert.strictEqual(task.status, 'TODO');
      assert.strictEqual(task.priority, 'HIGH');
      assert.strictEqual(task.subtaskProgress, 50);
      assert.strictEqual(task.labels.length, 2);
    });

    test('TC-FE-TASK-02: Status transition updates task status and manages completedAt', async () => {
      const updated = await taskService.updateStatus('task_2', 'DONE', manager);
      assert.strictEqual(updated.status, 'DONE');
      assert.ok(updated.completedAt);

      // Transition back clears completion
      const reverted = await taskService.updateStatus('task_2', 'IN_PROGRESS', manager);
      assert.strictEqual(reverted.status, 'IN_PROGRESS');
      assert.strictEqual(reverted.completedAt, null);
    });

    test('TC-FE-TASK-03: Subtask toggle updates completion and progress percentage', async () => {
      const task = await taskService.toggleSubtask('task_2', 'sub_4', manager);
      const sub4 = task.subtasks.find((s) => s.id === 'sub_4');
      assert.strictEqual(sub4.isCompleted, true);
      // Now sub_3, sub_4, sub_5 are all completed (3/3 = 100%)
      assert.strictEqual(task.subtaskProgress, 100);
    });

    test('TC-FE-TASK-04: Multi-criteria filtering works cohesively', async () => {
      const tasks = await taskService.listTasks(
        'proj_acme_web',
        {
          priority: 'URGENT',
          status: 'IN_PROGRESS',
        },
        manager
      );

      assert.ok(tasks.length >= 1);
      assert.strictEqual(tasks[0].priority, 'URGENT');
      assert.strictEqual(tasks[0].status, 'IN_PROGRESS');
    });

    test('TC-FE-TASK-05: Non-existent task returns 404', async () => {
      await assert.rejects(
        async () => {
          await taskService.getTaskById('task_non_existent', manager);
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          return true;
        }
      );
    });
  });
});
