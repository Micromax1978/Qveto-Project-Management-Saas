# Qveto QA Test Results Report - Week 3 Execution

**Document Owner:** Member 5 (QA & Docs)  
**Execution Date:** 2026-10-30  
**Test Suite File:** `tests/week3/*.test.js`  
**Execution Engine:** Node.js native test runner (`node --test`)  
**Overall Result:** 41 / 41 Week 3 Tests Passed (100% Pass Rate)  

---

## 1. Day 1: Task Comments & Collaboration Security Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-COMM-01** | Valid Comment Creation | Submitted valid text comment on accessible task `task_1` as Bob Manager. | Comment created with ID `comment_*`, author ID, org ID, and timestamp. | Saved with ID and returned status 200. | **PASS** |
| **TC-COMM-02** | Empty Comment Rejection | Submitted empty string and whitespace string. | Rejected with `400 Bad Request`. | Threw `400: Comment content cannot be empty`. | **PASS** |
| **TC-COMM-03** | Comment Length Constraint | Submitted comment containing 2,001 characters. | Rejected with `400 Bad Request`. | Threw `400: Comment exceeds maximum allowed length of 2000 characters`. | **PASS** |
| **TC-COMM-04** | Missing Task Reference | Commented on `task_non_existent_9999`. | Rejected with `404 Not Found`. | Threw `404: Task not found`. | **PASS** |
| **TC-COMM-05** | Cross-Tenant Comment Attempt | Eve Beta Owner attempted commenting on Acme task. | Rejected with `404 Not Found` (Isolation). | Masked with `404 Not Found`. | **PASS** |
| **TC-COMM-06** | Unassigned Employee Comment | Employee not member of project attempted commenting. | Rejected with `403 Forbidden`. | Threw `403 Forbidden`. | **PASS** |
| **TC-COMM-07** | HTML/XSS Sanitization | Injected `<script>` and `<img>` tags in comment body. | Tags escaped to `&lt;` and `&gt;`. | Script tags neutralized safely. | **PASS** |
| **TC-COMM-08** | Task Comments Retrieval | Fetched comments for `task_1` as manager and cross-org. | Acme comments returned; Beta blocked with `404`. | Strict isolation observed. | **PASS** |
| **TC-COMM-09** | Comment Deletion Authorization | Tested deletion by author, manager, and peer employee. | Peer employee rejected (`403`); author succeeded. | Role rules enforced properly. | **PASS** |

---

## 2. Day 2: File Uploads & Security Validation Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-UPLOAD-01** | Allowed File Upload | Uploaded 500KB `.pdf` to `task_1` with valid MIME type. | File stored under private path `storage/:orgId/:projId/`. | Created with `isPublic = false`. | **PASS** |
| **TC-UPLOAD-02** | Disallowed File Formats | Attempted uploading `.exe`, `.sh`, `.bat`, `.js` files. | Rejected with descriptive `400 Bad Request`. | All disallowed extensions rejected with whitelist guidance. | **PASS** |
| **TC-UPLOAD-03** | File Size Limit Enforcement | Uploaded 15MB file exceeding 10MB limit. | Rejected with `400 Bad Request` citing size in MB. | Threw `400: File size (15.00MB) exceeds maximum limit of 10MB`. | **PASS** |
| **TC-UPLOAD-04** | Empty File Rejection | Uploaded file with size `0` bytes. | Rejected with `400 Bad Request`. | Threw `400: File is empty (0 bytes)`. | **PASS** |
| **TC-UPLOAD-05** | Path Traversal Neutralization | Provided filename `../../../../etc/shadow.png`. | Traversal stripped; safe filename retained. | Normalized to `shadow.png` cleanly. | **PASS** |
| **TC-UPLOAD-06** | Unauthenticated Upload | Dispatched upload without session context (`null`). | Rejected with `401 Unauthorized`. | Threw `401 Unauthorized`. | **PASS** |
| **TC-UPLOAD-07** | Cross-Tenant Upload Block | Beta user attempted attaching file to Acme task. | Rejected with `404 Not Found`. | Masked with `404 Not Found`. | **PASS** |

---

