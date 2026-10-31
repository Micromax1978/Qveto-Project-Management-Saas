# Week 3 Report: Activity History, Notifications & Overdue Engine

**Member:** Member 4 (Backend APIs, Integration and Deployment)  
**Branch:** `member-4-backend-deploy`  
**Repository:** `Qveto-Project-Management-Saas`  
**Status:** Completed and Verified  

---

## 1. Executive Summary

During Week 3, Member 4 engineered and delivered the core event tracking and notification subsystem for the Qveto SaaS platform. The system records audit history for all critical task actions, dispatches contextual notifications (assignments, status updates, task comments, and due date adjustments), implements an overdue detection engine operating strictly under UTC date rules, prevents duplicate notifications across repetitive checks, isolates user notifications within organizations, and documents simulated email delivery transparently.

All 22 automated integration test suites passed with 100% success rate (`22 pass, 0 fail`).

---

## 2. Daily Achievements & Deliverables

| Day | Task | Deliverable | Status | Commit Message |
|---|---|---|---|---|
| **Day 1** | Add an activity table. Record: task created, assigned, status changed, comment added. | Added `Activity` and `TaskComment` models in `schema.prisma`, created `activityService.js`, `activityController.js`, hooked lifecycle hooks into `taskController.js`, and added `/api/activities` and `/api/tasks/:id/comments`. | Completed | `feat: activity history` |
| **Day 2** | Create notification records for events (assigned to you, comment on your task, due date changed). Add read/unread. | Created `Notification` model, built `notificationService.js`, wired notification triggers for assignment, comments, and due date changes with `read: false`. | Completed | `feat: notification records` |
| **Day 3** | Overdue detection. Agree date and timezone rule with Member 2 (UTC). | Established UTC standard rule, built `overdueService.js`, added `GET /api/tasks/overdue` and `POST /api/tasks/check-overdue` endpoints. | Completed | `feat: overdue detection` |
| **Day 4** | Do not create the same notification again and again. | Implemented daily deduplication keys (`overdue:{taskId}:{dateKey}`) and unread collision checks, preventing spam on repeated checks. | Completed | `feat: no duplicate notifications` |
| **Day 5** | Users see only their own notifications in their organization. Make endpoints for notification screen. | Built `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/mark-all-read`, enforcing strict tenant and user isolation. | Completed | `feat: notification endpoints` |
| **Day 6** | Email is optional. If not really sending, write clearly that it is SIMULATED. Test and document. | Created `emailService.js` with simulated in-memory outbox and console auditing. Published comprehensive `docs/notification-limits.md`. | Completed | `docs: notification limits` |
| **Day 7** | Weekly report and pull request preparation. | Created `docs/week-3-report-member-4.md`, updated `docs/api.md`, connected frontend `AppHeader.jsx` to live notification API, verified builds and tests. | Completed | `docs: week 3 final report` |

---

## 3. Key Technical Implementations

### 3.1 Activity History Engine (`/api/activities`)
- **Table / Model:** `Activity` with fields `id`, `organizationId`, `projectId`, `taskId`, `userId`, `action`, `details`, `createdAt`.
- **Supported Event Actions:**
  - `TASK_CREATED`: Fired when any task is created in the project.
  - `TASK_ASSIGNED`: Fired when a task is initially assigned or reassigned to a user.
  - `TASK_STATUS_CHANGED`: Fired whenever a task changes status (including Kanban drag-and-drop movements).
  - `COMMENT_ADDED`: Fired when a team member adds a comment to a task.
  - `TASK_UPDATED`: Fired when title, description, priority, or due date is edited.
  - `TASK_DELETED`: Fired when a task is removed.
- **Query Support:** `GET /api/activities` and `GET /api/tasks/:id/activities` support pagination (`limit`, `offset`) and filtering by task, project, user, and action.

### 3.2 Notification Service & Read Tracking (`/api/notifications`)
- **Table / Model:** `Notification` with fields `id`, `organizationId`, `userId`, `taskId`, `type`, `title`, `message`, `read`, `dedupKey`, `createdAt`, `readAt`.
- **Notification Types:** `TASK_ASSIGNED`, `COMMENT_ADDED`, `DUE_DATE_CHANGED`, `TASK_OVERDUE`, `TASK_STATUS_CHANGED`.
- **Read State:** New notifications default to `read: false`. Users can mark individual items as read or execute a bulk `mark-all-read` operation.
- **Actor Suppression:** When a user updates a task or posts a comment, they are automatically suppressed from receiving self-notifications.

### 3.3 Overdue Detection Engine (`/api/tasks/overdue` & `/api/tasks/check-overdue`)
- **Agreed Timezone Rule:** Strict **UTC (Coordinated Universal Time)**.
- **Condition:** Tasks where `dueDate < nowUTC` and status NOT in (`DONE`, `CANCELLED`).
- **Automation / Trigger:** Can be called periodically by schedulers or on demand via `POST /api/tasks/check-overdue`.
- **Response Metrics:** Returns `overdueCount`, `notificationsCreated`, and list of overdue tasks with `overdueDays` calculated.

