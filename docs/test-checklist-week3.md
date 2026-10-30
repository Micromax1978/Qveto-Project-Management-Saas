# Qveto QA Test Checklist & Verification Guide - Week 3
**Goal:** Prove the collaboration features are safe and correct: comments, uploads, downloads, notifications, overdue detection, and multi-tenant boundary security.

**Tester:** Member 5 (QA & Docs)  
**Target Branches:** `Testing-Docs` & `member-5-qa-docs`  
**Execution Environment:** Node.js v24.13.0 Native Test Runner  

---

## 1. Week 3 Checklist & Completion Status

### Day 1: Task Comments & Collaboration Security
- [x] **TC-COMM-01:** Valid comment creation on accessible task succeeds and persists.
- [x] **TC-COMM-02:** Empty comment or whitespace-only comment rejected with `400 Bad Request`.
- [x] **TC-COMM-03:** Comment exceeding `MAX_COMMENT_LENGTH` (2,000 characters) rejected with `400 Bad Request`.
- [x] **TC-COMM-04:** Commenting on a non-existent task returns `404 Not Found`.
- [x] **TC-COMM-05:** Unauthorized user from another organization cannot comment (masked as `404 Not Found` for isolation).
- [x] **TC-COMM-06:** Employee not assigned to the project is forbidden from commenting (`403 Forbidden`).
- [x] **TC-COMM-07:** HTML/XSS injection in comment is sanitized into safe HTML entities.
- [x] **TC-COMM-08:** Comments retrieval returns task comments and masks cross-tenant comments.
- [x] **TC-COMM-09:** Comment deletion authorization: author or manager can delete; other employees forbidden (`403`).

### Day 2: File Uploads & Security Validation
- [x] **TC-UPLOAD-01:** Allowed file types upload successfully with metadata and private storage path.
- [x] **TC-UPLOAD-02:** Disallowed executable file types (`.exe`, `.sh`, `.bat`, `.dll`) rejected with clear message.
- [x] **TC-UPLOAD-03:** File size exceeding 10MB ceiling is rejected with clear descriptive message displaying size.
- [x] **TC-UPLOAD-04:** Empty (0-byte) file is rejected with `400 Bad Request`.
- [x] **TC-UPLOAD-05:** Path traversal sequences in filename (`../../`) are sanitized.
- [x] **TC-UPLOAD-06:** Unauthenticated file upload is rejected with `401 Unauthorized`.
- [x] **TC-UPLOAD-07:** Cross-tenant upload attempt is masked with `404 Not Found`.

### Day 3: Attachment Download Security & Boundary Enforcement
- [x] **TC-DOWN-01:** Logged-out user trying to download attachment is rejected with `401 Unauthorized`.
- [x] **TC-DOWN-02:** Public direct link download attempt is rejected with `401 Unauthorized` (public downloads disabled).
- [x] **TC-DOWN-03:** User from another organization (Org B) cannot download Org A file (`404 Not Found` isolation).
- [x] **TC-DOWN-04:** Acme user cannot download Beta Technologies attachment (`404 Not Found` isolation).
- [x] **TC-DOWN-05:** Authorized project member can download file with secure headers (`Content-Disposition`, `X-Content-Type-Options: nosniff`, `Cache-Control: private`).
- [x] **TC-DOWN-06:** Employee not assigned to the project is forbidden from downloading (`403 Forbidden`).
- [x] **TC-DOWN-07:** Non-existent attachment ID returns `404 Not Found`.

### Day 4: Notifications, Overdue Alerts & Deduplication
- [x] **TC-NOTIF-01:** Creates notification for task assignment (`TASK_ASSIGNED`).
- [x] **TC-NOTIF-02:** Creates notification for comment added (`COMMENT_ADDED`) and due date change (`DUE_DATE_CHANGED`).
- [x] **TC-NOTIF-03:** Mark notification as read updates status and records `readAt` timestamp.
- [x] **TC-NOTIF-04:** Mark all as read updates all unread notifications for user.
- [x] **TC-NOTIF-05:** Deduplication suppresses repeated identical notifications within cooldown window.
- [x] **TC-NOTIF-06:** Overdue detection near date boundary (1 sec before vs 1 sec after).
- [x] **TC-NOTIF-07:** Completed or cancelled tasks are NEVER flagged as overdue.
- [x] **TC-NOTIF-08:** Email notification is accurately labeled as simulated (never claiming live delivery).

### Day 5: Multi-Tenant Boundary Isolation & System Regression
- [x] **TC-BOUND-01:** Beta Tech cannot access Acme projects (`404 Not Found`).
- [x] **TC-BOUND-02:** Acme cannot access Beta Tech CRM project (`404 Not Found`).
- [x] **TC-BOUND-03:** Beta Tech cannot read or mutate Acme tasks (`404 Not Found`).
- [x] **TC-BOUND-04:** Acme cannot access Beta Tech task comments (`404 Not Found`).
- [x] **TC-BOUND-05:** Beta Tech cannot download Acme private attachments (`404 Not Found`).
- [x] **TC-BOUND-06:** Notifications are strictly scoped to user and tenant (no cross-tenant leakage).
- [x] **TC-REG-07:** Week 1 Regression - Role permission prevents employee project creation (`403 Forbidden`).
- [x] **TC-REG-08:** Week 2 Regression - Kanban status transition and completion timestamp management.
- [x] **TC-REG-09:** Week 2 Regression - Accessible keyboard Kanban controls (`NEXT`/`PREV`).
- [x] **TC-REG-10:** Week 2 Regression - Subtask progress calculation avoids zero division.
