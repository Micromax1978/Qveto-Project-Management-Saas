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

describe('TASKORA Week 1 - Workspace, Team & Tenant Foundation Gap Completions', () => {
  const { ROLES, Permissions } = require('../../frontend/src/constants/roles');
  const { workspaceService } = require('../../frontend/src/services/workspaceService');
  const { teamService } = require('../../frontend/src/services/teamService');
  const { resetStorage, Storage } = require('../../frontend/src/services/storage');

  beforeEach(() => {
    global.localStorage.clear();
    resetStorage();
  });

  // ----------------------------------------------------
  // Workspace Management
  // ----------------------------------------------------
  describe('Workspace Management Service', () => {
    test('TC-WS-01: List initial organization workspaces', async () => {
      const workspaces = await workspaceService.getWorkspaces();
      assert.ok(Array.isArray(workspaces));
      assert.ok(workspaces.length >= 2);
      assert.ok(workspaces.some((w) => w.id === 'ws_eng'));
      assert.ok(workspaces.some((w) => w.id === 'ws_mkt'));
    });

    test('TC-WS-02: Active workspace switching persists across calls', async () => {
      await workspaceService.setActiveWorkspace('ws_mkt');
      const active = await workspaceService.getActiveWorkspace();
      assert.strictEqual(active.id, 'ws_mkt');
      assert.strictEqual(active.name, 'Growth & Marketing');
    });

    test('TC-WS-03: Switching to non-existent workspace throws error', async () => {
      await assert.rejects(
        async () => {
          await workspaceService.setActiveWorkspace('ws_invalid_999');
        },
        /not found/i
      );
    });

    test('TC-WS-04: Create workspace successfully and verify unique name enforcement', async () => {
      const newWs = await workspaceService.createWorkspace({
        name: 'DevOps & Infrastructure',
        description: 'Cloud systems and CI/CD pipelines',
      });
      assert.ok(newWs.id);
      assert.strictEqual(newWs.name, 'DevOps & Infrastructure');

      // Attempt duplicate name
      await assert.rejects(
        async () => {
          await workspaceService.createWorkspace({
            name: 'DevOps & Infrastructure',
          });
        },
        /already exists/i
      );
    });

    test('TC-WS-05: Update workspace attributes', async () => {
      const updated = await workspaceService.updateWorkspace('ws_eng', {
        name: 'Core Software Engineering',
      });
      assert.strictEqual(updated.name, 'Core Software Engineering');

      const workspaces = await workspaceService.getWorkspaces();
      const eng = workspaces.find((w) => w.id === 'ws_eng');
      assert.strictEqual(eng.name, 'Core Software Engineering');
    });

    test('TC-WS-06: Cannot delete default workspace', async () => {
      await assert.rejects(
        async () => {
          await workspaceService.deleteWorkspace('ws_eng');
        },
        /default/i
      );
    });
  });

  // ----------------------------------------------------
  // Team & Member Management
  // ----------------------------------------------------
  describe('Team & Member Management Service', () => {
    test('TC-TEAM-01: List initial departments and teams', async () => {
      const teams = await teamService.getTeams();
      assert.ok(Array.isArray(teams));
      assert.ok(teams.length >= 3);
      assert.ok(teams.some((t) => t.id === 'team_eng'));
    });

    test('TC-TEAM-02: Create new team with lead and member assignments', async () => {
      const newTeam = await teamService.createTeam({
        name: 'Security & Compliance',
        description: 'SOC2 and HIPAA auditing',
        leadId: 'user_manager_1',
        members: ['user_manager_1', 'user_employee_1'],
      });
      assert.ok(newTeam.id);
      assert.strictEqual(newTeam.name, 'Security & Compliance');
      assert.strictEqual(newTeam.members.length, 2);

      // Duplicate team name rejected
      await assert.rejects(
        async () => {
          await teamService.createTeam({ name: 'Security & Compliance' });
        },
        /already exists/i
      );
    });

    test('TC-TEAM-03: Add and remove members from existing team', async () => {
      await teamService.addMemberToTeam('team_qa', 'user_employee_1');
      let qaTeam = await teamService.getTeamById('team_qa');
      assert.ok(qaTeam.members.includes('user_employee_1'));

      await teamService.removeMemberFromTeam('team_qa', 'user_employee_1');
      qaTeam = await teamService.getTeamById('team_qa');
      assert.strictEqual(qaTeam.members.includes('user_employee_1'), false);
    });

    test('TC-TEAM-04: Invite new member generates token and adds user to organization', async () => {
      const result = await teamService.inviteMember({
        email: 'sarah.architect@acme.com',
        name: 'Sarah Architect',
        role: ROLES.MANAGER,
        teamId: 'team_eng',
      });

      assert.ok(result.user);
      assert.strictEqual(result.user.email, 'sarah.architect@acme.com');
      assert.strictEqual(result.user.role, 'MANAGER');
      assert.ok(result.invitationToken);
      assert.ok(result.invitationUrl.includes(result.invitationToken));

      // User is recorded in organization users
      const users = Storage.getUsers();
      assert.ok(users.some((u) => u.email === 'sarah.architect@acme.com'));

      // Added to team
      const engTeam = await teamService.getTeamById('team_eng');
      assert.ok(engTeam.members.includes(result.user.id));
    });

    test('TC-TEAM-05: Invite member with duplicate email is rejected', async () => {
      await assert.rejects(
        async () => {
          await teamService.inviteMember({
            email: 'alice@acme.com', // Already exists in INITIAL_USERS
            name: 'Alice Duplicate',
          });
        },
        /already registered/i
      );
    });

    test('TC-TEAM-06: Role modification is strictly restricted to OWNER', async () => {
      // Owner can promote Charlie Dev from EMPLOYEE to MANAGER
      const updated = await teamService.updateUserRole(
        'user_employee_1',
        ROLES.MANAGER,
        ROLES.OWNER
      );
      assert.strictEqual(updated.role, 'MANAGER');

      // Manager trying to update role throws 403 Forbidden
      await assert.rejects(
        async () => {
          await teamService.updateUserRole(
            'user_employee_2',
            ROLES.MANAGER,
            ROLES.MANAGER
          );
        },
        (err) => err.status === 403
      );
    });
  });

  // ----------------------------------------------------
  // RBAC Matrix & Multi-Tenant Data Isolation
  // ----------------------------------------------------
  describe('RBAC Matrix & Multi-Tenant Scoping', () => {
    test('TC-RBAC-01: Organization settings permissions', () => {
      assert.strictEqual(Permissions.canEditOrgSettings(ROLES.OWNER), true);
      assert.strictEqual(Permissions.canEditOrgSettings(ROLES.MANAGER), false);
      assert.strictEqual(Permissions.canEditOrgSettings(ROLES.EMPLOYEE), false);
    });

    test('TC-RBAC-02: Invitation permissions', () => {
      assert.strictEqual(Permissions.canInviteMembers(ROLES.OWNER), true);
      assert.strictEqual(Permissions.canInviteMembers(ROLES.MANAGER), true);
      assert.strictEqual(Permissions.canInviteMembers(ROLES.EMPLOYEE), false);
    });

    test('TC-RBAC-03: Member removal permissions', () => {
      assert.strictEqual(Permissions.canRemoveMembers(ROLES.OWNER), true);
      assert.strictEqual(Permissions.canRemoveMembers(ROLES.MANAGER), false);
      assert.strictEqual(Permissions.canRemoveMembers(ROLES.EMPLOYEE), false);
    });

    test('TC-RBAC-04: Multi-tenant scoping consistency', () => {
      const org = Storage.getOrganization();
      assert.ok(org.id);
      const teams = Storage.getTeams();
      teams.forEach((team) => {
        assert.strictEqual(team.orgId, org.id);
      });
      const users = Storage.getUsers();
      users.forEach((user) => {
        assert.strictEqual(user.orgId, org.id);
      });
    });
  });
});

