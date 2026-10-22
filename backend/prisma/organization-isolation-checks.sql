-- Organization Isolation Validation Checks
-- Purpose: Identify records linked across organizations.
-- These are read-only validation queries.

-- Check 1: Tasks and projects must belong to the same organization.
SELECT
    'tasks_with_mismatched_organization' AS check_name,
    COUNT(*) AS issue_count
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE t.organization_id <> p.organization_id;

-- Check 2: Projects and workspaces must belong to the same organization.
SELECT
    'projects_with_mismatched_workspace' AS check_name,
    COUNT(*) AS issue_count
FROM projects p
JOIN workspaces w ON w.id = p.workspace_id
WHERE p.organization_id <> w.organization_id;

-- Check 3: Project members must belong to the project's organization.
SELECT
    'project_members_without_org_membership' AS check_name,
    COUNT(*) AS issue_count
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
LEFT JOIN memberships m
    ON m.user_id = pm.user_id
   AND m.organization_id = p.organization_id
WHERE m.id IS NULL;
