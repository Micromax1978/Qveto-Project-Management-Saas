# Qveto QA Bug Tracking & Fix Evidence Log

**Document Owner:** Member 5 (QA & Docs)  
**Status:** All Reported Bugs FIXED & VERIFIED (Week 1, Week 2 & Week 3)  

---

## 1. Bug Tracking Register

| Issue | Steps to reproduce | Responsible member | Status |
| :--- | :--- | :--- | :---: |
| **BUG-001: Employee role was able to create projects without permission check** | 1. Log in with an account having `EMPLOYEE` role (`user_employee_1`).<br>2. Send POST request to `/api/projects` with a valid JSON payload `{"name": "Unauthorized Project"}`.<br>3. Observe that project was created with HTTP 201 instead of being forbidden. | Member 2 (Auth/Permissions) | **FIXED & VERIFIED** |
| **BUG-002: Kanban board lacked keyboard-accessible alternative controls for moving cards** | 1. Open the project Kanban board.<br>2. Attempt to navigate using only keyboard (`Tab` / `Arrow` keys) to move a card from `TODO` to `IN_PROGRESS`.<br>3. Notice movement was impossible without mouse drag-and-drop, violating accessibility guidelines. | Member 3 (Frontend/UI) | **FIXED & VERIFIED** |
| **BUG-003: Task update endpoint allowed cross-tenant ID tampering** | 1. Authenticate as user belonging to `org_acme_corp`.<br>2. Send PATCH request to `/api/tasks/task_beta_1` (which belongs to `org_beta_tech`).<br>3. Server previously updated task without verifying if `task.orgId === user.orgId`. | Member 4 (Backend Base) | **FIXED & VERIFIED** |
| **BUG-004: Subtask progress calculation threw division by zero when subtasks list was empty** | 1. Create a task with `subtasks: []`.<br>2. Trigger task calculation function `calculateSubtaskProgress(task.subtasks)`.<br>3. Formula `(completed / total) * 100` resulted in `NaN` or unhandled division error when `total === 0`. | Member 1 (Database/Data Schema) | **FIXED & VERIFIED** |
| **BUG-005: Unvalidated due date format crashed server on task creation** | 1. Send POST request to `/api/tasks` with `dueDate: "31-02-2026"`.<br>2. Native `new Date(dueDate)` produced `Invalid Date`.<br>3. Calling `.toISOString()` threw unhandled `RangeError: Invalid time value` terminating the process. | Member 2 (Tasks Backend) | **FIXED & VERIFIED** |
| **BUG-006: Comments endpoint accepted unbounded payloads allowing DoS and memory exhaustion** | 1. Send POST `/api/tasks/:id/comments` with payload exceeding 100,000 characters.<br>2. Observe server attempting to serialize and store oversized body without payload size checks.<br>3. Database index degradation and memory consumption observed. | Member 2 (Collaboration Backend) | **FIXED & VERIFIED** |
| **BUG-007: Attachment upload permitted executable file types (.exe, .sh, .bat)** | 1. Send multipart POST request to upload attachment with file named `script.sh` or `malware.exe`.<br>2. Backend lacked strict MIME-type and extension validation, accepting dangerous executables into storage directory. | Member 4 (Backend Base) | **FIXED & VERIFIED** |
| **BUG-008: Attachment download endpoint accessible anonymously via direct public URLs** | 1. Log out or clear session tokens.<br>2. Access direct attachment storage path `/storage/:orgId/:projectId/:file`.<br>3. Observe server serving private attachments without verifying user authentication or organization membership. | Member 4 (Backend Storage) | **FIXED & VERIFIED** |
| **BUG-009: Background overdue task daemon spammed duplicate notifications to assignees** | 1. Have an active task past its due date.<br>2. Run task evaluation interval multiple times within a short period.<br>3. Assignee received identical duplicate `TASK_OVERDUE` alerts on every evaluation tick. | Member 2 (Notifications Backend) | **FIXED & VERIFIED** |
| **BUG-010: Completed tasks (status DONE) were erroneously flagged as overdue** | 1. Complete a task (`status = 'DONE'`) with a historical `dueDate`.<br>2. Run overdue check routine.<br>3. Daemon compared current date against `dueDate` without verifying if task had already been completed. | Member 1 (Data Schema/Analytics) | **FIXED & VERIFIED** |

---

## 2. Evidence of Fixes & Retest Verification

### Retest Verification for BUG-001 (Role Check on Project Creation)
- **Fix Implemented:** In `backend/src/projects/project.service.js`, added guard:
  ```javascript
  if (user.role === 'EMPLOYEE') {
    throw { status: 403, message: 'Forbidden: employees cannot create projects' };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-PROJ-03` and `TC-REG-07`. Execution returned HTTP `403` with exact expected rejection message.

