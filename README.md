# Qveto — Project Management & Team Collaboration SaaS

A multi-tenant SaaS application designed to help organizations plan projects, track tasks on Kanban workflows, collaborate across teams, and enforce role-based access control.

---

## 🏗️ Architecture & Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js (REST API, multi-tenant middleware, unified error handling)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Authentication:** JWT (JSON Web Tokens), bcrypt password hashing, invitation codes, and RBAC (`OWNER`, `MANAGER`, `EMPLOYEE`)
- **Testing:** Node.js native test runner (`node --test`), 98 automated integration & security tests
- **Collaboration Services:** Comments, Secure File Attachments, In-App Notifications, Overdue Alerts

---

## 📁 Repository Structure

```
├── backend/
│   ├── config/          # Central configuration & Prisma client
│   ├── controllers/     # Route controllers (users, orgs, projects, tasks)
│   ├── middleware/      # Auth, multi-tenancy, RBAC, validators, error handler
│   ├── prisma/          # Prisma schema, migrations, and seed data
│   ├── routes/          # REST route modules (/api/auth, /api/users, /api/projects, etc.)
│   ├── src/             # Core modular service layer (projects, tasks, collaboration)
│   │   ├── auth/
│   │   ├── collaboration/ # Comments, file attachments, and notification services
│   │   ├── data/        # Multi-tenant in-memory test store & synthetic seeds
│   │   ├── projects/    # Project CRUD service & RBAC
│   │   └── tasks/       # Task lifecycle & Kanban services
│   └── tests/           # Automated integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components, Kanban boards, auth modules
│   │   ├── pages/       # LandingPage, LoginPage, Dashboard, Projects, Tasks
│   │   └── App.jsx      # Root routing & layout
│   └── package.json
├── docs/                # SRS, ERD, Security Checklist, QA reports & guides
└── tests/               # Automated QA test suites (Member 5 organized)
    ├── frontend/        # Frontend architecture & logic tests
    ├── week1/           # Authentication & RBAC foundation tests
    ├── week2/           # Projects, tasks & Kanban workflow tests
    └── week3/           # Collaboration, attachments, notifications & security tests
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment variables
# Copy .env.example or set DATABASE_URL and JWT_SECRET in backend/.env:
# PORT=5000
# DATABASE_URL="postgresql://user:password@localhost:5432/qveto_db?schema=public"
# JWT_SECRET="your_jwt_secret"

# Generate Prisma Client & apply migrations
npx prisma generate
npx prisma migrate deploy

# Seed demo data (optional)
npx tsx prisma/seed.ts
node seed-invitation.js

# Start backend server
node server.js
```
The backend API runs on `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The frontend application runs on `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the complete automated QA test suite (98 tests across Week 1, Week 2, and Week 3 with 100% pass rate):

```bash
# Run all tests (98 passing tests)
npm test

# Run Week 3 collaboration, attachments & security tests (41 tests)
npm run test:week3

# Run Week 3 day-by-day tests
npm run test:w3-day1   # Day 1: Comments & Payload Validation
npm run test:w3-day2   # Day 2: File Uploads & Whitelist
npm run test:w3-day3   # Day 3: Attachment Security & Download Headers
npm run test:w3-day4   # Day 4: Notifications, Overdue & Deduplication
npm run test:w3-day5   # Day 5: Tenant Boundaries & System Regression

# Run Week 2 tests
npm run test:week2

# Run Week 1 tests
npm run test:week1
```

Run backend integration tests:

```bash
cd backend
npm test
```

Build frontend for production:

```bash
cd frontend
npm run build
```

---

## 📚 Project Documentation

- [Software Requirements Specification (SRS)](docs/requirements.md)
- [Role Permission Matrix](docs/permission-matrix.md)
- [Data Relationships & ER Architecture](docs/data-relationships.md)
- [Security Checklist & Compliance Matrix](docs/security-checklist.md)
- [Bug Tracking & Fix Evidence Log](docs/bug-list.md)
- [Week 3 QA Test Checklist](docs/test-checklist-week3.md)
- [Week 3 QA Test Execution Results](docs/test-results-week3.md)
- [Week 3 Executive QA Report & Pull Request](docs/week-3-report.md)
- [Week 2 QA Test Checklist](docs/test-checklist-week2.md)
- [Week 2 QA Test Execution Results](docs/test-results-week2.md)
- [Week 2 Executive QA Report & Pull Request](docs/week-2-report.md)
- [Backend Setup & API Guide](docs/backend-setup.md)
- [Database Setup Guide](docs/database-setup.md)
- [Environment Setup Guide](docs/setup-guide.md)
- [Member 5 GitHub Upload & Workflow Guide](docs/github-upload-steps.md)
- [User Journeys](docs/user-journeys.md)
