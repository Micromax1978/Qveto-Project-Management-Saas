/**
 * Role Definitions & Permission Utilities
 * Based on docs/permission-matrix.md
 *
 * Roles:
 * - OWNER: Organization root / Enterprise Administrator
 * - MANAGER: Project & Team Lead
 * - EMPLOYEE: Team Member
 *
 * NOTE: Frontend role checks are for UI experience (disabling actions, showing hints).
 * The backend API enforces true security boundaries.
 */

export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const ROLE_CONFIG = {
  OWNER: {
    id: 'OWNER',
    label: 'Organization Owner',
    badge: 'Enterprise Root',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Full workspace and organization management',
  },
  MANAGER: {
    id: 'MANAGER',
    label: 'Manager',
    badge: 'Project Lead',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Sprint planning and team orchestration',
  },
  EMPLOYEE: {
    id: 'EMPLOYEE',
    label: 'Employee',
    badge: 'Team Member',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Task execution & collaboration',
  },
};

/**
 * Permission checks based on docs/permission-matrix.md
 */
export const Permissions = {
  // Project Permissions
  canCreateProject: (role) => role === ROLES.OWNER || role === ROLES.MANAGER,
  canEditProject: (role) => role === ROLES.OWNER || role === ROLES.MANAGER,
  canDeleteProject: (role) => role === ROLES.OWNER,
  canViewAllOrgProjects: (role) => role === ROLES.OWNER || role === ROLES.MANAGER,
  canManageProjectMembers: (role) => role === ROLES.OWNER || role === ROLES.MANAGER,

  // Task Permissions
  canCreateTask: (role) => Boolean(role), // Any project member (Owner, Manager, Employee)
  canEditTask: (role) => Boolean(role),
  canDeleteTask: (role) => role === ROLES.OWNER || role === ROLES.MANAGER,
  canAssignTaskToOthers: (role) => role === ROLES.OWNER || role === ROLES.MANAGER,
  canMoveKanbanCard: (role) => Boolean(role),
  canManageSubtasks: (role) => Boolean(role),

  // Organization Permissions
  canEditOrgSettings: (role) => role === ROLES.OWNER,
  canInviteMembers: (role) => role === ROLES.OWNER || role === ROLES.MANAGER,
  canRemoveMembers: (role) => role === ROLES.OWNER,
};
