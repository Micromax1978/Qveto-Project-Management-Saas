-- Qveto SaaS: Synthetic Demonstration Data
-- Multi-tenant isolation test dataset for Acme Corp & Beta Tech

INSERT INTO organizations (id, name, slug) VALUES 
('org_acme_corp', 'Acme Corporation', 'acme-corp'),
('org_beta_tech', 'Beta Technologies', 'beta-tech')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, org_id, email, name, password_hash, role) VALUES
('user_owner_1', 'org_acme_corp', 'alice@acme.com', 'Alice Owner', '$2b$10$syntheticHashAlice123', 'OWNER'),
('user_manager_1', 'org_acme_corp', 'bob@acme.com', 'Bob Manager', '$2b$10$syntheticHashBob123', 'MANAGER'),
('user_employee_1', 'org_acme_corp', 'charlie@acme.com', 'Charlie Dev', '$2b$10$syntheticHashCharlie123', 'EMPLOYEE'),
('user_employee_2', 'org_acme_corp', 'david@acme.com', 'David QA', '$2b$10$syntheticHashDavid123', 'EMPLOYEE'),
('user_external_owner', 'org_beta_tech', 'eve@beta.com', 'Eve Beta Owner', '$2b$10$syntheticHashEve123', 'OWNER'),
('user_external_emp', 'org_beta_tech', 'frank@beta.com', 'Frank Beta Dev', '$2b$10$syntheticHashFrank123', 'EMPLOYEE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, org_id, name, description, status, created_by_id) VALUES
('proj_acme_web', 'org_acme_corp', 'Acme SaaS Web App', 'Core web portal and collaboration engine', 'ACTIVE', 'user_owner_1'),
('proj_acme_mobile', 'org_acme_corp', 'Acme Mobile App', 'iOS and Android client development', 'ACTIVE', 'user_manager_1'),
('proj_beta_crm', 'org_beta_tech', 'Beta CRM Platform', 'Customer relations system for Beta Tech', 'ACTIVE', 'user_external_owner')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, org_id, project_id, title, description, status, priority, order_index, assignee_id, created_by_id, due_date, completed_at) VALUES
('task_1', 'org_acme_corp', 'proj_acme_web', 'Design database schema and migrations', 'Define relational entities', 'DONE', 'HIGH', 0, 'user_employee_1', 'user_manager_1', '2026-10-10 18:00:00+00', '2026-10-09 16:30:00+00'),
('task_2', 'org_acme_corp', 'proj_acme_web', 'Build Kanban Board drag-and-drop UI', 'Interactive columns with accessibility fallback', 'IN_PROGRESS', 'URGENT', 0, 'user_employee_1', 'user_manager_1', '2026-10-25 18:00:00+00', NULL),
('task_3', 'org_acme_corp', 'proj_acme_web', 'Implement Task Filtering and Search', 'Search by keyword, status, priority, assignee', 'TODO', 'MEDIUM', 0, 'user_employee_2', 'user_owner_1', '2026-10-28 18:00:00+00', NULL),
('task_4', 'org_acme_corp', 'proj_acme_web', 'Setup automated security and boundary tests', 'Verify cross-tenant data isolation', 'REVIEW', 'HIGH', 0, 'user_employee_2', 'user_manager_1', '2026-10-20 18:00:00+00', NULL),
('task_beta_1', 'org_beta_tech', 'proj_beta_crm', 'Beta Tech Lead Pipeline Integration', 'Private CRM pipeline for Beta Tech', 'TODO', 'HIGH', 0, 'user_external_emp', 'user_external_owner', '2026-11-01 18:00:00+00', NULL)
ON CONFLICT (id) DO NOTHING;
