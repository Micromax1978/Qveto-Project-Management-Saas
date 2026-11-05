# Technical Presentation: Qveto Project Management & Collaboration SaaS

**Project:** Qveto Technologies — Project Management & Team Collaboration SaaS  
**Author / Presenter:** Member 5 (Requirements, Testing, Documentation and QA)  
**Evaluation:** Final Review (Weeks 1 to 4 Complete)  
**Repository Branch:** `member-5-qa-docs`  

---

## Slide 1: Project Overview & Team Structure

### Qveto Technologies SaaS Platform
- **Industry:** Enterprise IT Services / Enterprise Software
- **Core Mission:** Deliver a high-performance, multi-tenant collaboration platform enabling distributed engineering teams to plan projects, manage tasks on accessible Kanban boards, collaborate via comments and files, receive deadline alerts, and track productivity analytics.

### Team Roles & Responsibilities:
- **Member 1:** Database Architecture, Migrations & Synthetic Data Seeds
- **Member 2:** Authentication, RBAC Middleware & Task Business Logic
- **Member 3:** Frontend UI/UX, Kanban Board & Component Library
- **Member 4:** Backend Infrastructure, File Storage & Core API Endpoints
- **Member 5 (Presenter):** Requirements Specification, Security Auditing, Automated QA Testing, System Documentation & Evaluator Demo

---

## Slide 2: Problem Statement & Engineering Challenges

### The Core Problem:
- Scattered spreadsheets and chat messages lead to lost context, missed deadlines, and uncoordinated sprints.
- Managers lack reliable, mathematically sound progress indicators.
- In multi-tenant systems, weak authorization boundaries create catastrophic data leak risks between competing enterprise clients.

### Critical Engineering Requirements:
1. **Airtight Multi-Tenancy:** Complete isolation between enterprise accounts.
2. **Strict Server-Side RBAC:** Enforce Owner, Manager, and Employee permissions at the API layer, never relying solely on hidden UI buttons.
3. **Usable & Accessible Workflows:** Kanban board with mouse drag-and-drop AND keyboard accessible alternative controls.
4. **Collaboration Security:** XSS sanitization, strict MIME file validation, and zero unauthenticated downloads.
5. **Universal Analytical Standards:** Transparent metrics without false claims of live external integrations.

---

## Slide 3: System Architecture & Technology Stack

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   React 18  |  Tailwind CSS  |  Vite  |  Lucide Icons  |  Accessible Controls   |
+---------------------------------------------------------------------------------+
                                      │  HTTPS / REST
                                      ▼
+---------------------------------------------------------------------------------+
|                            API & MIDDLEWARE LAYER                               |
|   Express.js  |  JWT Auth  |  Tenant Scoper  |  RBAC Middleware  | Sanitizers   |
+---------------------------------------------------------------------------------+
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   +-----------------+       +-----------------+       +-----------------+
   | Project Service |       |  Task Service   |       | Collab Service  |
   |   (Projects,    |       | (CRUD, Kanban,  |       |   (Comments,    |
   |   Workspaces)   |       |  Subtasks math) |       |  Files, Notifs) |
   +-----------------+       +-----------------+       +-----------------+
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      ▼
+---------------------------------------------------------------------------------+
|                       PERSISTENCE & STORAGE ENGINES                             |
|  PostgreSQL / Prisma ORM  |  In-Memory Test Store (mockDb)  |  Tenant Storage   |
+---------------------------------------------------------------------------------+
```

---

## Slide 4: Multi-Tenant Data Isolation — The 404 Masking Strategy

### The Dual-Organization Test Setup:
- **Organization A:** Acme Corporation (`org_acme_corp`) — 4 users, 2 projects, 4 tasks
- **Organization B:** Beta Technologies (`org_beta_tech`) — 2 users, 1 project, 1 task

### The Security Defense Pattern:
- When an Organization B user attempts to access an Organization A ID:
  - **Traditional Vulnerable Approach:** Returns `403 Forbidden` $\rightarrow$ Leaks confirmation that the resource exists!
  - **Qveto 404 Masking Approach:** Returns **`HTTP 404 Not Found`** $\rightarrow$ Masks presence, defeating ID enumeration attacks.

### Verified Attack Vectors (All Defeated):
- Cross-tenant Project read/update: **404 Not Found**
- Cross-tenant Task manipulation: **404 Not Found**
- Trojan Task injection into foreign project: **404 Not Found**
- Cross-tenant File download attempt: **404 Not Found**
- Cross-tenant Comment deletion: **404 Not Found**

---

## Slide 5: Role-Based Access Control (RBAC) Architecture

```
               [ OWNER ] ─── Full Tenant Control (Settings, Members, Billing, All Projects)
                   │
              [ MANAGER ] ── Create / Edit Projects, Assign Tasks, Moderate Comments
                   │
             [ EMPLOYEE ] ── Work on Assigned Projects/Tasks, Comment, Upload Attachments
