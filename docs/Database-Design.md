Database Design — Qveto Project 2

1. Purpose

This database will store the organizations, users, workspaces, teams, projects, and tasks used by the Project Management & Team Collaboration SaaS.

2. Proposed Database

PostgreSQL is the proposed database. Confirm the choice with the team before creating database migrations.

3. Tables

organizations — stores organizations using the application.

users — stores user account details.

memberships — connects users to organizations and stores their roles.

workspaces — stores workspaces belonging to organizations.

teams — stores teams belonging to organizations.

projects — stores projects and their organization/workspace relationships.

project_members — connects users to projects.

tasks — stores task details, status, priority, assignee, and due date.

subtasks — stores smaller tasks under parent tasks.

labels — stores task labels.

task_labels — connects tasks to labels.

4. Main Relationships

An organization can have multiple users through memberships.

An organization can have multiple workspaces, teams, and projects.

A project can have multiple tasks.

A project can have multiple members.

A task can have multiple subtasks.

Tasks can have multiple labels.

5. Data Integrity and Security

Use primary keys to identify records.

Use foreign keys to connect related records.

Use unique constraints where required.

Include created_at and updated_at timestamps where appropriate.

Keep organization ownership relationships consistent.

Backend authorization must prevent access to another organization's data.

Use fictional sample data only.

Never upload database passwords or real secrets.

6. Initial Deliverables

Table and relationship design.

ER diagram.

Database migrations.

Synthetic sample data for at least two organizations.

Database setup instructions.

Basic schema and relationship tests.

7. Decisions to Confirm

Final database technology.

Migration method used by the backend.

User roles and membership rules.

Required project and task fields.