### 3.4 Duplicate Prevention Architecture
- **Deduplication Key Scheme:**
  - Overdue notifications: `overdue:${task.id}:${dateKey}` where `dateKey` is `YYYY-MM-DD` in UTC.
  - Assignment notifications: `assigned:${task.id}:${assigneeId}`.
- **Unread Guard:** An existing unread alert of the same type for the same task prevents redundant entries.
- **Database Index:** `@@unique([organizationId, userId, dedupKey])` protects against concurrent race conditions.

### 3.5 Simulated Email System (`emailService.js`)
- All transactional emails are dispatched to an in-memory outbox (`simulatedOutbox`) and logged with `[SIMULATED EMAIL]` prefixes.
- Documented honestly in `docs/notification-limits.md`.
- Inspectable at runtime via `GET /api/notifications/simulated-emails`.

### 3.6 Frontend Integration (`AppHeader.jsx`)
- Replaced static placeholder dropdown with dynamic notification fetching via `fetchNotifications()`.
- Real-time unread badge counter.
- Interactive mark-as-read click handler on each notification card.
- "Mark all read" quick action.

---

## 4. Test Results

Executed via `npm test` (`node --test`):

```text
✔ 404 Handler returns uniform error format (57ms)
✔ POST /api/users returns 400 when required fields are missing (25ms)
✔ POST /api/organizations returns 400 when name is missing (11ms)
✔ GET /api/projects rejects request when organization header is missing (4ms)
✔ POST /api/tasks rejects invalid status enum (72ms)
✔ All API errors strictly follow { error: message } format (7ms)
✔ POST /api/auth/signup rejects request when required fields are missing (108ms)
✔ POST /api/auth/login rejects request when password is missing (9ms)
✔ GET /api/health returns OK status (58ms)
✔ GET / returns 200 and server running info (66ms)
✔ GET /health checks database connection and returns standard format (74ms)
✔ Full Flow: Create Project -> Create Task -> Move Task (Kanban) -> Filter & Search (222ms)
✔ Kanban View: GET /api/tasks?view=kanban groups cards by status columns (5ms)
✔ Multi-Criteria Search & Filter Options (26ms)
✔ Validation & Error Responses: 400 Bad Request (21ms)
✔ Tenant Isolation & 404 Handlers (8ms)
[SIMULATED EMAIL] To: alice.w3@example.com | Subject: "[Qveto] Task Assigned: Implement Activity Stream"
[SIMULATED EMAIL] To: alice.w3@example.com | Subject: "[Qveto] New Comment: Implement Activity Stream"
✔ Day 1: Activity history is recorded on task creation, assignment, status change, and comments (270ms)
✔ Day 2: Notification records created for assignment, comments, and due date changes with read/unread (43ms)
[SIMULATED EMAIL] To: alice.w3@example.com | Subject: "[Qveto] Task Assigned: Urgent Security Audit"
[SIMULATED EMAIL] To: alice.w3@example.com | Subject: "[Qveto] Task Overdue: Urgent Security Audit"
✔ Day 3: Overdue detection follows UTC rule and flags past-due tasks (33ms)
✔ Day 4: Duplicate notifications are prevented on repeated checks (6ms)
✔ Day 5: Notification endpoints allow listing, mark read, mark all read with strict user isolation (30ms)
✔ Day 6: Email is honestly documented and verified as SIMULATED (3ms)

Total tests: 22 passed, 0 failed (duration: 886ms)
```

---

## 5. Team Coordination Notes

- **Member 1 (Database):** Synchronized Prisma schema with `activities`, `task_comments`, and `notifications` tables and foreign keys.
- **Member 2 (Auth & Architecture):** Agreed on standardizing overdue date evaluation to **UTC** and aligned user isolation on notification endpoints using `req.user.id` and `x-user-id`.
- **Member 3 (Frontend):** Provided endpoint contract for notification drawer in `AppHeader.jsx` and added API helper client functions in `frontend/src/services/api.js`.
- **Member 5 (QA & Docs):** Expanded automated test suite in `backend/tests/week3.test.js` validating all Day 1 through Day 6 requirements.

---

## 6. Definition of Done Checklist

- [x] **Important events are recorded:** Creation, assignments, status changes, comments, updates, deletions.
- [x] **Notifications are created and can be marked read:** Event-driven notification generation with read/unread flags and mark-all-read endpoint.
- [x] **Overdue follows the agreed rule:** UTC timezone comparison against non-completed tasks.
- [x] **Duplicates are controlled:** Daily deduplication key suppression preventing redundant alerts.
- [x] **Email status is honestly documented:** Simulated in-memory outbox fully documented in `docs/notification-limits.md`.
- [x] **Ready for GitHub Push:** Committed with clear conventional commit messages on `member-4-backend-deploy`.
