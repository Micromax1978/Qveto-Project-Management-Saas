# Qveto SaaS — REST API Specification & Integration Guide (Week 2)

**Version:** 2.0.0  
**Scope:** Project Management, Task Management, Kanban Board Integration, Full-text Search, and Multi-field Filters.  
**Audience:** Shared with Member 1 (Database & Schema), Member 2 (Auth & Security), Member 3 (Frontend & Kanban UI), and Member 5 (Testing & QA).

---

## 1. Overview & Standard Conventions

All Qveto backend endpoints follow RESTful standards and communicate exclusively via JSON.

### Base URL
```
http://localhost:5000/api
```

### Common Headers
| Header | Description | Required | Example |
|---|---|---|---|
| `Content-Type` | MIME type for JSON payloads | Yes (POST/PUT/PATCH) | `application/json` |
| `x-organization-id` | Multi-tenant organization UUID | Yes (for org-scoped routes) | `8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f` |
| `Authorization` | JWT Bearer token or development identity | Yes (for protected routes) | `Bearer eyJhbGciOiJIUzI1Ni...` |
| `x-user-id` | Direct user UUID (development fallback) | Optional | `d1234567-89ab-cdef-0123-456789abcdef` |

### Uniform Error Response Format
All errors return HTTP status codes >= 400 and adhere strictly to the uniform single-key error format:
```json
{
  "error": "Human-readable descriptive error explanation"
}
```

---

## 2. Project Endpoints (`/api/projects`)

### 2.1 List Projects
Returns all projects belonging to the active organization, enriched with workspace information, task counts, completion rate, and status breakdown for Member 3's project overview and dashboard cards.

- **Method & Route:** `GET /api/projects`
- **Headers:** `x-organization-id: <org-id>`, `Authorization: Bearer <token>`
- **Query Parameters:**
  - `search` *(optional)*: Search project name or description (case-insensitive)
  - `workspaceId` *(optional)*: Filter projects by workspace UUID
  - `sortBy` *(optional)*: `name` | `createdAt` | `updatedAt` (default: `createdAt`)
  - `sortOrder` *(optional)*: `asc` | `desc` (default: `desc`)

**Request Example:**
```http
GET /api/projects?search=website HTTP/1.1
Host: localhost:5000
x-organization-id: 8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f
Authorization: Bearer eyJhbGciOi...
```

**Response Example (200 OK):**
```json
{
  "count": 1,
  "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
  "projects": [
    {
      "id": "proj-101",
      "name": "Website Redesign & Launch",
      "description": "Comprehensive marketing overhaul and client portal rebuild.",
      "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
      "workspaceId": "ws-201",
      "workspace": {
        "id": "ws-201",
        "name": "Engineering Workspace"
      },
      "taskCount": 12,
      "completedTaskCount": 8,
      "progress": 67,
      "tasksByStatus": {
        "TODO": 2,
        "IN_PROGRESS": 1,
        "IN_REVIEW": 1,
        "DONE": 8,
        "CANCELLED": 0
      },
      "members": [
        { "id": "usr-1", "name": "Elena Chen", "email": "elena@example.com" },
        { "id": "usr-2", "name": "David Kim", "email": "david@example.com" }
      ],
      "createdAt": "2026-10-14T09:30:00.000Z",
      "updatedAt": "2026-10-18T14:22:00.000Z"
    }
  ]
}
```

---

### 2.2 Get Project by ID
Retrieves single project details including its full task roster, workspace, and velocity metrics.

- **Method & Route:** `GET /api/projects/:id`
- **Headers:** `x-organization-id: <org-id>`, `Authorization: Bearer <token>`