### Retest Verification for BUG-002 (Kanban Keyboard Accessibility)
- **Fix Implemented:** Added `moveKanbanAccessible(taskId, direction, user)` supporting `NEXT` and `PREV` actions, plus accessible stage selector dropdown controls.
- **Retest Evidence:** Verified by automated test case `TC-KANBAN-02` and `TC-REG-09`. Card stepped through `TODO` -> `IN_PROGRESS` -> `REVIEW` -> `IN_PROGRESS` seamlessly via keyboard control API.

### Retest Verification for BUG-003 (Cross-Tenant Task Tampering)
- **Fix Implemented:** Enforced strict tenant verification in `task.service.js`:
  ```javascript
  if (task.orgId !== user.orgId) {
    throw { status: 404, message: 'Task not found' };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-TENANT-08` and `TC-BOUND-03`. Attempting to access `task_beta_1` as Acme user returns `404 Not Found`, preserving complete data isolation.

### Retest Verification for BUG-004 (Subtask Division-by-Zero)
- **Fix Implemented:** Added zero-length guard in `calculateSubtaskProgress`:
  ```javascript
  if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
    return 0;
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-TASK-05` and `TC-REG-10`. Tasks with 0 subtasks return clean `0%` progress.

### Retest Verification for BUG-005 (Due Date Validation)
- **Fix Implemented:** Added date validity check prior to `.toISOString()`:
  ```javascript
  const parsedDate = new Date(data.dueDate);
  if (isNaN(parsedDate.getTime())) {
    throw { status: 400, message: 'Invalid due date format. Expected valid ISO date string' };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-TASK-04`. Bogus date string returned clean `400 Bad Request` without process interruption.

### Retest Verification for BUG-006 (Comment Payload Length Limit)
- **Fix Implemented:** Added character count constraint (`MAX_COMMENT_LENGTH = 2000`) in `backend/src/collaboration/comment.service.js`:
  ```javascript
  if (data.content.length > MAX_COMMENT_LENGTH) {
    throw { status: 400, message: `Comment exceeds maximum allowed length of ${MAX_COMMENT_LENGTH} characters` };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-COMM-03`. Overly long comments are rejected with clean `400 Bad Request`.

### Retest Verification for BUG-007 (Attachment File Type Whitelist)
- **Fix Implemented:** Enforced whitelist of allowed extensions (`pdf`, `png`, `jpg`, `csv`, `docx`, `txt`, `zip`) and matching MIME types in `attachment.service.js`:
  ```javascript
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw { status: 400, message: `Disallowed file type '.${ext}'. Allowed formats: PDF, PNG, JPG, CSV, DOCX, TXT, ZIP` };
  }
  ```
- **Retest Evidence:** Verified by automated test case `TC-UPLOAD-02`. All executable formats (`.exe`, `.sh`, `.bat`, `.dll`) rejected with status 400.

### Retest Verification for BUG-008 (Attachment Authentication & Public Link Block)
- **Fix Implemented:** Enforced authentication check and disabled direct public links in `attachment.service.js`:
  ```javascript
  if (!user || !user.id || !user.orgId || options.isPublicLink) {
    throw { status: 401, message: 'Unauthorized: Authentication required to download attachments. Public links are disabled.' };
  }
  ```
- **Retest Evidence:** Verified by automated test cases `TC-DOWN-01` and `TC-DOWN-02`. Both anonymous requests and public link flags return `401 Unauthorized`.

### Retest Verification for BUG-009 (Notification Deduplication Cooldown)
- **Fix Implemented:** Added 5-minute cooldown deduplication window in `notification.service.js`:
  ```javascript
  const isDuplicate = db.notifications.some(n => {
    if (n.orgId === triggerUser.orgId && n.userId === data.userId && n.type === data.type && n.relatedTaskId === data.relatedTaskId) {
      return (now - new Date(n.createdAt)) < DEDUPLICATION_WINDOW_MS;
    }
    return false;
  });
  if (isDuplicate) return { deduplicated: true, message: 'Duplicate alert suppressed within cooldown window' };
  ```
- **Retest Evidence:** Verified by automated test case `TC-NOTIF-05`. Repeated alerts are suppressed cleanly without spamming assignees.

### Retest Verification for BUG-010 (Overdue Status Guard for Completed Tasks)
- **Fix Implemented:** Added status exclusion guard in `notification.service.js`:
  ```javascript
  if (task.status === 'DONE' || task.status === 'CANCELLED') return;
  ```
- **Retest Evidence:** Verified by automated test case `TC-NOTIF-07`. Completed tasks past due dates are never marked overdue.