## 3. Day 3: Attachment Download Security & Boundary Enforcement Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-DOWN-01** | Logged-Out Download Block | Attempted downloading `att_1` without session. | Rejected with `401 Unauthorized`. | Threw `401: Authentication required`. | **PASS** |
| **TC-DOWN-02** | Public Link Prohibition | Attempted downloading via public URL parameter. | Rejected with `401 Unauthorized`. | Threw `401: Public links are disabled`. | **PASS** |
| **TC-DOWN-03** | Cross-Tenant Org B -> Org A | Beta Owner attempted downloading Acme attachment `att_1`. | Rejected with `404 Not Found`. | Masked with `404 Not Found`. | **PASS** |
| **TC-DOWN-04** | Cross-Tenant Org A -> Org B | Acme Manager attempted downloading Beta attachment `att_beta_1`. | Rejected with `404 Not Found`. | Masked with `404 Not Found`. | **PASS** |
| **TC-DOWN-05** | Authorized Download & Headers | Downloaded `att_1` as assigned employee Charlie. | Returned file stream with secure headers. | `Content-Disposition`, `X-Content-Type-Options: nosniff` verified. | **PASS** |
| **TC-DOWN-06** | Unassigned Employee Block | Employee not in project member list attempted download. | Rejected with `403 Forbidden`. | Threw `403 Forbidden`. | **PASS** |
| **TC-DOWN-07** | Non-Existent Attachment ID | Requested `att_missing_99999`. | Rejected with `404 Not Found`. | Threw `404 Not Found`. | **PASS** |

---

## 4. Day 4: Notifications, Overdue Alerts & Deduplication Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-NOTIF-01** | Task Assignment Alert | Assigned task to Charlie Dev; verified notification payload. | Created in-app notification with `isRead = false`. | Delivered in-app; verified fields. | **PASS** |
| **TC-NOTIF-02** | Comment & Due Date Alerts | Triggered comment and due date change alerts. | Generated `COMMENT_ADDED` and `DUE_DATE_CHANGED` events. | Handled without self-alert loop. | **PASS** |
| **TC-NOTIF-03** | Mark As Read | Marked target unread notification as read. | `isRead` set to `true`, `readAt` timestamp recorded. | Updated status cleanly. | **PASS** |
| **TC-NOTIF-04** | Mark All As Read | Marked entire notification inbox for user as read. | All user notifications updated; count returned. | Remaining unread count = 0. | **PASS** |
| **TC-NOTIF-05** | Alert Deduplication Window | Dispatched identical comment alert twice within 5-min window. | Second alert suppressed by deduplication filter. | Second alert suppressed; `deduplicated: true`. | **PASS** |
| **TC-NOTIF-06** | Boundary Overdue Precision | Evaluated tasks due 1s before vs 1s after boundary time. | Task due -1s marked overdue; task due +1s excluded. | Exact boundary separation observed. | **PASS** |
| **TC-NOTIF-07** | Completed Task Exclusion | Evaluated task in `DONE` status with historical due date. | Excluded from overdue list and alerts. | Never marked overdue when completed. | **PASS** |
| **TC-NOTIF-08** | Email Simulation Transparency | Verified email delivery metadata on notification object. | Explicitly labeled as `isSimulated: true`. | Verified `SIMULATED_MOCK_TRANSPORT`. | **PASS** |

---

## 5. Day 5: Multi-Tenant Boundary Isolation & System Regression Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-BOUND-01** | Cross-Org Project Read | Beta Tech requested Acme project `proj_acme_web`. | Rejected with `404 Not Found`. | Threw `404 Not Found`. | **PASS** |
| **TC-BOUND-02** | Cross-Org Project Mutate | Acme requested Beta CRM project `proj_beta_crm`. | Rejected with `404 Not Found`. | Threw `404 Not Found`. | **PASS** |
| **TC-BOUND-03** | Cross-Org Task Tamper | Beta Tech attempted reading or modifying Acme `task_1`. | Rejected with `404 Not Found`. | Masked with `404 Not Found`. | **PASS** |
| **TC-BOUND-04** | Cross-Org Comment Boundary | Acme Manager attempted accessing Beta task comments. | Rejected with `404 Not Found`. | Threw `404 Not Found`. | **PASS** |
| **TC-BOUND-05** | Cross-Org Attachment Boundary | Beta Tech requested Acme attachment `att_1`. | Rejected with `404 Not Found`. | Masked with `404 Not Found`. | **PASS** |
| **TC-BOUND-06** | Cross-Org Notification Isolation | Queried inboxes for Acme and Beta employees. | Each inbox only contained own tenant's notifications. | Zero cross-tenant notification leak. | **PASS** |
| **TC-REG-07** | Week 1 Regression | Employee attempted project creation. | Rejected with `403 Forbidden`. | Threw `403 Forbidden`. | **PASS** |
| **TC-REG-08** | Week 2 Kanban Regression | Moved task to `DONE` and back to `IN_PROGRESS`. | Timestamp populated, then cleared. | Handled state cycle cleanly. | **PASS** |
| **TC-REG-09** | Week 2 Keyboard Control Regression | Dispatched `moveKanbanAccessible` (`NEXT` / `PREV`). | Stepped columns sequentially. | Status stepped accurately. | **PASS** |
| **TC-REG-10** | Week 2 Subtask Regression | Tested task with 0 subtasks and 4 subtasks (3 done). | Returned `0%` and `75%` without division error. | Computed percentage safely. | **PASS** |