**Response Example (200 OK):**
```json
{
  "id": "proj-101",
  "name": "Website Redesign & Launch",
  "description": "Comprehensive marketing overhaul and client portal rebuild.",
  "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
  "workspaceId": "ws-201",
  "workspace": {
    "id": "ws-201",
    "name": "Engineering Workspace"
  },
  "metrics": {
    "totalTasks": 4,
    "completedTasks": 1,
    "inProgressTasks": 1,
    "todoTasks": 1,
    "inReviewTasks": 1,
    "progressPercentage": 25
  },
  "tasks": [
    {
      "id": "tsk-101",
      "title": "Design landing page wireframes",
      "description": "Create high-fidelity wireframes in Figma",
      "status": "TODO",
      "priority": "HIGH",
      "label": "Design",
      "dueDate": "2026-10-25T18:00:00.000Z",
      "assignee": {
        "id": "usr-1",
        "name": "Elena Chen",
        "email": "elena@example.com"
      }
    }
  ],
  "createdAt": "2026-10-14T09:30:00.000Z",
  "updatedAt": "2026-10-18T14:22:00.000Z"
}
```

---

### 2.3 Create Project
Creates a new project inside the authorized organization.

- **Method & Route:** `POST /api/projects`
- **Headers:** `x-organization-id: <org-id>`, `Content-Type: application/json`

**Request Body Example:**
```json
{
  "name": "Mobile Application v2",
  "description": "Cross-platform mobile app built with React Native",
  "workspaceId": "ws-201"
}
```

**Response Example (201 Created):**
```json
{
  "id": "proj-102",
  "name": "Mobile Application v2",
  "description": "Cross-platform mobile app built with React Native",
  "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
  "workspaceId": "ws-201",
  "workspace": {
    "id": "ws-201",
    "name": "Engineering Workspace"
  },
  "taskCount": 0,
  "completedTaskCount": 0,
  "progress": 0,
  "createdAt": "2026-10-21T14:00:00.000Z",
  "updatedAt": "2026-10-21T14:00:00.000Z"
}
```

---

### 2.4 Update Project
Updates project name, description, or assigned workspace.

- **Method & Route:** `PATCH /api/projects/:id`
- **Headers:** `x-organization-id: <org-id>`, `Content-Type: application/json`

**Request Body Example:**
```json
{
  "name": "Mobile Application v2.1 (Performance Sprint)",
  "description": "Targeting 60fps animations and offline sync."
}
```

**Response Example (200 OK):**
```json
{
  "id": "proj-102",
  "name": "Mobile Application v2.1 (Performance Sprint)",
  "description": "Targeting 60fps animations and offline sync.",
  "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
  "workspaceId": "ws-201",
  "updatedAt": "2026-10-21T14:05:00.000Z"
}
```

---

### 2.5 Delete Project
Deletes project and cascades task deletion safely within the tenant scope.

- **Method & Route:** `DELETE /api/projects/:id`
- **Headers:** `x-organization-id: <org-id>`

**Response Example (200 OK):**
```json
{
  "message": "Project deleted successfully"
}
```

---

## 3. Tasks & Kanban Board Endpoints (`/api/tasks`)

### 3.1 List Tasks with Search, Filters & Kanban View
Supports rich multi-criteria querying: full-text search, status, assignee, priority, due date range, and label/category.

- **Method & Route:** `GET /api/tasks`
- **Headers:** `x-organization-id: <org-id>`, `Authorization: Bearer <token>`
- **Query Filter Parameters:**
  - `search`: Searches across `title` and `description` (case-insensitive substring match)
  - `status`: Single (`TODO`) or comma-separated (`TODO,IN_PROGRESS`). Supports camelCase (`inProgress`) and uppercase (`IN_PROGRESS`).
  - `assigneeId`: User UUID, or `"unassigned"` for unallocated tasks
  - `priority`: `LOW` | `MEDIUM` | `HIGH` | `URGENT` (case-insensitive, accepts `Normal` as `MEDIUM`)
  - `due`: Quick date filters: `today`, `tomorrow`, `this_week`, `overdue`
  - `dueDateFrom`: ISO-8601 start date (e.g., `2026-10-01`)
  - `dueDateTo`: ISO-8601 end date (e.g., `2026-10-31`)
  - `label`: Label/category string filter (e.g., `Design`, `DevOps`, `Frontend`)
  - `projectId`: Scope to a specific project UUID
  - `view`: Set `view=kanban` to receive data pre-grouped into Kanban columns
  - `sortBy`: `createdAt` | `dueDate` | `title` | `priority` | `status` (default: `createdAt`)
  - `sortOrder`: `asc` | `desc` (default: `desc`)

