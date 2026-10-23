const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const ProjectService = require('../../backend/src/projects/project.service');
const { resetDb } = require('../../backend/src/data/mockDb');

describe('Week 2 - Day 1: Project Management & Role Access Testing', () => {
  beforeEach(() => {
    resetDb();
  });

  const owner = { id: 'user_owner_1', orgId: 'org_acme_corp', role: 'OWNER' };
  const manager = { id: 'user_manager_1', orgId: 'org_acme_corp', role: 'MANAGER' };
  const employeeMember = { id: 'user_employee_1', orgId: 'org_acme_corp', role: 'EMPLOYEE' };
  const employeeNonMember = { id: 'user_employee_2', orgId: 'org_acme_corp', role: 'EMPLOYEE' };
  const externalUser = { id: 'user_external_owner', orgId: 'org_beta_tech', role: 'OWNER' };

  test('TC-PROJ-01: Owner can successfully create a new project', () => {
    const project = ProjectService.createProject({
      name: 'Q4 Customer Portal',
      description: 'Customer facing support portal'
    }, owner);

    assert.ok(project.id, 'Project ID should be generated');
    assert.strictEqual(project.name, 'Q4 Customer Portal');
    assert.strictEqual(project.orgId, 'org_acme_corp');
    assert.strictEqual(project.status, 'ACTIVE');
    assert.ok(project.members.includes(owner.id), 'Creator should be an automatic member');
  });

  test('TC-PROJ-02: Manager can successfully create a new project', () => {
    const project = ProjectService.createProject({
      name: 'Sprint Analytics Dashboard',
      description: 'Internal metrics visualizer'
    }, manager);

    assert.ok(project.id);
    assert.strictEqual(project.name, 'Sprint Analytics Dashboard');
    assert.strictEqual(project.createdById, manager.id);
  });

  test('TC-PROJ-03: Employee is forbidden from creating a project (403)', () => {
    assert.throws(
      () => {
        ProjectService.createProject({
          name: 'Unauthorized Rogue Project'
        }, employeeMember);
      },
      (err) => {
        assert.strictEqual(err.status, 403);
        assert.match(err.message, /employees cannot create projects/i);
        return true;
      }
    );
  });

  test('TC-PROJ-04: Owner and Manager can update project details', () => {
    const updated = ProjectService.updateProject('proj_acme_web', {
      name: 'Acme SaaS Web App v2',
      description: 'Updated sprint scope',
      status: 'ACTIVE'
    }, owner);

    assert.strictEqual(updated.name, 'Acme SaaS Web App v2');
    assert.strictEqual(updated.description, 'Updated sprint scope');
  });

  test('TC-PROJ-05: Employee is forbidden from updating project details (403)', () => {
    assert.throws(
      () => {
        ProjectService.updateProject('proj_acme_web', {
          name: 'Hacked Project Name'
        }, employeeMember);
      },
      (err) => {
        assert.strictEqual(err.status, 403);
        return true;
      }
    );
  });

  test('TC-PROJ-06: Employee can open and view project where they are a member', () => {
    const project = ProjectService.getProjectById('proj_acme_web', employeeMember);
    assert.ok(project);
    assert.strictEqual(project.id, 'proj_acme_web');
  });

  test('TC-PROJ-07: Employee cannot open project where they are NOT a member (403)', () => {
    // proj_acme_mobile only has owner and manager as members
    assert.throws(
      () => {
        ProjectService.getProjectById('proj_acme_mobile', employeeNonMember);
      },
      (err) => {
        assert.strictEqual(err.status, 403);
        return true;
      }
    );
  });

  test('TC-PROJ-08: Cross-tenant project access is rejected with 404 (Data Isolation)', () => {
    // Owner of Acme Corp tries to access Beta Tech's project 'proj_beta_crm'
    assert.throws(
      () => {
        ProjectService.getProjectById('proj_beta_crm', owner);
      },
      (err) => {
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });

  test('TC-PROJ-09: Duplicate project name within same organization is rejected (400)', () => {
    assert.throws(
      () => {
        ProjectService.createProject({
          name: 'Acme SaaS Web App' // already exists
        }, owner);
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.match(err.message, /already exists/i);
        return true;
      }
    );
  });
});
