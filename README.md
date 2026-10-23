# Qveto — Project Management & Team Collaboration SaaS

A multi-tenant SaaS application designed to help organizations plan projects, track tasks on Kanban workflows, collaborate across teams, and enforce role-based access control.

---

## 🏗️ Architecture & Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js (REST API, multi-tenant middleware, unified error handling)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Authentication:** JWT (JSON Web Tokens), bcrypt password hashing, invitation codes, and RBAC (`OWNER`, `MANAGER`, `EMPLOYEE`)
- **Testing:** Node.js native test runner + Supertest

---

## 📁 Repository Structure

```
├── backend/
│   ├── config/          # Central configuration & Prisma client
│   ├── controllers/     # Route controllers (users, orgs, projects, tasks)
│   ├── middleware/      # Auth, multi-tenancy, RBAC, validators, error handler
│   ├── prisma/          # Prisma schema, migrations, and seed data
│   ├── routes/          # REST route modules (/api/auth, /api/users, /api/projects, etc.)
│   └── tests/           # Automated integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components, landing page sections, auth modules
│   │   ├── pages/       # LandingPage, LoginPage, SignupPage, etc.
│   │   └── App.jsx      # Root routing & layout
│   └── package.json
└── docs/                # Comprehensive SRS, ERD, setup & test documentation
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

Run backend integration tests (health check, API validation, tenant isolation, and authentication):

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

- [Backend Setup & API Guide](docs/backend-setup.md)
- [Database Setup Guide](docs/database-setup.md)
- [Software Requirements Specification (SRS)](docs/requirements.md)
- [User Journeys](docs/user-journeys.md)
- [Role Permission Matrix](docs/permission-matrix.md)
- [Test Cases (Initial)](docs/test-cases.md)
- [Data Relationships & ER Architecture](docs/data-relationships.md)
- [Week 2 QA Test Checklist](docs/test-checklist-week2.md)
- [Week 2 QA Test Execution Results](docs/test-results-week2.md)
- [Bug Tracking & Fix Evidence Log](docs/bug-list.md)
- [Week 2 Executive QA Report & Pull Request](docs/week-2-report.md)
- [Environment Setup Guide](docs/setup-guide.md)
- [Member 5 GitHub Upload & Workflow Guide](docs/github-upload-steps.md)