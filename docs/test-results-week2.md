# Qveto QA Test Results Report - Week 2 Execution

**Document Owner:** Member 5 (QA & Docs)  
**Execution Date:** 2026-10-22  
**Test Suite File:** `tests/week2/*.test.js`  
**Execution Engine:** Node.js native test runner (`node --test`)  
**Overall Result:** 35 / 35 Week 2 Tests Passed (100% Pass Rate)

---

## 1. Day 1: Project Management & Role Access Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-PROJ-01** | Owner Project Creation | Authenticated as `user_owner_1` in `org_acme_corp`. Submitted project payload. | Project created with unique ID and `ACTIVE` status. | Project created with ID `proj_*` and status `ACTIVE`. | **PASS** |
| **TC-PROJ-02** | Manager Project Creation | Authenticated as `user_manager_1`. Created project. | Project created with creator ID set to manager. | Project created successfully with `createdById = user_manager_1`. | **PASS** |
| **TC-PROJ-03** | Employee Creation Block | Authenticated as `user_employee_1`. Attempted project creation. | Operation rejected with `403 Forbidden`. | Rejected with status `403` and message "employees cannot create projects". | **PASS** |
| **TC-PROJ-04** | Project Details Update | Updated title and description using Owner credentials. | Project fields updated, `updatedAt` refreshed. | Name and description updated cleanly. | **PASS** |
| **TC-PROJ-05** | Employee Update Block | Attempted update using Employee credentials. | Rejected with `403 Forbidden`. | Throws `403 Forbidden`. | **PASS** |
| **TC-PROJ-06** | Assigned Employee View | Employee opens project where they are a listed member. | Returns 200 OK with project data. | Project data returned successfully. | **PASS** |
| **TC-PROJ-07** | Unassigned Employee View Block | Employee attempts to open project where they are NOT a member. | Rejected with `403 Forbidden`. | Rejected with `403 Forbidden`. | **PASS** |
| **TC-PROJ-08** | Multi-Tenant Data Isolation | Acme user queries Beta Tech's project `proj_beta_crm`. | Rejected with `404 Not Found` (Masking existence). | Rejected with `404 Not Found`. | **PASS** |
| **TC-PROJ-09** | Duplicate Project Name | Attempted creating project with existing name in org. | Rejected with `400 Bad Request`. | Rejected with `400 Bad Request`. | **PASS** |

---

## 2. Day 2: Task Assignment, Priority, Due Dates, Subtasks & Labels Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-TASK-01** | Full Task Creation | Created task with title, priority `HIGH`, assignee, due date, subtasks, labels. | Task persisted with all properties and initial subtask progress (33%). | Created with `subtaskProgress = 33%`, all properties intact. | **PASS** |
| **TC-TASK-02** | Priority Validation | Provided invalid priority `SUPER_URGENT`. | Rejected with `400 Bad Request`. | Throws `400` with allowed priority enum list. | **PASS** |
| **TC-TASK-03** | Cross-Tenant Assignee Block | Assigned task to user from another organization (`user_external_emp`). | Rejected with `400 Bad Request`. | Throws `400`: Assignee does not belong to organization. | **PASS** |
| **TC-TASK-04** | Invalid Date Format Block | Supplied invalid date string `not-a-valid-date-31-02-2026`. | Rejected with `400 Bad Request`. | Throws `400`: Invalid due date format. | **PASS** |
| **TC-TASK-05** | Subtask Progress Resilience | Tested task with 0 subtasks, then updated to 2 completed subtasks. | Returns `0%` for 0 subtasks without error; `100%` when completed. | Handled division-by-zero cleanly; returned `0` and `100`. | **PASS** |
| **TC-TASK-06** | Label Normalization | Provided array with whitespace and empty entries. | Normalized to lowercase, trimmed, empty removed. | Returned `['devops', 'ci/cd']`. | **PASS** |

---

