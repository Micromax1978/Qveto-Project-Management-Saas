# Qveto SaaS: Security & Authorization Checklist
## Week 3 Security Review & Verification Matrix

**Document Owner:** Member 5 (Requirements, Testing, Documentation and QA)  
**Evaluation Scope:** Collaboration, Attachments, Notifications, Multi-Tenant Isolation & Role Boundaries  
**Audited Target:** `backend/src/`, `backend/controllers/`, `backend/middleware/`  
**Execution Engine:** Node.js v24 Native Test Runner (`node --test`)  
**Status:** ALL CHECKS PASSED (100% Compliance)  

---

## 1. Multi-Tenant Data Isolation Checks

| Control ID | Security Control Description | Enforcement Mechanism | Verified Test ID | Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-TEN-01** | Cross-tenant project reading isolation | Database queries enforce `WHERE org_id = :tenant_id`. Foreign tenant IDs return `404 Not Found` to prevent entity probing. | `TC-BOUND-01`, `TC-BOUND-02` | **PASS** |
| **SEC-TEN-02** | Cross-tenant project mutation prevention | Attempts by Organization A users to update or delete Organization B projects are blocked with `404 Not Found`. | `TC-BOUND-01` | **PASS** |
| **SEC-TEN-03** | Cross-tenant task access and editing | Tasks carry tenant ownership. Accessing foreign tenant task IDs returns `404 Not Found`. | `TC-BOUND-03`, `TC-TENANT-08` | **PASS** |
| **SEC-TEN-04** | Cross-tenant task comment isolation | Comments are scoped by both `orgId` and `taskId`. Users from another organization cannot list or post comments. | `TC-COMM-05`, `TC-BOUND-04` | **PASS** |
| **SEC-TEN-05** | Cross-tenant file attachment isolation | Files stored under tenant-specific paths (`storage/:orgId/:projId/`). Foreign tenant requests masked with `404 Not Found`. | `TC-DOWN-03`, `TC-BOUND-05` | **PASS** |
| **SEC-TEN-06** | Cross-tenant notification boundary | In-app notification queues strictly filtered by `orgId` and `userId`. No cross-tenant notification delivery is possible. | `TC-BOUND-06` | **PASS** |

---

## 2. Role-Based Access Control (RBAC) Checks

| Control ID | Security Control Description | Enforcement Mechanism | Verified Test ID | Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-RBAC-01** | Employee project creation restriction | Employees are strictly barred from creating new projects; server throws `403 Forbidden`. | `TC-PROJ-03`, `TC-REG-07` | **PASS** |
| **SEC-RBAC-02** | Unassigned project visibility | Employees can only view projects where they are explicitly assigned in `project.members`. Others yield `403 Forbidden`. | `TC-PROJ-07` | **PASS** |
| **SEC-RBAC-03** | Task assignment privileges | Only Owners and Managers can assign tasks to team members. | `TC-FE-PERM-02`, `TC-FE-PERM-03` | **PASS** |
| **SEC-RBAC-04** | Comment deletion authority | Comment authors, project managers, and organization owners can delete comments. Other employees cannot delete peers' comments (`403`). | `TC-COMM-09` | **PASS** |
| **SEC-RBAC-05** | Attachment upload authorization | Only assigned project members or managers can attach files to tasks. Unassigned employees are rejected (`403`). | `TC-COMM-06`, `TC-DOWN-06` | **PASS** |

---

## 3. Input Validation, Content Security & Sanitization

| Control ID | Security Control Description | Enforcement Mechanism | Verified Test ID | Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-INP-01** | Comment payload bounds validation | Rejects empty strings, whitespace-only content, and comments exceeding `MAX_COMMENT_LENGTH` (2,000 characters). | `TC-COMM-02`, `TC-COMM-03` | **PASS** |
| **SEC-INP-02** | XSS protection in comment threads | HTML tags (`<script>`, `<img>`, `<iframe>`) are escaped into safe HTML entities prior to persistence. | `TC-COMM-07` | **PASS** |
| **SEC-INP-03** | Task title & description sanitization | Script tags and inline event handlers (`onerror=`) stripped and encoded. | `TC-EDGE-03` | **PASS** |
| **SEC-INP-04** | Due date format validation | Strict date parsing using `isNaN(new Date(date).getTime())`. Invalid dates return `400 Bad Request` without server crash. | `TC-TASK-04` | **PASS** |
| **SEC-INP-05** | Priority enum enforcement | Validates priority strings against `['LOW', 'MEDIUM', 'HIGH', 'URGENT']`. Invalid values return `400 Bad Request`. | `TC-TASK-02` | **PASS** |

