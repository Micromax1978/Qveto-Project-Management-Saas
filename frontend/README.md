# TASKORA — Frontend Architecture & Production Guide
## Enterprise Project Management & Team Collaboration SaaS

**Version:** 4.0.0-PROD-READY  
**Technology Stack:** React 19, Tailwind CSS v4, Vite 8, React Router v7, Lucide Icons

---

## 1. Overview & Architecture

Taskora is a multi-tenant enterprise project management and collaboration web application. The frontend architecture is built on five modular layers:

```
┌────────────────────────────────────────────────────────┐
│                   App & Layout Shell                   │
│   (AppLayout, AppSidebar, AppHeader, ErrorBoundary)     │
├────────────────────────────────────────────────────────┤
│                   Routing & Auth Guards                │
│       (React Router v7, ProtectedRoute, RBAC Guards)   │
├────────────────────────────────────────────────────────┤
│                   State & Context Providers            │
│       (AuthContext, NotificationContext, ToastContext)  │
├────────────────────────────────────────────────────────┤
│                   Service & Storage Layer              │
│    (projectService, taskService, analyticsService,     │
│     commentService, attachmentService, teamService)     │
├────────────────────────────────────────────────────────┤
│                   Data Persistence Adapter             │
│        (storage.js: LocalStorage + Backend REST Sync)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Major Application Features

### Week 1 — Foundation & Administration
- **Authentication & RBAC:** Multi-tenant login, manager/employee signup, protected routes, and 403 Forbidden handling.
- **Organization & Workspaces:** Multi-tenant workspace management, active workspace switching, and organization profile configuration.
- **Team & Member Directory:** Department roster, real-time member search, role promotion (Owner-only), and member invitations with token generation.

### Week 2 — Project & Task Execution
- **Project Portfolio:** Project lifecycle, start/due dates, progress bars, and membership scoping.
- **Task Pipeline:** 4 workflow stages (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) with priority queues (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- **Kanban Board:** HTML5 drag-and-drop between columns with keyboard accessible stage selection.
- **Subtasks & Labels:** Nested checklist with progress percentage calculation and label tagging.
- **Employee "My Work":** Personal backlog dashboard filtered specifically to the logged-in user.

### Week 3 — Collaboration & Alerts
- **Task Comments:** Chronological thread with author identity, timestamps, edit indicator, and manager moderation.
- **File Attachments:** Secure dropzone rejecting dangerous executables (`.exe`, `.sh`, `.bat`) with 10MB limits.
- **Activity History:** Audit event timeline recording status transitions, subtasks, assignments, and attachments.
- **In-App Notifications:** Header bell popover with unread counter badge, mark-all-read action, and dedicated notification center.
- **Overdue Task Triage:** Relative date calculations with overdue badges and alert banners (DONE tasks immune).

### Week 4 — Analytics & Quality Assurance
- **Role-Based Analytics Dashboard (`/app/analytics`):**
  - **Organization (Owner):** Enterprise-wide velocity, project progress, cross-department status distribution, full team workload, and overdue exposure.
  - **Manager:** Managed project health, sprint velocity, assigned team workload, overdue items requiring triage.
  - **Employee:** Personal backlog performance, individual completion rate, on-time score, upcoming 7-day deadlines.
- **Accurate Metric Formulations:**
  - *Task Completion Rate:* Completed eligible tasks / total eligible tasks (`DONE` / non-`CANCELLED`).
  - *On-Time Completion Rate:* Completed on or before due date / completed with valid due dates.
  - *Overdue Task Count:* Open tasks with due date earlier than today.
  - *Project Progress:* Completed non-archived tasks / all non-archived tasks.
  - *Assignment Coverage:* Active tasks with assigned owner / total active tasks.
- **Interactive Visualizations:** Pure SVG Donut Chart, Project Progress Bars, Team Workload stacked charts, and Deadline Horizon cards.
- **Reporting & Filters:** Filter by Project, Date Range (7d, 30d, 90d, All Time), Status, Assignee, with CSV Report export.
- **Reliability:** Global React `ErrorBoundary`, `DataSyncStatus` concurrency indicator, and comprehensive empty states.

---

## 3. User Roles & Permission Model

| Action / Capability | Owner | Manager | Employee |
|---|:---:|:---:|:---:|
| Edit Organization Profile & Plan | Allowed | Denied | Denied |
| Create Workspaces & Departments | Allowed | Allowed | Denied |
| Invite Members & Generate Tokens | Allowed | Allowed | Denied |
| Modify Member Roles | Allowed | Denied | Denied |
| Create & Edit Projects | Allowed | Allowed | Denied |
| Delete Projects | Allowed | Denied | Denied |
| Create & Edit Tasks | Allowed | Allowed | Allowed |
| Move Kanban Cards | Allowed | Allowed | Allowed |
| Delete Tasks | Allowed | Allowed | Denied |
| View Organization Analytics | Full Org | Managed Scope | Personal Backlog |
| Upload & Download Attachments | Allowed | Allowed | Allowed |
| Moderate / Delete Others' Comments | Allowed | Allowed | Denied (Own only) |

---

## 4. Main Routes

| Route | View Component | Access Role | Description |
|---|---|---|---|
| `/` | `LandingPage.jsx` | Public | Marketing landing page and feature preview |
| `/login` | `LoginPage.jsx` | Public | Multi-role authentication interface |
| `/signup` | `SignupPage.jsx` | Public | Role selection and onboarding hub |
| `/unauthorized` | `UnauthorizedPage.jsx` | Authenticated | 403 Forbidden access boundary |
| `/app/overview` | `WorkspaceOverviewPage.jsx` | All Roles | Workspace health, KPIs, and capacity |
| `/app/projects` | `ProjectsPage.jsx` | All Roles | Projects portfolio grid and list |
| `/app/projects/:id` | `ProjectDetailPage.jsx` | Project Members | Kanban board, task list, and project overview |
| `/app/tasks` | `MyTasksPage.jsx` | All Roles | Personal assigned task queue |
| `/app/analytics` | `AnalyticsPage.jsx` | All Roles (Scoped) | Role-specific analytics, charts, and reports |
| `/app/team` | `TeamPage.jsx` | All Roles | Organization directory and departments |
| `/app/notifications`| `NotificationsPage.jsx` | All Roles | Dedicated notification management inbox |
| `/app/settings` | `SettingsPage.jsx` | All Roles | Org profile, workspaces, and RBAC matrix |

---

## 5. Development & Testing Commands

Execute commands inside `Qveto-Project-Management-Saas/`:

```bash
# Install root and frontend dependencies
npm install
cd frontend && npm install && cd ..