```

### Server-Side Permission Enforcement:
- **Project Creation:** Restricted to `OWNER` and `MANAGER`. Employee attempts return `403 Forbidden`.
- **Project Visibility:** Owners and Managers view all tenant projects; Employees only view projects where they are assigned members.
- **Comment Moderation:** Authors can delete their own comments; Managers and Owners can moderate and delete team comments.
- **Task Deletion:** Protected operation restricted to authorized project managers.

---

## Slide 6: Core Workflows: Projects, Tasks & Accessible Kanban

### Task Lifecycle & Attribute Richness:
- Fields: Title, Description, Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), Status (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), Due Date, Assignee, Labels, and Subtasks.
- **Subtask Progress Math:**
  $$\text{Progress} = \text{round}\left(\frac{\text{Completed Subtasks}}{\text{Total Subtasks}} \times 100\right)$$
  - Hermetic zero-length protection: Returns `0%` when subtasks are empty, preventing `NaN` or zero-division crashes.

### Kanban Accessibility Innovation:
- **Dual Control Pattern:**
  1. *Mouse/Touch:* HTML5 Drag-and-drop between columns.
  2. *Keyboard/Screen Reader:* Accessible directional movement (`moveKanbanAccessible` forward / backward) and explicit status select controls.
- **Automatic Completion Timestamping:** Transitioning to `DONE` automatically populates `completedAt` with the current UTC timestamp; moving out clears it.

---

## 7. Collaboration Security & Attachment Hardening

### Threaded Comments:
- **XSS Sanitization:** Replaces dangerous script tags and HTML injection sequences (`<script>`, `<iframe>`, `&`, `"`, `'`).
- **Payload Bounds:** Enforces strict ceiling (`MAX_COMMENT_LENGTH = 2000`) preventing memory exhaustion attacks.

### File Attachments Engine:
- **Size Limit:** Capped at 10 MB per file; empty (0-byte) uploads rejected.
- **Whitelist Enforcement:** Only safe document and image formats permitted (`pdf`, `png`, `jpg`, `jpeg`, `csv`, `docx`, `txt`, `zip`). Executables (`.exe`, `.sh`, `.bat`, `.dll`) rejected with status 400.
- **Directory Traversal Defense:** Sanitized with `path.basename` to prevent `../` attacks.
- **Private Downloads:** Public links rejected with HTTP 401; downloads require active user authentication and organization membership.

---

## Slide 8: Notifications Engine & Overdue Detection

### In-App Notification Center:
- Triggers on key project events: task assignment, new comments, due date modifications, and deadline alerts.
- Read/Unread tracking with timestamped `readAt` markers.

### Deduplication Cooldown:
- A 5-minute sliding deduplication window suppresses identical alert spam for the same user and task.

### Overdue Task Detection Logic:
- Evaluates active tasks where $\text{dueDate} < \text{currentTime}$.
- **Exclusion Guard:** Completed (`status = 'DONE'`) and cancelled tasks are strictly excluded from overdue alerts.