**Request Example (Filtered Search):**
```http
GET /api/tasks?search=layout&status=TODO,IN_PROGRESS&priority=HIGH&label=Engineering HTTP/1.1
Host: localhost:5000
x-organization-id: 8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f
```

**Response Example (Standard List):**
```json
{
  "count": 1,
  "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
  "tasks": [
    {
      "id": "tsk-103",
      "title": "Build navigation and responsive layout",
      "description": "Ensure navigation works seamlessly on desktop and mobile screens.",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "label": "Engineering",
      "dueDate": "2026-10-22T17:00:00.000Z",
      "projectId": "proj-101",
      "project": {
        "id": "proj-101",
        "name": "Website Redesign & Launch"
      },
      "assigneeId": "usr-2",
      "assignee": {
        "id": "usr-2",
        "name": "David Kim",
        "email": "david@example.com",
        "initials": "DK"
      },
      "createdAt": "2026-10-18T10:00:00.000Z",
      "updatedAt": "2026-10-21T12:00:00.000Z"
    }
  ]
}
```

**Request Example (Kanban View Mode):**
```http
GET /api/tasks?view=kanban HTTP/1.1
Host: localhost:5000
x-organization-id: 8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f
```

**Response Example (Kanban Grouped View):**
```json
{
  "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
  "totalCount": 8,
  "columns": {
    "todo": {
      "key": "todo",
      "label": "TO DO",
      "count": 2,
      "tasks": [ ... ]
    },
    "inProgress": {
      "key": "inProgress",
      "label": "IN PROGRESS",
      "count": 3,
      "tasks": [ ... ]
    },
    "inReview": {
      "key": "inReview",
      "label": "IN REVIEW",
      "count": 1,
      "tasks": [ ... ]
    },
    "done": {
      "key": "done",
      "label": "DONE",
      "count": 2,
      "tasks": [ ... ]
    }
  }
}
```

---

### 3.2 Create Task
Creates a new task anchored to an existing project within the active organization.

- **Method & Route:** `POST /api/tasks`
- **Headers:** `x-organization-id: <org-id>`, `Content-Type: application/json`

**Request Body Schema:**
```json
{
  "title": "Build navigation bar and responsive menu",
  "description": "Mobile drawer menu and breadcrumb navigation",
  "projectId": "proj-101",
  "assigneeId": "usr-2",
  "status": "TODO",
  "priority": "HIGH",
  "label": "Engineering",
  "dueDate": "2026-10-28T18:00:00.000Z"
}
```
*Required fields:* `title`, `projectId`.  
*Optional fields:* `description`, `assigneeId`, `status` (default: `TODO`), `priority` (default: `MEDIUM`), `label`, `dueDate`.

**Response Example (201 Created):**
```json
{
  "id": "tsk-108",
  "title": "Build navigation bar and responsive menu",
  "description": "Mobile drawer menu and breadcrumb navigation",
  "organizationId": "8f2c3d4e-5b6a-7c8d-9e0f-1a2b3c4d5e6f",
  "projectId": "proj-101",
  "project": {
    "id": "proj-101",
    "name": "Website Redesign & Launch"
  },
  "assigneeId": "usr-2",
  "assignee": {
    "id": "usr-2",
    "name": "David Kim",
    "email": "david@example.com",
    "initials": "DK"
  },
  "status": "TODO",
  "priority": "HIGH",
  "label": "Engineering",
  "dueDate": "2026-10-28T18:00:00.000Z",
  "createdAt": "2026-10-21T14:15:00.000Z",
  "updatedAt": "2026-10-21T14:15:00.000Z"
}
```

---

### 3.3 Update Task
Updates any subset of task attributes.

- **Method & Route:** `PATCH /api/tasks/:id`
- **Headers:** `x-organization-id: <org-id>`, `Content-Type: application/json`

