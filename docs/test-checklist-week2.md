# Qveto QA Test Checklist & Verification Guide - Week 2
**Goal:** Validate and harden projects, tasks, Kanban workflows, search/filtering, role boundaries, and multi-tenant data isolation.

**Tester:** Member 5 (QA & Docs)  
**Target Branch:** `member-5-qa-docs`  
**Execution Environment:** Node.js v24.13.0 Test Runner  

---

## 1. Week 2 Checklist & Completion Status

### Day 1: Project Management & Role Access Testing
- [x] **TC-PROJ-01:** Owner can create projects with unique name and description.
- [x] **TC-PROJ-02:** Manager can create projects and is recorded as creator.
- [x] **TC-PROJ-03:** Employee cannot create projects (strict `403 Forbidden`).
- [x] **TC-PROJ-04:** Owner and Manager can update project details and status.
- [x] **TC-PROJ-05:** Employee cannot update project details (`403 Forbidden`).
- [x] **TC-PROJ-06:** Employee can view projects where they are an assigned member.
- [x] **TC-PROJ-07:** Employee cannot view projects where they are not a member (`403 Forbidden`).
- [x] **TC-PROJ-08:** Organization A user cannot access Organization B project (`404 Not Found`).
- [x] **TC-PROJ-09:** Duplicate project name within same organization is rejected (`400 Bad Request`).

### Day 2: Task Assignment, Priority, Due Dates, Subtasks & Labels Testing
- [x] **TC-TASK-01:** Create task with all fields (title, priority, assignee, due date, subtasks, labels).
- [x] **TC-TASK-02:** Reject invalid priority values (`400 Bad Request`). Allowed: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- [x] **TC-TASK-03:** Enforce assignee tenant membership (cannot assign task to external organization user).
- [x] **TC-TASK-04:** Reject invalid due date strings (`400 Bad Request`).
- [x] **TC-TASK-05:** Safe subtask progress percentage calculation without division-by-zero errors.
- [x] **TC-TASK-06:** Normalization, trimming, and deduplication of task labels.

### Day 3: Kanban Board Workflows, Drag & Drop, Alternative Controls & Persistence Testing
- [x] **TC-KANBAN-01:** Drag-and-drop state transitions across columns (`TODO` -> `IN_PROGRESS` -> `REVIEW` -> `DONE`).
- [x] **TC-KANBAN-02:** Accessible alternative keyboard/select controls for non-mouse or assistive tech users.
- [x] **TC-KANBAN-03:** Persistence validation: task retains updated column and order index across simulated page refresh.
- [x] **TC-KANBAN-04:** Moving task to `DONE` automatically stamps `completedAt`; reopening clears timestamp.
- [x] **TC-KANBAN-05:** Invalid Kanban status strings rejected (`400 Bad Request`).

### Day 4: Search, Filters, Role Limits & Multi-Tenant Organization Limits Testing
- [x] **TC-SEARCH-01:** Full-text search across task titles and descriptions.
- [x] **TC-FILTER-02:** Filter tasks by Status (`IN_PROGRESS`, `DONE`, etc.).
- [x] **TC-FILTER-03:** Filter tasks by Priority (`HIGH`, `URGENT`, etc.).
- [x] **TC-FILTER-04:** Filter tasks by Assignee ID.
- [x] **TC-FILTER-05:** Filter tasks by Tag/Label.
- [x] **TC-FILTER-06:** Combinatorial multi-parameter filtering.
- [x] **TC-TENANT-07:** Organization A user cannot query or list Organization B tasks (Multi-Tenant Isolation).
- [x] **TC-TENANT-08:** Tampering task ID in request parameters across tenant boundaries yields `404 Not Found`.

### Day 5: Edge Cases, Invalid Payloads, Security Sanitization & Resiliency Testing
- [x] **TC-EDGE-01:** Empty task title rejected with `400 Bad Request`.
- [x] **TC-EDGE-02:** Empty or non-matching search queries return `[]` cleanly without uncaught exceptions.
- [x] **TC-EDGE-03:** XSS payloads (`<script>`, `onerror=`) in title/description are sanitized and escaped.
- [x] **TC-EDGE-04:** Non-existent project IDs return `404 Not Found`.
- [x] **TC-EDGE-05:** Missing authorization credentials return `401 Unauthorized`.
- [x] **TC-EDGE-06:** Non-existent task IDs return `404 Not Found`.
- [x] **TC-EDGE-07:** Simulated downstream API/database failures return structured error payloads (`503 Service Unavailable`).