### Universal Analytical Compliance:
- Email delivery is explicitly labeled as **simulated** (`isSimulated: true`). We never claim live SMTP/SendGrid delivery in prototype mode.

---

## Slide 9: Productivity Analytics & KPI Definitions

### Mathematical KPI Rigor (Universal Standards):
1. **Project Progress:**
   $$\text{Progress} = \frac{\text{Completed Non-Archived Tasks}}{\text{Total Non-Archived Tasks}} \times 100\%$$
2. **Task Completion Rate:**
   $$\text{Completion Rate} = \frac{\text{Completed Eligible Tasks}}{\text{Total Eligible Tasks}} \times 100\%$$
3. **On-Time Completion Rate:**
   $$\text{On-Time Rate} = \frac{\text{Tasks Completed on or Before Due Date}}{\text{Total Completed Tasks with Due Date}} \times 100\%$$
4. **Overdue Task Count:** Number of active open tasks with UTC $\text{dueDate} < \text{now}$.
5. **Assignment Coverage:** Percent of active tasks with an assigned team member.
6. **Workload Breakdown:** Per-member distribution of open, completed, and overdue tasks.

---

## Slide 10: Quality Assurance & Bug Fix Evidence

### Testing Scorecard:
- **Total Test Suites:** **36**
- **Total Automated Tests:** **172**
- **Passing Tests:** **172 (100% Pass Rate)**
- **Failing Tests:** **0**
- **Execution Speed:** **~3.5 seconds**

### The 10 Resolved System Bugs:
| Bug ID | Root Cause | Fix Implemented |
| :--- | :--- | :--- |
| **BUG-001** | Employee could create projects | Enforced role check guard in `ProjectService` |
| **BUG-002** | Kanban lacked keyboard controls | Added `moveKanbanAccessible` control |
| **BUG-003** | Cross-tenant task tampering | Enforced `task.orgId === user.orgId` with 404 |
| **BUG-004** | Division-by-zero on empty subtasks | Added zero-length guard in progress calculation |
| **BUG-005** | Invalid date crashed server | Added date parser validation returning 400 |
| **BUG-006** | Unbounded comment payload | Added `MAX_COMMENT_LENGTH = 2000` limit |
| **BUG-007** | Executable attachments allowed | Added strict extension/MIME whitelist |
| **BUG-008** | Public attachment downloads | Blocked public access, required auth token |
| **BUG-009** | Overdue alert spam | Implemented 5-minute deduplication window |
| **BUG-010** | Completed tasks marked overdue | Excluded `DONE` and `CANCELLED` tasks |

---

## Slide 11: Honest Limitations & Production Roadmap

### Stated Prototype Limitations:
1. **Simulated Email:** In-app delivery is live; outbound email is transparently simulated.
2. **Kanban Sync:** Polling-based sync rather than sub-millisecond WebSockets.
3. **File Storage:** Local tenant-partitioned disk storage rather than AWS S3.

### Production Engineering Roadmap:
- **Phase 1 (Q1):** Real-time WebSockets with Redis pub/sub backplane.
- **Phase 2 (Q2):** AWS S3 object storage with pre-signed URLs and ClamAV scanning.
- **Phase 3 (Q3):** Transactional email delivery via AWS SES with bounce tracking.
- **Phase 4 (Q4):** Enterprise SSO (SAML 2.0 / Okta / Azure AD) and SCIM provisioning.
- **Phase 5:** Interactive Gantt charts with Critical Path Method (CPM) calculation.

---

## Slide 12: Summary & Q&A

### Key Takeaways:
1. **Fully Delivered Scope:** All 4 weeks of features, requirements, and tests successfully completed.
2. **Provable Multi-Tenancy:** 7 isolation tests verify complete separation between Acme Corp and Beta Tech.
3. **Rigorous Quality:** 172 automated tests passing with zero failures.
4. **Comprehensive Documentation:** Full SRS, ERD, Security Checklist, Bug Register, Test Reports, and Evaluator Demo Guide.

**Thank you! We welcome questions from the evaluation panel.**