**Request Body Example:**
```json
{
  "title": "Refined title",
  "priority": "URGENT",
  "status": "IN_PROGRESS"
}
```

**Response Example (200 OK):**
```json
{
  "id": "tsk-108",
  "title": "Refined title",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "label": "Engineering",
  "dueDate": "2026-10-28T18:00:00.000Z",
  "updatedAt": "2026-10-21T14:20:00.000Z"
}
```

---

### 3.4 Move Task on Kanban Board (Dedicated Status Endpoint)
Lightweight endpoint specifically optimized for drag-and-drop operations on Member 3's Kanban board.

- **Method & Route:** `PATCH /api/tasks/:id/status`
- **Headers:** `x-organization-id: <org-id>`, `Content-Type: application/json`

**Request Body Example:**
```json
{
  "status": "IN_PROGRESS"
}
```
*Note:* The endpoint accepts both uppercase (`IN_PROGRESS`) and lowercase (`inProgress`, `in_progress`).

**Response Example (200 OK):**
```json
{
  "id": "tsk-108",
  "status": "IN_PROGRESS",
  "title": "Refined title",
  "updatedAt": "2026-10-21T14:22:00.000Z"
}
```

---

### 3.5 Delete Task
Deletes task from the database.

- **Method & Route:** `DELETE /api/tasks/:id`
- **Headers:** `x-organization-id: <org-id>`

**Response Example (200 OK):**
```json
{
  "message": "Task deleted successfully"
}
```

---

## 4. Error Responses Matrix

All errors follow the `{ "error": "message" }` format.

| Status | Condition | Example Response Body |
|---|---|---|
| `400 Bad Request` | Missing required fields | `{"error": "Missing required field(s): title, projectId"}` |
| `400 Bad Request` | Invalid enum status | `{"error": "Invalid value for 'status'. Allowed values: TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED"}` |
| `400 Bad Request` | Invalid date string | `{"error": "Invalid dueDate format. Please provide a valid ISO-8601 date string."}` |
| `400 Bad Request` | Assignee or project does not exist | `{"error": "Project with id 'xyz' does not exist in this organization."}` |
| `401 Unauthorized` | Missing authentication credentials | `{"error": "Authentication required. Please provide a valid Bearer token or credentials."}` |
| `401 Unauthorized` | Invalid or expired token | `{"error": "Invalid or expired authentication token"}` |
| `403 Forbidden` | User not in requested organization | `{"error": "Forbidden: You are not a member of this organization."}` |
| `403 Forbidden` | Insufficient role permissions | `{"error": "Forbidden: Requires one of the following roles: OWNER, MANAGER"}` |
| `404 Not Found` | Project not found in organization | `{"error": "Project not found with id: proj-999 in the current organization"}` |
| `404 Not Found` | Task not found in organization | `{"error": "Task not found with id: tsk-999 in the current organization"}` |
| `404 Not Found` | Unknown endpoint route | `{"error": "Route not found: GET /api/unknown"}` |
| `500 Server Error`| Unexpected server/database failure | `{"error": "Internal server error"}` |

---

## 5. Frontend Integration Notes for Member 3

1. **Authentication Token Storage:** Store your session token in `localStorage.getItem('token')` or `localStorage.getItem('user')` and pass `Authorization: Bearer <token>` along with `x-organization-id: <orgId>` in all `fetch` or `axios` calls.
2. **Kanban Status Normalization:** The Kanban columns map directly to:
   - `todo` -> `TODO`
   - `inProgress` -> `IN_PROGRESS`
   - `inReview` -> `IN_REVIEW`
   - `done` -> `DONE`
3. **Real-time Filter Combination:** All query parameters can be passed together, e.g.:
   ```javascript
   const query = new URLSearchParams({
     search: searchTerm,
     status: selectedStatus,
     priority: selectedPriority,
     label: selectedLabel,
     view: 'kanban'
   });
   fetch(`/api/tasks?${query}`, { headers });
   ```