---

## 4. File Upload & Storage Security Controls

| Control ID | Security Control Description | Enforcement Mechanism | Verified Test ID | Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-FILE-01** | File MIME-type & extension whitelist | Enforces strict whitelist: `PDF`, `PNG`, `JPG`, `CSV`, `DOCX`, `TXT`, `ZIP`. Executable files (`.exe`, `.sh`, `.bat`) rejected with `400`. | `TC-UPLOAD-02` | **PASS** |
| **SEC-FILE-02** | Maximum file size ceiling | Limits uploads to 10 MB (`10 * 1024 * 1024` bytes). Oversized files return descriptive `400 Bad Request`. | `TC-UPLOAD-03` | **PASS** |
| **SEC-FILE-03** | Empty file upload prevention | Files with 0 bytes are rejected immediately with `400 Bad Request`. | `TC-UPLOAD-04` | **PASS** |
| **SEC-FILE-04** | Path traversal sanitization | File names containing directory traversal sequences (`../../`) sanitized via `path.basename` and regex stripping. | `TC-UPLOAD-05` | **PASS** |
| **SEC-FILE-05** | Storage directory isolation | Uploaded files are partitioned into tenant-scoped folders: `storage/:orgId/:projectId/`. | `TC-UPLOAD-01` | **PASS** |

---

## 5. Attachment Download & Public Link Protection

| Control ID | Security Control Description | Enforcement Mechanism | Verified Test ID | Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-DOWN-01** | Anonymous download rejection | Logged-out requests or missing bearer tokens are rejected with `401 Unauthorized`. | `TC-DOWN-01` | **PASS** |
| **SEC-DOWN-02** | Public direct URL prohibition | Attachments cannot be served via unauthenticated public links (`isPublicLink` returns `401`). | `TC-DOWN-02` | **PASS** |
| **SEC-DOWN-03** | Security response headers | Download responses enforce `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private`. | `TC-DOWN-05` | **PASS** |

---

## 6. Notifications, Overdue Accuracy & Deduplication

| Control ID | Security Control Description | Enforcement Mechanism | Verified Test ID | Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-NOTIF-01** | Notification event triggers | Dispatched for assignment, comments, and due date adjustments with proper recipient targeting. | `TC-NOTIF-01`, `TC-NOTIF-02` | **PASS** |
| **SEC-NOTIF-02** | Self-notification suppression | Adding a comment does not dispatch an alert back to the commenting user. | `TC-NOTIF-02` | **PASS** |
| **SEC-NOTIF-03** | Alert deduplication window | Suppresses duplicate alerts for the same event and task within a 5-minute cooldown window. | `TC-NOTIF-05` | **PASS** |
| **SEC-NOTIF-04** | Overdue date boundary precision | Evaluates task deadlines against UTC time (accurate down to second boundary: 1s before vs 1s after). | `TC-NOTIF-06` | **PASS** |
| **SEC-NOTIF-05** | Completed task overdue exclusion | Tasks marked `DONE` or `CANCELLED` are excluded from overdue notifications and calculations. | `TC-NOTIF-07` | **PASS** |
| **SEC-NOTIF-06** | Simulated email transparency | System explicitly labels mock email delivery as `isSimulated: true` and `status: MOCK_LOGGED_NOT_SENT_TO_INTERNET`. | `TC-NOTIF-08` | **PASS** |

---

## 7. Audit Logging & Traceability

| Control ID | Security Control Description | Enforcement Mechanism | Verified Test ID | Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-AUD-01** | Comment activity audit trail | Comment creations logged to `db.activityLogs` with user ID, task ID, timestamp, and action description. | `TC-COMM-01` | **PASS** |
| **SEC-AUD-02** | Attachment activity audit trail | File uploads logged with safe file name, byte size, uploader ID, and timestamp. | `TC-UPLOAD-01` | **PASS** |
| **SEC-AUD-03** | Task completion timestamp | Moving task to `DONE` records `completedAt`; reopening clears timestamp to `null`. | `TC-REG-08`, `TC-KANBAN-04` | **PASS** |

---

## 8. Summary of Results

- **Total Security Controls Evaluated:** 30
- **Total Security Controls Passing:** 30 (100%)
- **Zero-Day / Critical Vulnerabilities:** 0
- **Automated Security Verification:** Covered across 41 Week 3 tests + 57 baseline tests = **98 passing tests**.
