/**
 * mockDb.js
 * In-memory relational data store for Qveto SaaS testing and demo.
 * Fully supports multi-tenant isolation, role checks, projects, tasks, subtasks, and labels.
 */

function createInitialState() {
  return {
    organizations: [
      { id: 'org_acme_corp', name: 'Acme Corporation', slug: 'acme-corp', createdAt: '2026-10-01T09:00:00Z' },
      { id: 'org_beta_tech', name: 'Beta Technologies', slug: 'beta-tech', createdAt: '2026-10-01T09:00:00Z' }
    ],
    memberships: [
      { id: 'mem_1', orgId: 'org_acme_corp', userId: 'user_owner_1', role: 'OWNER' },
      { id: 'mem_2', orgId: 'org_acme_corp', userId: 'user_manager_1', role: 'MANAGER' },
      { id: 'mem_3', orgId: 'org_acme_corp', userId: 'user_employee_1', role: 'EMPLOYEE' },
      { id: 'mem_4', orgId: 'org_acme_corp', userId: 'user_employee_2', role: 'EMPLOYEE' },
      { id: 'mem_5', orgId: 'org_beta_tech', userId: 'user_external_owner', role: 'OWNER' },
      { id: 'mem_6', orgId: 'org_beta_tech', userId: 'user_external_emp', role: 'EMPLOYEE' }
    ],
    users: [
      { id: 'user_owner_1', name: 'Alice Owner', email: 'alice@acme.com', orgId: 'org_acme_corp', role: 'OWNER' },
      { id: 'user_manager_1', name: 'Bob Manager', email: 'bob@acme.com', orgId: 'org_acme_corp', role: 'MANAGER' },
      { id: 'user_employee_1', name: 'Charlie Dev', email: 'charlie@acme.com', orgId: 'org_acme_corp', role: 'EMPLOYEE' },
      { id: 'user_employee_2', name: 'David QA', email: 'david@acme.com', orgId: 'org_acme_corp', role: 'EMPLOYEE' },
      { id: 'user_external_owner', name: 'Eve Beta Owner', email: 'eve@beta.com', orgId: 'org_beta_tech', role: 'OWNER' },
      { id: 'user_external_emp', name: 'Frank Beta Dev', email: 'frank@beta.com', orgId: 'org_beta_tech', role: 'EMPLOYEE' }
    ],
    projects: [
      {
        id: 'proj_acme_web',
        orgId: 'org_acme_corp',
        name: 'Acme SaaS Web App',
        description: 'Core web portal and collaboration engine',
        status: 'ACTIVE',
        createdById: 'user_owner_1',
        members: ['user_owner_1', 'user_manager_1', 'user_employee_1', 'user_employee_2'],
        createdAt: '2026-10-02T10:00:00Z',
        updatedAt: '2026-10-02T10:00:00Z'
      },
      {
        id: 'proj_acme_mobile',
        orgId: 'org_acme_corp',
        name: 'Acme Mobile App',
        description: 'iOS and Android client development',
        status: 'ACTIVE',
        createdById: 'user_manager_1',
        members: ['user_owner_1', 'user_manager_1'],
        createdAt: '2026-10-05T10:00:00Z',
        updatedAt: '2026-10-05T10:00:00Z'
      },
      {
        id: 'proj_beta_crm',
        orgId: 'org_beta_tech',
        name: 'Beta CRM Platform',
        description: 'Customer relations system for Beta Tech',
        status: 'ACTIVE',
        createdById: 'user_external_owner',
        members: ['user_external_owner', 'user_external_emp'],
        createdAt: '2026-10-03T11:00:00Z',
        updatedAt: '2026-10-03T11:00:00Z'
      }
    ],
    tasks: [
      {
        id: 'task_1',
        orgId: 'org_acme_corp',
        projectId: 'proj_acme_web',
        title: 'Design database schema and migrations',
        description: 'Define relational entities for users, projects, tasks, and audit logs',
        status: 'DONE',
        priority: 'HIGH',
        orderIndex: 0,
        assigneeId: 'user_employee_1',
        createdById: 'user_manager_1',
        dueDate: '2026-10-10T18:00:00Z',
        labels: ['database', 'architecture'],
        subtasks: [
          { id: 'sub_1', title: 'Draft ER diagram', isCompleted: true },
          { id: 'sub_2', title: 'Write SQL migration script', isCompleted: true }
        ],
        createdAt: '2026-10-03T09:00:00Z',
        completedAt: '2026-10-09T16:30:00Z'
      },
      {
        id: 'task_2',
        orgId: 'org_acme_corp',
        projectId: 'proj_acme_web',
        title: 'Build Kanban Board drag-and-drop UI',
        description: 'Interactive columns with accessible keyboard fallback',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        orderIndex: 0,
        assigneeId: 'user_employee_1',
        createdById: 'user_manager_1',
        dueDate: '2026-10-25T18:00:00Z',
        labels: ['frontend', 'ui/ux'],
        subtasks: [
          { id: 'sub_3', title: 'Setup column containers', isCompleted: true },
          { id: 'sub_4', title: 'Implement HTML5 drag & drop handlers', isCompleted: false },
          { id: 'sub_5', title: 'Add keyboard navigation & status selector', isCompleted: true }
        ],
        createdAt: '2026-10-04T10:00:00Z',
        completedAt: null
      },
      {
        id: 'task_3',
        orgId: 'org_acme_corp',
        projectId: 'proj_acme_web',
        title: 'Implement Task Filtering and Search',
        description: 'Enable searching by keyword, status, priority, and assigned team member',
        status: 'TODO',
        priority: 'MEDIUM',
        orderIndex: 0,
        assigneeId: 'user_employee_2',
        createdById: 'user_owner_1',
        dueDate: '2026-10-28T18:00:00Z',
        labels: ['backend', 'api'],
        subtasks: [
          { id: 'sub_6', title: 'Write search index query', isCompleted: false },
          { id: 'sub_7', title: 'Unit test filter parameters', isCompleted: false }
        ],
        createdAt: '2026-10-05T11:00:00Z',
        completedAt: null
      },
      {
        id: 'task_4',
        orgId: 'org_acme_corp',
        projectId: 'proj_acme_web',
        title: 'Setup automated security and boundary tests',
        description: 'Verify cross-tenant data isolation and role permissions',
        status: 'REVIEW',
        priority: 'HIGH',
        orderIndex: 0,
        assigneeId: 'user_employee_2',
        createdById: 'user_manager_1',
        dueDate: '2026-10-20T18:00:00Z',
        labels: ['qa', 'security'],
        subtasks: [],
        createdAt: '2026-10-06T12:00:00Z',
        completedAt: null
      },
      {
        id: 'task_beta_1',
        orgId: 'org_beta_tech',
        projectId: 'proj_beta_crm',
        title: 'Beta Tech Lead Pipeline Integration',
        description: 'Private CRM pipeline strictly confined to Beta Technologies',
        status: 'TODO',
        priority: 'HIGH',
        orderIndex: 0,
        assigneeId: 'user_external_emp',
        createdById: 'user_external_owner',
        dueDate: '2026-11-01T18:00:00Z',
        labels: ['confidential'],
        subtasks: [],
        createdAt: '2026-10-04T14:00:00Z',
        completedAt: null
      }
    ],
    auditLogs: []
  };
}

let db = createInitialState();

module.exports = {
  getDb: () => db,
  resetDb: () => {
    db = createInitialState();
    return db;
  }
};
