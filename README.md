# Qveto — Project Management & Team Collaboration SaaS

[![QA Tests](https://img.shields.io/badge/QA%20Tests-172%20Passed%20%7C%200%20Failed-brightgreen)](docs/final-test-report.md)
[![Multi-Tenant Isolation](https://img.shields.io/badge/Multi--Tenant%20Isolation-100%25%20Verified-blue)](docs/organization-isolation-evidence.md)
[![Role-Based Access](https://img.shields.io/badge/RBAC-Owner%20%7C%20Manager%20%7C%20Employee-orange)](docs/permission-matrix.md)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green)](package.json)

Qveto is an enterprise-grade multi-tenant SaaS application designed to help organizations plan projects, track tasks via interactive Kanban boards, collaborate in real time with threaded comments and secure file attachments, receive automated deadline and overdue alerts, and monitor team productivity via role-scoped analytics.

---

## 🏗️ Architecture & Technology Stack

```mermaid
graph TD
    Client["Client Layer (React 18 / Vite / Tailwind CSS / Lucide)"]
    API["API Gateway & Middleware Layer (Express.js / JWT Auth / Tenant Scoper / RBAC)"]
    Services["Core Service Layer"]
    Store["Data & Storage Layer"]

    Client -->|REST & Secure Headers| API
    API --> Services

    subgraph Core Services
        AuthSvc["AuthService (Session / Token / Profile)"]
        ProjSvc["ProjectService (Projects / Workspaces / Teams)"]
        TaskSvc["TaskService (CRUD / Kanban / Subtasks / Filters)"]
        CollabSvc["Collaboration (Comments / Attachments / Notifications)"]
        ReportSvc["ReportService (KPIs / Progress / Workload)"]
    end

    Services --> AuthSvc
    Services --> ProjSvc
    Services --> TaskSvc
    Services --> CollabSvc
    Services --> ReportSvc

    subgraph Persistence & File Storage
        Postgres[("PostgreSQL / Prisma ORM & Relational DB")]
        InMemDB[("In-Memory Hermetic Test Harness (mockDb)")]
        SecureFiles["Private Tenant-Partitioned File Storage (storage/:orgId/:projId)"]
    end

    Services --> Postgres
    Services --> InMemDB
    Services --> SecureFiles
```

### Technology Matrix
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Drag-and-Drop Kanban with accessible keyboard navigation fallback.
- **Backend:** Node.js, Express.js (REST API, multi-tenant scoping middleware, unified error handling).
- **Database & Persistence:** PostgreSQL with Prisma ORM (production schema & migrations); relational in-memory store (`backend/src/data/mockDb.js`) for reproducible hermetic automated testing.
- **Authentication & RBAC:** Session & token-based authentication with bcrypt password hashing; role-based access control (`OWNER`, `MANAGER`, `EMPLOYEE`).
- **File Storage:** Private, tenant-partitioned local storage (`storage/:orgId/:projectId/:file`) with extension whitelist, 10MB limit, and path-traversal prevention. Direct public downloads are blocked.
- **Notifications & Overdue Engine:** In-app notification center, 5-minute cooldown deduplication, date boundary alert detection, and transparently simulated email transport.
- **Productivity Analytics & Reporting:** Real-time KPI calculations (Project Progress, Task Completion Rate, On-Time Completion Rate, Overdue Count, Assignment Coverage, Workload Distribution) and exportable Markdown reports.
- **Testing:** Node.js native test runner (`node --test`), featuring **172 automated tests** across **36 test suites** with 100% pass rate.

---

## 📁 Repository Structure

```
├── backend/
│   ├── config/          # Central configuration & Prisma client
│   ├── controllers/     # Route controllers (users, orgs, projects, tasks)
│   ├── middleware/      # Auth, multi-tenancy, RBAC, validators, error handler
│   ├── prisma/          # Prisma schema, migrations, and seed data
│   ├── routes/          # REST route modules (/api/auth, /api/users, /api/projects, etc.)
│   ├── src/             # Core modular service layer (projects, tasks, collaboration, analytics)
│   │   ├── analytics/   # ReportService & KPI calculation engine
│   │   ├── auth/        # AuthService (login, session, profile lookup)
│   │   ├── collaboration/ # CommentService, AttachmentService, NotificationService
│   │   ├── data/        # Multi-tenant in-memory test store & synthetic seeds
│   │   ├── projects/    # ProjectService & membership RBAC
│   │   └── tasks/       # TaskService & Kanban stage transitions
│   └── tests/           # Backend integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components, Kanban boards, auth modules, modals
│   │   ├── pages/       # LandingPage, LoginPage, Dashboard, Projects, Tasks, Reports
│   │   └── App.jsx      # Root routing & state provider
│   └── package.json
├── docs/                # Comprehensive SRS, ERD, Security, Bug List, QA reports, Demo checklist
└── tests/               # Automated QA test suites (Member 5 organized)
    ├── frontend/        # Frontend architecture & logic tests (45 tests)
    ├── week1/           # Authentication & RBAC foundation tests (16 tests)
    ├── week2/           # Projects, tasks, Kanban & filter tests (47 tests)
    ├── week3/           # Comments, attachments, notifications & security tests (49 tests)
    └── week4/           # Full workflow, two-org isolation & final regression (15 tests)
```

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Feature / Action | Owner | Manager | Employee | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Manage Organization Settings** | ✅ Yes | ❌ No | ❌ No | Owner exclusive |
| **Invite & Remove Team Members** | ✅ Yes | ❌ No | ❌ No | Owner exclusive |
| **Create New Project** | ✅ Yes | ✅ Yes | ❌ No | Employees cannot create projects (HTTP 403) |
| **View Projects** | ✅ All Org | ✅ All Org | 🔍 Assigned Only | Employees only see projects where they are assigned |
| **Delete Project** | ✅ Yes | ❌ No | ❌ No | Owner exclusive |
| **Create Task** | ✅ Yes | ✅ Yes | ✅ Assigned Proj | Scoped to authorized projects |
| **Update Kanban Status** | ✅ Yes | ✅ Yes | ✅ Yes | Drag-and-drop or accessible keyboard controls |
| **Post Comments** | ✅ Yes | ✅ Yes | ✅ Assigned Proj | HTML/XSS sanitized, 2000 char limit |
| **Delete Comments** | ✅ Any Org | ✅ Any Org | 👤 Own Only | Author can delete own; Manager/Owner can moderate |
| **Upload / Download Files** | ✅ Yes | ✅ Yes | ✅ Assigned Proj | Authenticated session required; 10MB limit |
| **View Executive Reports** | ✅ Org-wide | ✅ Org-wide | 🔍 Assigned Proj | Employees restricted to assigned project analytics |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Node.js version 18.0.0 or higher
- npm (Node Package Manager)
- PostgreSQL (optional, for persistent production database; in-memory store is included for testing/demo)

### 1. Repository Installation
```bash
git clone https://github.com/Micromax1978/Qveto-Project-Management-Saas.git
cd Qveto-Project-Management-Saas
git switch member-5-qa-docs
npm install
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables (.env)
# DATABASE_URL="postgresql://user:password@localhost:5432/qveto_db?schema=public"
# JWT_SECRET="your_secure_jwt_secret"
# PORT=5000

# Apply migrations & seed demo data (if PostgreSQL is configured)
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts

# Start backend server
node server.js
```
The backend API starts on `http://localhost:5000` (or configured `PORT`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The client web portal starts on `http://localhost:5173`.

---

## 🧪 Automated Testing Suite

Qveto includes **172 automated tests across 36 test suites**, executing natively without external test runner bloat.

### Execute All Tests
```bash
# Run the entire automated test suite (172 tests, 100% pass)
npm test
```

### Execute Milestone Suites
```bash
# Week 1: Auth & RBAC
npm run test:week1

# Week 2: Projects, Tasks & Kanban
npm run test:week2

# Week 3: Collaboration, Attachments, Notifications & Boundary Security
npm run test:week3

# Week 4: Full End-to-End Workflow, Two-Organization Isolation & Final QA
npm run test:week4

# Frontend Logic & Architecture Tests
npm run test:frontend
```

### Execute Week 4 Day-by-Day Tests
```bash
npm run test:w4-day1   # Day 1: Full User Journey Workflow
npm run test:w4-day2   # Day 2: Two-Organization Strict Isolation Proof
npm run test:w4-day3   # Day 3: Final System Integration & Regression
```

---

## 🔒 Multi-Tenant Two-Organization Isolation Proof

A critical requirement of the Qveto SaaS platform is strict tenant partitioning:
- **Organization A (`org_acme_corp`):** Acme Corporation
- **Organization B (`org_beta_tech`):** Beta Technologies
- **HTTP 404 Masking Strategy:** Attempting to query, mutate, delete, or comment on any cross-tenant ID returns **`HTTP 404 Not Found`** rather than `403 Forbidden`, preventing ID enumeration attacks.
- **Proof & Evidence:** See [`docs/organization-isolation-evidence.md`](docs/organization-isolation-evidence.md) for full attack vector results, logs, and verification tables.

---

## ⚠️ Known Limitations & Future Roadmap

In the spirit of honest engineering and analytical rigor (per universal standards):
1. **Simulated Email Transport:** Email notifications are safely logged and simulated (`isSimulated: true`); production requires an active transactional provider (SendGrid / AWS SES).
2. **WebSocket Real-Time Updates:** Live Kanban synchronization currently uses reliable polling and optimistic client state; production roadmap introduces WebSocket rooms.
3. **Local Private File Storage:** Attachments are currently stored on tenant-partitioned local storage with strict authentication gates; production roadmap introduces S3/GCS pre-signed private URLs.

See [`docs/limitations.md`](docs/limitations.md) for the complete honest limitations document and future improvement plan.

---

## 📚 Master Documentation Directory

- [Final Comprehensive Test Report](docs/final-test-report.md)
- [Two-Organization Isolation Evidence](docs/organization-isolation-evidence.md)
- [System Limitations & Future Improvements](docs/limitations.md)
- [Demonstration Checklist for Evaluators](docs/demo-checklist.md)
- [Technical Presentation & Viva Slides](docs/presentation.md)
- [Software Requirements Specification (SRS)](docs/requirements.md)
- [Role Permission Matrix](docs/permission-matrix.md)
- [Security Checklist & Compliance Matrix](docs/security-checklist.md)
- [Bug Tracking & Retest Evidence Log](docs/bug-list.md)
- [Data Relationships & ER Architecture](docs/data-relationships.md)
- [User Journeys](docs/user-journeys.md)
- [Week 3 Executive Report](docs/week-3-report.md)
- [Week 2 Executive Report](docs/week-2-report.md)
- [Setup & Environment Guide](docs/setup-guide.md)