# Run automated test suites (116 unit & integration tests)
npm test

# Run frontend test suites specifically
node --test tests/frontend/*.test.js

# Run frontend development server (Vite with HMR on http://localhost:5173)
cd frontend && npm run dev

# Run Oxlint code inspection
cd frontend && npm run lint

# Compile production build
cd frontend && npm run build
```

---

## 6. Environment Configuration & Deployment

### Environment Variables (`frontend/.env.example`)
```env
# Application Meta
VITE_APP_NAME="TASKORA"
VITE_APP_TAGLINE="Plan Better. Work Smarter. Achieve More."

# Backend API Configuration
# When deployed to production, specify the backend URL (e.g., https://api.taskora.app)
# In development, Vite dev server proxies /api requests to http://localhost:5000
VITE_API_BASE_URL="/api"
```

### Vercel Deployment Configuration (`vercel.json`)
The application is pre-configured with SPA client-side route rewrites for seamless hosting on Vercel:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 7. Known Architectural Limitations & Boundaries

1. **In-App Notifications:** Real-time updates currently utilize reactive event dispatch and polling rather than persistent WebSockets or Server-Sent Events (SSE).
2. **Email Verification:** Email verification and password resets validate input UX and simulated OTP tokens in the client demo mode; transactional SMTP delivery requires backend mailer configuration.
3. **Storage Fallback:** The application uses an isolated local storage adapter (`storage.js`) with PostgreSQL schema parity to ensure full interactive demo capability when the backend server is offline.
4. **Direct File Storage:** Attachment uploads simulate local browser storage and validation; enterprise production deployments should connect presigned AWS S3 / GCS bucket URLs.
