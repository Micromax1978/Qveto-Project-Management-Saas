# Week 2 Report: API Integration, Kanban Board & Filters

**Member:** Member 4 (Backend APIs, Integration and Deployment)  
**Branch:** `Integration-Deployment`  
**Repository:** `Qveto-Project-Management-Saas`  
**Status:** Completed and Verified  

---

## 1. Executive Summary

During Week 2, Member 4 completed the backend API integration for project and task workflows, delivered real-time Kanban board status transitions, implemented multi-criteria search and filters (by text, status, assignee, priority, due date, and label), standardized all error responses to `{ error: message }`, and built an interactive frontend dashboard connecting Member 3's UI to live database data.

All automated integration test suites run successfully (16 passed out of 16 tests).

---

## 2. Daily Achievements & Deliverables

| Day | Task | Deliverable | Status |
|---|---|---|---|
| **Day 1** | Write request/response examples in `docs/api.md` and share with Members 1, 2, 3 | Published comprehensive `docs/api.md` covering all project, task, Kanban, search, and error formats | Completed |
| **Day 2** | Make project routes return what Member 3's screens need | Enriched `GET /api/projects` and `GET /api/projects/:id` with task progress, completion metrics, and added `PATCH /api/projects/:id` | Completed |
| **Day 3** | Same for tasks, including status updates from the Kanban board | Enhanced `taskController.js`, added dedicated `PATCH /api/tasks/:id/status` endpoint, and Kanban column grouping (`view=kanban`) | Completed |
| **Day 4** | Search by text; filter by status, assignee, priority, due date, label | Added multi-field query filters: `search`, `status` (single or multi-comma), `priority`, `assigneeId`, `due` (preset ranges), `label` | Completed |
| **Day 5** | Clear messages for invalid data, failed requests, and 401/403 | Unified error handling across all middleware and routes to guarantee `{ error: message }` format | Completed |
| **Day 6** | Test full flow: create project, create task, move task, filter | Created `backend/tests/integration.test.js` covering the full end-to-end lifecycle and tenant isolation | Completed |
| **Day 7** | Weekly report and pull request preparation | Finalized documentation, checked frontend compilation, and prepared clean commits | Completed |

---

## 3. Key Technical Implementations

### 3.1 Project Routes (`/api/projects`)
- `GET /api/projects`: Returns projects with calculated `taskCount`, `completedTaskCount`, `progress` percentage, `tasksByStatus` breakdown (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`), and team members. Supports `search`, `workspaceId`, `sortBy`, `sortOrder`.
- `GET /api/projects/:id`: Returns project details with attached tasks, assignee information, and aggregate metrics.
- `POST /api/projects`: Creates a project with workspace association validation.
- `PATCH /api/projects/:id`: Allows updating project name, description, and workspace.
- `DELETE /api/projects/:id`: Scoped deletion within the organization.

### 3.2 Task Routes & Kanban Support (`/api/tasks`)
- `GET /api/tasks`: Supports multi-criteria filtering:
  - Text search: substring match against `title` and `description`.
  - Status: single (`TODO`) or comma-separated (`TODO,IN_PROGRESS`), case/alias normalized.
  - Priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT` (accepts `Normal`).
  - Assignee: user UUID or `unassigned`.
  - Due Date: quick presets (`today`, `tomorrow`, `this_week`, `overdue`) or date ranges (`dueDateFrom` / `dueDateTo`).
  - Label: category/tag filter.
  - Kanban View (`?view=kanban`): Pre-groups tasks into `todo`, `inProgress`, `inReview`, and `done` columns with item counts.
- `PATCH /api/tasks/:id/status`: Fast dedicated endpoint for Kanban drag-and-drop operations.
- `POST /api/tasks`: Validates project scoping, assignee existence, enum status/priority, and ISO date format.

### 3.3 Frontend Dashboard & Screen Connection
- Connected `DashboardPage.jsx` (`/dashboard`, `/projects`, `/tasks`) to real backend endpoints.
- Real-time card movement across Kanban columns (`TO DO` -> `IN PROGRESS` -> `IN REVIEW` -> `DONE`).
- Dynamic search and filter pills in the UI.
- Modal dialogs for creating projects and tasks.
- Prominent error banner displaying 400/401/403/404 messages to users.

---

## 4. Test Results

Executed via `npm test` in `backend/`:
```text
✔ 404 Handler returns uniform error format
✔ POST /api/users returns 400 when required fields are missing
✔ POST /api/organizations returns 400 when name is missing
✔ GET /api/projects rejects request when organization header is missing
✔ POST /api/tasks rejects invalid status enum
✔ All API errors strictly follow { error: message } format
✔ POST /api/auth/signup rejects request when required fields are missing
✔ POST /api/auth/login rejects request when password is missing
✔ GET /api/health returns OK status
✔ GET / returns 200 and server running info
✔ GET /health checks database connection and returns standard format
✔ Full Flow: Create Project -> Create Task -> Move Task (Kanban) -> Filter & Search
✔ Kanban View: GET /api/tasks?view=kanban groups cards by status columns
✔ Multi-Criteria Search & Filter Options
✔ Validation & Error Responses: 400 Bad Request
✔ Tenant Isolation & 404 Handlers

Total tests: 16 passed, 0 failed
```

---

## 5. Team Coordination Notes

- **Member 1 (Database):** Added `priority` and `label` to `Task` model in `schema.prisma` and database table.
- **Member 2 (Auth/Security):** Aligned error responses in `auth.middleware.js`, `organization.middleware.js`, and `role.middleware.js` to strictly adhere to the `{ error: message }` standard.
- **Member 3 (Frontend):** Connected screens to real data via `api.js` client and integrated interactive Kanban board with live search and filters.
- **Member 5 (Testing & Docs):** Provided repeatable end-to-end integration tests in `backend/tests/integration.test.js`.
