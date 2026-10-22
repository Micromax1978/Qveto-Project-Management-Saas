# Qveto Project Management & Team Collaboration SaaS
## Software Requirements Specification (SRS) - Week 1 & 2 Baseline

**Document Owner:** Member 5 (Requirements, Testing, Documentation and QA)  
**Project:** Qveto Project Management & Team Collaboration SaaS  
**Industry:** IT Services / Enterprise Software  
**Target Delivery:** 4-Week Production Sprint  

---

### 1. Product Overview & System Context
Modern teams struggle with disconnected spreadsheets, missing task context, untracked deadlines, and ambiguous ownership. Qveto is a multi-tenant enterprise collaboration platform enabling organizations to manage workspaces, projects, Kanban boards, role permissions, file attachments, notifications, and productivity reporting.

### 2. Functional Requirements by Module

#### 2.1 Accounts & Authentication
- **FR-AUTH-01:** Secure user registration, authentication, and session handling using JWT.
- **FR-AUTH-02:** Passwords hashed using bcrypt prior to database storage.
- **FR-AUTH-03:** Multi-tenant organization scoping embedded securely in user credentials.

#### 2.2 Organizations & Workspaces
- **FR-ORG-01:** Support multiple isolated tenant organizations (e.g. Acme Corp vs. Beta Technologies).
- **FR-ORG-02:** Strict tenant boundary isolation: Organization A users cannot read, edit, or leak Organization B records.
- **FR-ORG-03:** Membership management with predefined roles: **Owner**, **Manager**, and **Employee**.

#### 2.3 Projects Management (Week 2 Focus)
- **FR-PROJ-01:** Project creation with unique title per organization, description, timeline, and member assignment.
- **FR-PROJ-02:** Role-governed access: Owners and Managers can create/edit projects; Employees can only view assigned projects.
- **FR-PROJ-03:** Project lifecycle statuses: `ACTIVE`, `COMPLETED`, `ARCHIVED`.

#### 2.4 Tasks & Kanban Lifecycle (Week 2 Focus)
- **FR-TASK-01:** Create, update, assign, and schedule tasks within an authorized project.
- **FR-TASK-02:** Priority levels: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **FR-TASK-03:** Subtasks support with individual completion checkboxes and dynamic aggregate completion percentage calculation.
- **FR-TASK-04:** Multi-label tagging with normalized string representation.
- **FR-TASK-05:** Interactive Kanban board with 4 discrete stages: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- **FR-TASK-06:** Accessible alternative controls (keyboard shortcuts and select dropdowns) complementing drag-and-drop interactions.
- **FR-TASK-07:** Task completion timestamp automatically recorded when transitioned to `DONE` and cleared if reopened.

#### 2.5 Search, Filters & Views
- **FR-VIEW-01:** Real-time text search querying task titles and descriptions.
- **FR-VIEW-02:** Combinatorial filtering by Status, Priority, Assignee ID, and Tag/Label.
- **FR-VIEW-03:** Column-based order persistence across user sessions and page reloads.

#### 2.6 Collaboration, Comments & Attachments (Week 3 Preview)
- **FR-COLLAB-01:** Rich comment thread on tasks with author timestamp and audit trail.
- **FR-COLLAB-02:** Controlled file attachments with size and MIME-type validation.

#### 2.7 Productivity Reporting & Analytics (Week 4 Preview)
- **FR-REP-01:** Project progress formula: $\text{Progress} = \frac{\text{Completed Non-Archived Tasks}}{\text{Total Non-Archived Tasks}} \times 100\%$.
- **FR-REP-02:** Overdue task tracking comparing due dates against current UTC time.

---

### 3. User Journeys

#### Journey 1: Organization Owner Onboarding & Project Setup
1. Alice signs up and provisions "Acme Corporation".
2. Alice invites Bob as a **Manager** and Charlie as an **Employee**.
3. Alice creates the core project "Acme SaaS Web App".
4. Alice defines project milestones and assigns Bob and Charlie to the project roster.

#### Journey 2: Engineering Manager Sprint Planning & Task Assignment
1. Bob logs into the Acme workspace and navigates to "Acme SaaS Web App".
2. Bob creates sprint backlog tasks:
   - Sets priority `HIGH` and `URGENT`.
   - Attaches subtask checklists (e.g., "Draft ER diagram", "Write SQL migration script").
   - Assigns Charlie Dev as the task owner.
   - Sets due dates based on sprint deliverables.
3. Bob reviews workload distribution across team members.

#### Journey 3: Employee Daily Kanban Workflow & Execution
1. Charlie logs in and views the "My Work" dashboard showing tasks assigned to him.
2. Charlie opens the Kanban board for "Acme SaaS Web App".
3. Charlie uses drag-and-drop or the keyboard accessible dropdown to advance task `task_3` from `TODO` to `IN_PROGRESS`.
4. Charlie completes individual subtask checkboxes, observing the progress bar update from 0% to 50% to 100%.
5. Upon peer verification, Charlie shifts the card to `DONE`, triggering automatic `completedAt` timestamp capture.

#### Journey 4: Strict Multi-Tenant Isolation Verification
1. Frank, an employee at "Beta Technologies", attempts to craft an API request fetching tasks from Acme Corporation's project `proj_acme_web`.
2. The server-side multi-tenant middleware inspects Frank's tenant claims and finds a mismatch.
3. The server immediately returns a `404 Not Found`, ensuring Beta Technologies cannot determine whether the resource exists or gain unauthorized data access.