## 3. Day 3: Kanban Board Workflows, Drag & Drop, Alternative Controls & Persistence Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-KANBAN-01** | Drag & Drop Stage Move | Dispatched Kanban move action moving card from `TODO` to `IN_PROGRESS` at index 1. | Status changes to `IN_PROGRESS`, orderIndex becomes 1. | Status updated to `IN_PROGRESS`, orderIndex = 1. | **PASS** |
| **TC-KANBAN-02** | Accessible Keyboard Control | Invoked `moveKanbanAccessible` with `NEXT`, `NEXT`, then `PREV`. | Task steps forward `TODO` -> `IN_PROGRESS` -> `REVIEW`, then back to `IN_PROGRESS`. | Exact state transitions observed without UI drag reliance. | **PASS** |
| **TC-KANBAN-03** | Persistence After Reload | Updated task to `DONE`, re-queried database state from clean caller. | Updated status `DONE` and `completedAt` persist accurately. | State preserved completely across calls. | **PASS** |
| **TC-KANBAN-04** | Completion Timestamp Cycle | Moved task to `DONE`, verified timestamp, moved back to `IN_PROGRESS`. | `completedAt` populated on completion, cleared on reopen. | Timestamp created, then reset to `null` on reopening. | **PASS** |
| **TC-KANBAN-05** | Invalid Target Status | Provided unsupported status `CANCELLED_INVALID`. | Rejected with `400 Bad Request`. | Throws `400`: Invalid Kanban status. | **PASS** |

---

## 4. Day 4: Search, Filters, Role Limits & Multi-Tenant Organization Limits Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SEARCH-01** | Keyword Search | Queried tasks with search query `'Kanban'`. | Returns matching task `task_2`. | 1 task returned matching search criteria. | **PASS** |
| **TC-FILTER-02** | Status Filter | Filtered by `status = 'IN_PROGRESS'`. | Only in-progress tasks returned. | All returned tasks have status `IN_PROGRESS`. | **PASS** |
| **TC-FILTER-03** | Priority Filter | Filtered by `priority = 'HIGH'`. | Only high-priority tasks returned. | Filtered tasks accurately match `HIGH`. | **PASS** |
| **TC-FILTER-04** | Assignee Filter | Filtered by `assigneeId = 'user_employee_1'`. | Only tasks assigned to Charlie returned. | All returned tasks belong to target assignee. | **PASS** |
| **TC-FILTER-05** | Label Filter | Filtered by `label = 'database'`. | Only tasks tagged with `'database'` returned. | Exact match returned. | **PASS** |
| **TC-FILTER-06** | Multi-Criteria Filter | Combined `status='DONE'`, `priority='HIGH'`, `label='architecture'`. | Single matching record returned. | Exact task `task_1` returned. | **PASS** |
| **TC-TENANT-07** | Cross-Tenant List Block | Acme user attempts listing tasks from Beta Tech project. | Rejected with `404 Not Found`. | Strict `404` prevents leakage. | **PASS** |
| **TC-TENANT-08** | Cross-Tenant ID Tampering | Acme user requests `task_beta_1` by direct ID. | Access denied with `404 Not Found`. Beta user can access. | Acme denied (404); Beta access succeeds. | **PASS** |

---

## 5. Day 5: Edge Cases, Malformed Payloads, Security Sanitization & Resiliency Results

| Test Case ID | Test Description | Steps Performed | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-EDGE-01** | Empty Task Title | Submitted title containing only spaces `'   '`. | Rejected with `400 Bad Request`. | Throws `400`: Task title is required. | **PASS** |
| **TC-EDGE-02** | No Search Matches | Searched for non-existent string. | Returns empty array `[]` without error. | Returned `[]` with status 200 equivalent. | **PASS** |
| **TC-EDGE-03** | XSS Sanitization | Injected `<script>alert("XSS")</script>` and `<img onerror=...>` in title/description. | Dangerous HTML tags sanitized into safe entities (`&lt;`, `&gt;`). | Script tags sanitized; no raw HTML execution possible. | **PASS** |
| **TC-EDGE-04** | Non-Existent Project ID | Query with `proj_non_existent_9999`. | Returns `404 Not Found`. | Throws `404`. | **PASS** |
| **TC-EDGE-05** | Unauthenticated Call | Invoked service with `null` user context. | Rejected with `401 Unauthorized`. | Throws `401`. | **PASS** |
| **TC-EDGE-06** | Non-Existent Task ID | Attempted task update on missing ID. | Returns `404 Not Found`. | Throws `404`. | **PASS** |
| **TC-EDGE-07** | API Failure Simulation | Simulated database pool exhaustion. | Throws structured error with status 503 and error code. | Error payload structured properly for client error handling. | **PASS** |
