# Week 3 Consolidated Report: Activity History, Notifications & Overdue Engine

**Project:** Qveto Technologies — Project Management and Team Collaboration SaaS  
**Milestone:** Week 3 Complete Integration  
**Lead Branch:** `Integration-Deployment` (Member 4 - Backend APIs, Integration and Deployment)  
**Collaborating Branches:** `Backend-Tasks` (Member 2), `Frontend-Ui` (Member 3), `Database-Analytics` (Member 1), `Testing-Docs` (Member 5)  
**Status:** Completed, Verified, and Pushed  

---

## 1. Executive Summary

During Week 3, the backend APIs, integration, activity tracking, notifications, and overdue detection systems were successfully built, tested, and integrated on the `Integration-Deployment` branch. The system records an immutable audit history of all task actions, dispatches real-time notification records across key team collaboration triggers, runs an overdue task detection engine under the agreed UTC standard, prevents duplicate notification spam, guarantees tenant and user isolation across all endpoints, honestly simulates email dispatching, and integrates live notifications into the frontend application header.

All 22 automated integration test suites passed with 100% success rate (`22 passed, 0 failed`).

---

## 2. Daily Achievements & Deliverables

| Day | Milestone | Implementation & Deliverables | Commit Message | Status |
|---|---|---|---|---|
| **Day 1** | **Activity History** | Added `Activity` and `TaskComment` models in `schema.prisma`. Implemented `activityService.js` and `activityController.js`. Hooked activity logging into task creation, assignment, status change, comments, updates, and deletion. Mounted `/api/activities` and `/api/tasks/:id/comments`. | `feat: activity history` | Completed |
| **Day 2** | **Notification Records** | Added `Notification` model with read/unread tracking. Created `notificationService.js` to dispatch events (`TASK_ASSIGNED`, `COMMENT_ADDED`, `DUE_DATE_CHANGED`, `TASK_STATUS_CHANGED`). | `feat: notification records` | Completed |
| **Day 3** | **Overdue Detection** | Built `overdueService.js` under the agreed **UTC standard timezone rule**. Created `GET /api/tasks/overdue` and `POST /api/tasks/check-overdue` endpoints. Calculates `overdueDays` and alerts assignees. | `feat: overdue detection` | Completed |
| **Day 4** | **Duplicate Prevention** | Implemented daily deduplication keys (`overdue:{taskId}:{dateKey}`) and unread state checks. Repeated executions on the same day suppress duplicate notifications and protect users from alert fatigue. | `feat: no duplicate notifications` | Completed |
| **Day 5** | **Notification Endpoints & Isolation** | Built `notificationController.js` and `notificationRoutes.js` (`GET /api/notifications`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /mark-all-read`). Strictly isolates user notifications within organizations. | `feat: notification endpoints` | Completed |
| **Day 6** | **Simulated Email Limits & Docs** | Created `emailService.js` capturing dispatches to an in-memory outbox (`GET /api/notifications/simulated-emails`). Published honest documentation in `docs/notification-limits.md`. | `docs: notification limits` | Completed |
| **Day 7** | **Integration Tests & Report** | Created comprehensive test suite in `backend/tests/week3.test.js`, connected `AppHeader.jsx` to live notification endpoints, published reports, and updated `docs/api.md`. | `docs: week 3 report and integration tests` | Completed |

---

## 3. Key Technical Implementations

### 3.1 Activity History Stream (`/api/activities`)
- **Table / Model:** `Activity` with fields `id`, `organizationId`, `projectId`, `taskId`, `userId`, `action`, `details`, `createdAt`.
- **Supported Actions:**
  - `TASK_CREATED`: Logged when a task is created.
  - `TASK_ASSIGNED`: Logged when a task is assigned or reassigned.
  - `TASK_STATUS_CHANGED`: Logged on status transitions (including Kanban moves).
  - `COMMENT_ADDED`: Logged when a comment is posted.
  - `TASK_UPDATED`: Logged when title, description, priority, or due date changes.
  - `TASK_DELETED`: Logged when a task is deleted.
- **Endpoints:** `GET /api/activities` and `GET /api/tasks/:id/activities`.

### 3.2 Notification Service (`/api/notifications`)
- **Table / Model:** `Notification` with fields `id`, `organizationId`, `userId`, `taskId`, `type`, `title`, `message`, `read`, `dedupKey`, `createdAt`, `readAt`.
- **Notification Types:** `TASK_ASSIGNED`, `COMMENT_ADDED`, `DUE_DATE_CHANGED`, `TASK_OVERDUE`, `TASK_STATUS_CHANGED`.
- **Actor Suppression:** Actors never receive self-notifications for their own updates.
- **Endpoints:**
  - `GET /api/notifications` (filtered by read status and type)
  - `GET /api/notifications/unread-count` (lightweight badge counter)
  - `PATCH /api/notifications/:id/read` (single read update)
  - `PATCH /api/notifications/mark-all-read` (bulk mark all as read)
  - `DELETE /api/notifications/:id` (delete notification)

### 3.3 Overdue Detection Engine (`/api/tasks/overdue`)
- **Agreed Timezone Rule:** Strict **UTC (Coordinated Universal Time)**.
- **Overdue Condition:** `dueDate < nowUTC` AND status NOT IN (`DONE`, `CANCELLED`).
- **Endpoints:**
  - `GET /api/tasks/overdue`: Returns all past-due tasks with calculated `overdueDays`.
  - `POST /api/tasks/check-overdue`: Triggers overdue scan and dispatches `TASK_OVERDUE` notifications.

### 3.4 Duplicate Prevention Architecture
- **Deduplication Scheme:** `overdue:{taskId}:{dateKey}` (where `dateKey` is `YYYY-MM-DD` in UTC).
- **Unread Guard:** Existing unread alerts suppress duplicates.
- **Database Uniqueness:** `@@unique([organizationId, userId, dedupKey])`.

### 3.5 Simulated Email System (`emailService.js`)
- All transactional emails are written to an in-memory test outbox (`simulatedOutbox`) and logged with `[SIMULATED EMAIL]` prefixes.
- Honestly documented in `docs/notification-limits.md`.
- Inspectable at `GET /api/notifications/simulated-emails`.

### 3.6 Frontend Integration (`AppHeader.jsx` & `api.js`)
- Replaced static placeholder dropdown with live API call `fetchNotifications()`.
- Interactive unread badge and card click handlers to mark notifications read.
- "Mark all read" bulk action.

---

## 4. Test Results

Executed via `npm test` (`node --test`):

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
✔ Day 1: Activity history is recorded on task creation, assignment, status change, and comments
✔ Day 2: Notification records created for assignment, comments, and due date changes with read/unread
✔ Day 3: Overdue detection follows UTC rule and flags past-due tasks
✔ Day 4: Duplicate notifications are prevented on repeated checks
✔ Day 5: Notification endpoints allow listing, mark read, mark all read with strict user isolation
✔ Day 6: Email is honestly documented and verified as SIMULATED

Total tests: 22 passed, 0 failed
```

---

## 5. Definition of Done Checklist

- [x] **Important events are recorded:** Creation, assignment, status changes, comments, updates, and deletion.
- [x] **Notifications are created and can be marked read:** Event-driven notification generation with read/unread flags and mark-all-read endpoint.
- [x] **Overdue follows the agreed rule:** UTC timestamp comparisons evaluated against non-completed tasks.
- [x] **Duplicates are controlled:** Daily deduplication key suppression active.
- [x] **Email status is honestly documented:** Documented as simulated in `docs/notification-limits.md`.
- [x] **Pushed and checked on GitHub:** Commits pushed to remote branch `Integration-Deployment`.
