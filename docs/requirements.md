# Software Requirements Specification (SRS)
## Project Management & Team Collaboration SaaS

**Project:** Qveto Project Management & Team Collaboration SaaS  
**Status:** Initial draft; confirm with the project team.

## 1. Introduction
This document describes requirements for a SaaS application that helps organizations plan projects, manage tasks, collaborate, and track progress.

## 2. Objectives
- Organize work by organization, workspace, team, and project.
- Create, assign, prioritize, and track tasks.
- Support collaboration through comments, attachments, activity history, and notifications where implemented.
- Enforce role-based access and organization-level data isolation.
- Provide a maintainable and testable application.

## 3. Scope
### In scope
- User authentication and organization membership.
- Organization, workspace, team, and project management.
- Task creation, assignment, status, priority, and due dates.
- Subtasks, Kanban views, comments, attachments, notifications, activity history, and analytics where supported.
- Role-based permissions, data isolation, testing, documentation, and deployment preparation.

### Out of scope for the initial version
- Billing and subscription management.
- Third-party integrations unless approved separately.
- Advanced enterprise reporting unless approved separately.

## 4. User Roles
- **Owner:** Manages organization settings and membership and has the highest organization-level permissions.
- **Manager:** Manages projects and tasks within granted permissions.
- **Employee:** Views and updates assigned or otherwise permitted work.
- Confirm final permissions against the approved permission matrix.

## 5. Functional Requirements
- **FR-01 Authentication:** Users can sign in and access authorized resources.
- **FR-02 Organization:** Authorized users can view/manage organization details and membership.
- **FR-03 Workspace:** Authorized users can organize work into workspaces.
- **FR-04 Team:** Authorized users can manage teams as permitted.
- **FR-05 Project:** Authorized users can create, view, update, and manage projects.
- **FR-06 Task management:** Users with permission can create, view, update, assign, and track tasks.
- **FR-07 Task details:** Tasks may include descriptions, priority, status, due dates, and assignees.
- **FR-08 Subtasks:** Users can create and track subtasks where supported.
- **FR-09 Board view:** Tasks can be displayed and moved through workflow columns where supported.
- **FR-10 Collaboration:** Users can add comments and attachments where supported.
- **FR-11 Notifications/activity:** Users can receive notifications and view activity history where supported.
- **FR-12 Reporting:** Authorized users can view project progress or analytics where supported.
- **FR-13 Access control:** The backend verifies permissions for protected operations.
- **FR-14 Organization isolation:** Users cannot access another organization's data unless explicitly authorized.
- **FR-15 Persistence:** Valid changes are saved and remain available after reload/restart.

## 6. Non-Functional Requirements
- **NFR-01 Security:** Validate inputs and protect authentication/authorization boundaries.
- **NFR-02 Data isolation:** Scope organization-owned records and API queries to the authorized organization.
- **NFR-03 Reliability:** Invalid operations return clear errors and do not corrupt data.
- **NFR-04 Usability:** Common project/task actions are understandable and consistent.
- **NFR-05 Maintainability:** Keep code modular and document setup/configuration.
- **NFR-06 Data integrity:** Enforce required fields, foreign keys, and uniqueness rules where appropriate.
- **NFR-07 Testability:** Core features and access-control rules have repeatable tests.

## 7. Initial Data Requirements
Expected entities, subject to confirmation against the actual Prisma schema:
- User
- Organization
- Membership
- Workspace
- Team
- Project
- Task

Relationships and fields must match the approved ER diagram and database schema.

## 8. User Journeys
1. **Sign in:** User signs in and sees only organizations/projects they may access.
2. **Create project:** Authorized owner/manager creates a project in the correct organization/workspace.
3. **Create and assign task:** Authorized user creates a task and assigns it to an eligible member.
4. **Update task:** User changes task status and confirms it remains saved after reload.
5. **Collaborate:** Authorized member comments on a task or attaches a file if available.
6. **Cross-organization protection:** User attempts to access another organization's task/project; backend denies access without exposing data.

## 9. Testing Requirements
- Test authentication and authorization for protected endpoints.
- Test required fields, valid relationships, and database constraints.
- Test task creation, updates, assignment, and persistence.
- Test invalid IDs and unauthorized requests.
- Test cross-organization access denial.
- Test fresh database setup and repeatable seed behavior.
- Record actual results; do not mark tests passed before execution.

## 10. Assumptions and Constraints
- This is a team project using a shared repository.
- Schema, API behavior, and feature availability may change during development.
- Role rules and optional features must be confirmed by the team.
- This document describes intended requirements and does not claim every feature is implemented.

## 11. Acceptance Criteria
- Authorized users can perform project/task operations allowed by their roles.
- Unauthorized operations are rejected by the backend.
- Users cannot access another organization's projects/tasks without authorization.
- Database constraints prevent invalid records.
- Setup and testing instructions are documented.
- Test results and confirmed defects are recorded accurately.

## 12. Conclusion
This initial SRS provides a shared baseline for the Qveto Project Management & Team Collaboration SaaS. Review it against the project brief, ER diagram, Prisma schema, API implementation, and permission matrix before approval.
