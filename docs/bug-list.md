# Qveto QA Bug Tracking & Fix Evidence Log

**Document Owner:** Member 5 (QA & Docs)  
**Status:** All Reported Bugs FIXED & VERIFIED  

---

## 1. Bug Tracking Register

| Issue | Steps to reproduce | Responsible member | Status |
| :--- | :--- | :--- | :---: |
| **BUG-001: Employee role was able to create projects without permission check** | 1. Log in with an account having `EMPLOYEE` role (`user_employee_1`).<br>2. Send POST request to `/api/projects` with a valid JSON payload `{"name": "Unauthorized Project"}`.<br>3. Observe that project was created with HTTP 201 instead of being forbidden. | Member 2 (Auth/Permissions) | **FIXED & VERIFIED** |
| **BUG-002: Kanban board lacked keyboard-accessible alternative controls for moving cards** | 1. Open the project Kanban board.<br>2. Attempt to navigate using only keyboard (`Tab` / `Arrow` keys) to move a card from `TODO` to `IN_PROGRESS`.<br>3. Notice movement was impossible without mouse drag-and-drop, violating accessibility guidelines. | Member 3 (Frontend/UI) | **FIXED & VERIFIED** |
| **BUG-003: Task update endpoint allowed cross-tenant ID tampering** | 1. Authenticate as user belonging to `org_acme_corp`.<br>2. Send PATCH request to `/api/tasks/task_beta_1` (which belongs to `org_beta_tech`).<br>3. Server previously updated task without verifying if `task.orgId === user.orgId`. | Member 4 (Backend Base) | **FIXED & VERIFIED** |
| **BUG-004: Subtask progress calculation threw division by zero when subtasks list was empty** | 1. Create a task with `subtasks: []`.<br>2. Trigger task calculation function `calculateSubtaskProgress(task.subtasks)`.<br>3. Formula `(completed / total) * 100` resulted in `NaN` or unhandled division error when `total === 0`. | Member 1 (Database/Data Schema) | **FIXED & VERIFIED** |
| **BUG-005: Unvalidated due date format crashed server on task creation** | 1. Send POST request to `/api/tasks` with `dueDate: "31-02-2026"`.<br>2. Native `new Date(dueDate)` produced `Invalid Date`.<br>3. Calling `.toISOString()` threw unhandled `RangeError: Invalid time value` terminating the process. | Member 2 (Tasks Backend) | **FIXED & VERIFIED** |

---

## 2. Evidence of Fixes & Retest Verification

### Retest Verification for BUG-001 (Role Check on Project Creation)
- **Fix Implemented:** In `backend/src/projects/project.service.js`, added guard:
  ```javascript
  if (user.role === 'EMPLOYEE') {
    throw { status: 403, message: 'Forbidden: employees cannot create projects' };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-PROJ-03`. Execution returned HTTP `403` with exact expected rejection message.

### Retest Verification for BUG-002 (Kanban Keyboard Accessibility)
- **Fix Implemented:** Added `moveKanbanAccessible(taskId, direction, user)` supporting `NEXT` and `PREV` actions, plus accessible stage selector dropdown controls.
- **Retest Evidence:** Verified by automated test case `TC-KANBAN-02`. Card stepped through `TODO` -> `IN_PROGRESS` -> `REVIEW` -> `IN_PROGRESS` seamlessly via keyboard control API.

### Retest Verification for BUG-003 (Cross-Tenant Task Tampering)
- **Fix Implemented:** Enforced strict tenant verification in `task.service.js`:
  ```javascript
  if (task.orgId !== user.orgId) {
    throw { status: 404, message: 'Task not found' };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-TENANT-08`. Attempting to access `task_beta_1` as Acme user returns `404 Not Found`, preserving complete data isolation.

### Retest Verification for BUG-004 (Subtask Division-by-Zero)
- **Fix Implemented:** Added zero-length guard in `calculateSubtaskProgress`:
  ```javascript
  if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
    return 0;
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-TASK-05`. Tasks with 0 subtasks return clean `0%` progress.

### Retest Verification for BUG-005 (Due Date Validation)
- **Fix Implemented:** Added date validity check prior to `.toISOString()`:
  ```javascript
  const parsedDate = new Date(data.dueDate);
  if (isNaN(parsedDate.getTime())) {
    throw { status: 400, message: 'Invalid due date format. Expected valid ISO date string' };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-TASK-04`. Bogus date string returned clean `400 Bad Request` without process interruption.
