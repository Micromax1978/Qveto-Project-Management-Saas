# Qveto - Multi-Tenant Project Management & Team Collaboration SaaS

[![Build & Test Status](https://img.shields.io/badge/tests-39%20passed-brightgreen.svg)](#running-automated-tests)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![Branch](https://img.shields.io/badge/branch-member--5--qa--docs-orange.svg)](#git-branch-and-workflow)

Qveto is an enterprise-grade, multi-tenant Project Management and Team Collaboration SaaS platform developed for the Web Development Internship program. It enables teams to plan projects, manage Kanban task boards, track deadlines, collaborate with subtasks and labels, and ensure strict multi-tenant data isolation and role-based access control.

---

## 1. Team & Role Distribution

| Member | Assigned Branch | Primary Responsibility Area |
| :--- | :--- | :--- |
| **Member 1** | `member-1-database` | Database schema, migrations, relational models, synthetic seeds |
| **Member 2** | `member-2-auth-tasks` | Authentication, permissions, task logic, user sessions |
| **Member 3** | `member-3-frontend` | React frontend shell, responsive UI, Kanban drag-and-drop |
| **Member 4** | `member-4-backend-base` | Express server setup, middleware, env config, API routing |
| **Member 5 (You)** | `member-5-qa-docs` | Requirements, QA test suites, bug tracking, documentation, README |

---

## 2. Repository Directory Structure

```text
Qveto-Project-Management-Saas/
├── .env.example                  # Environment configuration template (Member 4/5)
├── .gitignore                    # Version control exclusions
├── README.md                     # Central project guide and documentation (Member 5)
├── package.json                  # Project scripts and test configurations
├── backend/                      # Backend REST API and business logic (Member 2 & 4)
│   └── src/
│       ├── auth/                 # Authentication & authorization middleware
│       ├── data/                 # Relational mock database & multi-tenant seed
│       ├── projects/             # Project CRUD service & role enforcement
│       ├── tasks/                # Task, subtask, labels & Kanban service
│       └── server.js             # Base application entry point
├── database/                     # Database migrations and seed scripts (Member 1)
│   ├── migrations/               # SQL schema definitions
│   └── seed/                     # Synthetic test datasets
├── docs/                         # Requirements, QA reports & guides (Member 5)
│   ├── bug-list.md               # 4-column bug tracker with fix evidence
│   ├── data-relationships.md     # Entity relationship diagrams and rules
│   ├── permission-matrix.md      # Role-based access control (RBAC) matrix
│   ├── requirements.md           # Product functional requirements & user journeys
│   ├── setup-guide.md            # Detailed environment setup & verification guide
│   ├── test-checklist-week2.md   # Week 2 QA testing checklist
│   ├── test-results-week2.md     # Day-by-day test execution logs (Days 1–5)
│   ├── week-2-report.md          # Week 2 QA report & Pull Request template
│   └── screenshots/              # UI testing and verification screenshots
├── frontend/                     # React UI application (Member 3)
│   └── .gitkeep
└── tests/                        # Automated test suites (Member 5 organized)
    ├── week1/
    │   ├── auth.test.js          # Auth and membership lookup tests
    │   └── permissions.test.js   # RBAC permission tests
    └── week2/
        ├── day1-projects.test.js # Day 1: Project CRUD & role permission tests
        ├── day2-tasks.test.js    # Day 2: Task assignment, priority & subtask tests
        ├── day3-kanban.test.js   # Day 3: Kanban status, drag/drop & persistence
        ├── day4-filters-permissions.test.js # Day 4: Search, filter & tenant isolation
        └── day5-edge-cases.test.js          # Day 5: Edge cases, XSS sanitization & resilience
```

---

## 3. Installation & Getting Started

### Prerequisites
- Node.js version 18.0.0 or higher (Tested with Node v24.13.0)
- Git

### Setup Steps
1. Clone the repository and switch to the `member-5-qa-docs` branch:
   ```bash
   git clone https://github.com/Micromax1978/Qveto-Project-Management-Saas.git
   cd Qveto-Project-Management-Saas
   git switch member-5-qa-docs
   ```

2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

3. Run the automated QA test suite:
   ```bash
   npm test
   ```

---

## 4. Running Automated Tests

All tests utilize the native Node.js test runner (`node --test`) without external heavy dependencies:

```bash
# Run all tests (Week 1 + Week 2)
npm test

# Run only Week 2 tests
npm run test:week2

# Run day-by-day tests
npm run test:day1   # Day 1: Projects & Roles
npm run test:day2   # Day 2: Tasks, Priorities & Subtasks
npm run test:day3   # Day 3: Kanban & Alternative Controls
npm run test:day4   # Day 4: Search, Filters & Tenant Boundaries
npm run test:day5   # Day 5: Edge Cases & Security Sanitization
```

---

## 5. Key Architecture Principles

1. **Strict Multi-Tenant Isolation:**
   - Every project and task record is scoped to an `orgId`.
   - Users from Organization A cannot view, mutate, or probe records from Organization B. Cross-tenant queries return `404 Not Found` to prevent entity enumeration.

2. **Role-Based Access Control (RBAC):**
   - **Owner:** Full administrative power over organization, projects, and tasks.
   - **Manager:** Create and manage projects, assign tasks, review boards, view reports.
   - **Employee:** View assigned projects, create tasks within projects, update task statuses, manage subtasks and comments. Forbidden from creating projects or accessing unassigned restricted projects.

3. **Kanban Accessibility:**
   - Provides both visual drag-and-drop operations and accessible keyboard/select fallback controls (`moveKanbanAccessible`) for screen readers and non-pointer navigation.

---

## 6. Daily Commit Discipline & Guidelines
As defined in Qveto Team Guidelines:
- Work strictly on branch `member-5-qa-docs`.
- Push incremental, tested work daily.
- Commit message prefixes:
  - `feat:` New features
  - `fix:` Bug fixes
  - `test:` QA tests & verification
  - `docs:` Documentation & checklists
  - `chore:` Configuration and setup
