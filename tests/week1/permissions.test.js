const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const ProjectService = require('../../backend/src/projects/project.service');
const { resetDb } = require('../../backend/src/data/mockDb');

describe('Week 1 - Role Permissions Foundation', () => {
  beforeEach(() => {
    resetDb();
  });

  const owner = { id: 'user_owner_1', orgId: 'org_acme_corp', role: 'OWNER' };
  const employee = { id: 'user_employee_1', orgId: 'org_acme_corp', role: 'EMPLOYEE' };

  test('TC-PERM-01: Owner can create new projects', () => {
    const project = ProjectService.createProject({ name: 'Architecture Review' }, owner);
    assert.strictEqual(project.name, 'Architecture Review');
    assert.strictEqual(project.orgId, 'org_acme_corp');
  });

  test('TC-PERM-02: Employee cannot create projects (403 Forbidden)', () => {
    assert.throws(
      () => {
        ProjectService.createProject({ name: 'Unauthorized Project' }, employee);
      },
      (err) => err.status === 403
    );
  });
});
