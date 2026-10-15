# Qveto Backend Setup & API Guide

## Prerequisites

- Node.js (v18+) and npm
- PostgreSQL database
- Git

## 1. Install Dependencies

Open a terminal in the `backend` directory:

```bash
cd backend
npm install
```

## 2. Configure Environment Variables

Copy `.env.example` to `.env` or create `.env` inside `backend/`:

```env
PORT=5000
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/qveto_db?schema=public"
```

> **Note:** Never commit the real `.env` file to Git. It is automatically ignored in `.gitignore`.

## 3. Prepare Database with Prisma

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Seed synthetic demonstration data (Organization A & B, sample users, workspaces, projects, tasks):

```bash
npx tsx prisma/seed.ts
```

## 4. Run the Backend

```bash
node server.js
```
The server will run on `http://localhost:5000`.

## 5. Run Automated Tests

Run the built-in test suite (tests health check, error handling, validator, organization checks):

```bash
npm test
```

---

## 6. API Route Specification (Week 1 Core Routes)

All routes respond in JSON. All error responses strictly use the uniform format:
```json
{
  "error": "Descriptive error message"
}
```

### System Health
- **`GET /`** - Backend status and version info.
- **`GET /health`** - Database connection health check (executes `SELECT 1` via Prisma).

### Users
- **`GET /api/users`** - List users (optional queries: `?search=term`, `?organizationId=uuid`).
- **`GET /api/users/:id`** - Get user details with memberships.
- **`POST /api/users`** - Register a user.
  - Body: `{ "name": "Alice", "email": "alice@example.com", "organizationId": "...", "role": "EMPLOYEE" }`
  - Validations: `name` and `email` are required.

### Organizations
- **`GET /api/organizations`** - List organizations with count of memberships, projects, and tasks.
- **`GET /api/organizations/:id`** - Get organization details, workspaces, and team members.
- **`POST /api/organizations`** - Create organization.
  - Body: `{ "name": "Acme Corp", "ownerId": "user-uuid" }`
  - Validations: `name` is required.

### Projects (Organization-Scoped)
> **Requirement:** All project endpoints require the `x-organization-id` header to enforce multi-tenant isolation.
- **`GET /api/projects`** - List projects in the organization.
- **`GET /api/projects/:id`** - Get project by ID (ensures project belongs to current organization).
- **`POST /api/projects`** - Create project.
  - Headers: `x-organization-id: <org-id>`
  - Body: `{ "name": "Website Revamp", "description": "...", "workspaceId": "..." }`
- **`DELETE /api/projects/:id`** - Delete project.

### Tasks (Organization-Scoped)
> **Requirement:** All task endpoints require the `x-organization-id` header.
- **`GET /api/tasks`** - List tasks (optional queries: `?projectId=...`, `?status=TODO`, `?assigneeId=...`).
- **`GET /api/tasks/:id`** - Get task details.
- **`POST /api/tasks`** - Create a task.
  - Headers: `x-organization-id: <org-id>`
  - Body:
    ```json
    {
      "title": "Design Database Schema",
      "projectId": "<project-id>",
      "status": "TODO",
      "dueDate": "2026-11-01T00:00:00.000Z"
    }
    ```
  - Allowed statuses: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`.
- **`PATCH /api/tasks/:id`** - Update task status, title, description, assignee, or due date.
- **`DELETE /api/tasks/:id`** - Delete task.

---

## 7. Multi-Tenant Security & Isolation
- **Tenant Scoping:** Organization-scoped middleware rejects requests lacking `x-organization-id`.
- **RBAC Foundation:** Role checking middleware is provided for OWNER, MANAGER, and EMPLOYEE access controls.
