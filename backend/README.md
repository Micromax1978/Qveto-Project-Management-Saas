# Qveto – Backend API

Express 5 + Prisma 7 + PostgreSQL. Multi-tenant project management: organizations, projects, Kanban tasks, comments, attachments, notifications and analytics.

## Quick start

```bash
cd backend
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npx prisma migrate deploy     # apply all migrations
npm run seed:demo             # optional: sample organization
npm run dev                   # http://localhost:5000
```

Docker (API + PostgreSQL): `cp .env.example .env`, set `JWT_SECRET`, then `docker compose up --build` and `docker compose exec api node scripts/seed-demo.js`.

### Sample organization (`npm run seed:demo`)

Organization **Demo Organization**, project **Website Relaunch** with 6 tasks across all Kanban columns (one overdue), labels, subtasks, a comment and a notification. Password for every demo user: `Demo@12345`.

| Email | Role |
|---|---|
| manager@demo.qveto.test | manager |
| alice@demo.qveto.test | employee |
| bob@demo.qveto.test | employee |

Log in with `POST /api/auth/login` `{ "email", "password", "role" }`. Create invitation codes for new users with `npm run seed:invitations`.

## Roles and authorization

* Every request needs `Authorization: Bearer <jwt>`. After the token is verified, the user's **current** membership and role are loaded from the database on each request, so removing a member or changing a role takes effect immediately.
* **owner / manager**: create, update and delete projects; manage project members; see every project in the organization; re-open completed tasks; moderate comments and attachments; trigger the overdue scan.
* **employee**: sees only projects they are a member of; creates and edits tasks and subtasks there; comments and attaches files; can delete only tasks they created, and their own comments/attachments.
* Every query is scoped by `organizationId` and by project membership. A resource in another organization or project returns **404** (not 403) so IDs cannot be probed.
* Assignees must belong to the organization **and** the project. Removing a project member unassigns their tasks.

## API reference

All responses are JSON `{ status: "OK" | "ERROR", ... }`. Lists accept `page` and `pageSize`.

| Area | Endpoints |
|---|---|
| Health | `GET /api/health`, `GET /api/ready` |
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| Organization | `GET /api/organization`, `/members`, `/labels` · `GET/POST /api/workspaces` |
| Projects | `GET/POST /api/projects` · `GET/PATCH/DELETE /api/projects/:id` · `GET/POST /api/projects/:id/members` · `DELETE /api/projects/:id/members/:userId` · `GET /api/projects/:id/activity` |
| Tasks | `GET/POST /api/tasks` · `GET /api/tasks/overdue` · `GET/PATCH/DELETE /api/tasks/:id` |
| Kanban | `PATCH /api/tasks/:id/status` `{ status, position?, version? }` |
| Subtasks | `POST /api/tasks/:id/subtasks` · `PATCH/DELETE /api/tasks/:id/subtasks/:subtaskId` |
| Labels | `POST /api/tasks/:id/labels` `{ name, color? }` · `DELETE /api/tasks/:id/labels/:labelId` |
| Comments | `GET/POST /api/tasks/:id/comments` · `PATCH/DELETE /api/comments/:commentId` |
| Attachments | `GET/POST /api/tasks/:id/attachments` (multipart field `file`) · `GET /api/attachments/:id/download` · `DELETE /api/attachments/:id` |
| Activity | `GET /api/tasks/:id/activity`, `GET /api/projects/:id/activity` |
| Notifications | `GET /api/notifications[?unread=true]` · `GET /unread-count` · `PATCH /:id/read` · `PATCH /read-all` · `POST /scan-overdue` (manager) |
| Analytics | `GET /api/analytics/projects/:id` · `GET /api/analytics/overview` |

**Task filters** (`GET /api/tasks`): `projectId`, `status` and `priority` (comma-separated), `assigneeId` (`me`, `unassigned` or an id), `label`, `q` (title/description search), `overdue=true`, `dueBefore`, `dueAfter`, `sort` (`position|dueDate|createdAt|updatedAt|title`), `order`, `page`, `pageSize`.

**Enums**: status `TODO, IN_PROGRESS, REVIEW, DONE` · priority `LOW, MEDIUM, HIGH, URGENT` · subtask status `TODO, DONE`.

### Kanban and keyboard/accessibility fallback

`PATCH /api/tasks/:id/status` moves a card to a column and an index inside it (`position`, 0 = top); omit `position` to append. Other cards in the column are renumbered and the gap in the old column is closed. Because the API is plain "status + position", a UI can implement drag-and-drop **and** a non-drag fallback (a "Move to…" menu, or keyboard shortcuts for left/right = change status, up/down = change position) with the same call.

**Rule:** any column → any column, except that only owners/managers can move a task **out of DONE** (re-open).

### Concurrent updates

Every task has a `version`. Send the version you loaded in `PATCH /api/tasks/:id` or `/status`; if someone else changed the task meanwhile the API returns **409** with `code: "VERSION_CONFLICT"` and the UI should reload. If `version` is omitted the update is applied against the current version (last write wins), but is still atomic.

## Date, time and overdue rules

* Timestamps are stored and compared in **UTC**.
* A date-only due date (`2026-11-30`) means the **end of that day** (23:59:59.999 UTC). A full ISO timestamp is used as given; one without an offset is read as UTC.
* A task is **overdue** when `dueDate < now` **and** `status != DONE`. The API returns an `isOverdue` flag on every task.
* The scanner (`services/overdue.service.js`) runs every `OVERDUE_SCAN_INTERVAL_MS` (default 15 minutes; `0` disables it) and on `POST /api/notifications/scan-overdue`. It notifies the **assignee once** per task; changing the due date re-arms the alert. Unassigned tasks are shown as overdue but nobody is notified.

## Attachments

* Allowed: `png, jpg, jpeg, gif, webp, pdf, txt, csv, md, docx, xlsx, pptx`. Max **10 MB** per file, **20** per task.
* The file's real content must match its extension (magic bytes); renamed executables are rejected.
* Stored under `UPLOAD_DIR` (default `backend/storage/attachments`, outside any public folder) as `<orgId>/<random-uuid>.<ext>`. The client file name is only kept as metadata and is sanitized.
* Downloads only through `GET /api/attachments/:id/download`, which checks organization and project access on every request and sends `Content-Disposition: attachment` and `nosniff`.
* Files are deleted from disk when the attachment, task or project is deleted.

## Notifications and activity

* **Activity**: project/task events (created, updated, moved, assigned, commented, attached, member added/removed, overdue…) are stored and returned newest first.
* **In-app notifications**: assignment, status change, comment, attachment, project membership, overdue. The actor is never notified about their own action.
* **Email (optional, simulated)**: with `EMAIL_NOTIFICATIONS=true` messages are written to the log and `logs/email-outbox.log`; **no real email is sent**.

## Analytics

`GET /api/analytics/projects/:id` returns summary (total, done, open, overdue, due in 7 days, completion rate = done / total), counts by status and priority, per-member workload (open / overdue / done plus *Unassigned*), a 14-day completion trend and activity chart, and the 10 latest events. `GET /api/analytics/overview` aggregates every project the user can access.

## Testing

```bash
npm test            # unit tests, no database needed
```

API/integration tests run against a real PostgreSQL database and **create data in it – use a throwaway database**:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qveto_test?schema=public"
export JWT_SECRET="test-secret-test-secret"
npx prisma migrate deploy
npm run test:api    # or: npm run test:all
```

The GitHub Actions workflow `.github/workflows/backend-ci.yml` runs everything against a Postgres service container. The API tests cover authentication, role permissions, tenant isolation, validation, filters, Kanban moves, concurrent updates, subtasks/labels, comments, attachments (types, size, path traversal, unauthorized download), notifications, overdue detection, analytics and empty states.

## Deployment guide

1. Provision PostgreSQL 14+ and set `DATABASE_URL`.
2. Set `JWT_SECRET` (`openssl rand -hex 32`), `CORS_ORIGIN` (your frontend origin), `TRUST_PROXY=1` if behind a proxy/load balancer, and a persistent `UPLOAD_DIR` (volume) and `LOG_DIR`.
3. Build and run the image (`docker build -t qveto-api backend`); the container runs `prisma migrate deploy` then starts the server on `PORT` (default 5000).
4. Health checks: liveness `GET /api/health`, readiness `GET /api/ready`.
5. Errors are logged as JSON lines to stdout and to `logs/error.log`; every response carries an `X-Request-Id` that also appears in 500 responses and logs.

On a platform such as Render/Railway: build command `npm ci && npx prisma generate`, start command `npx prisma migrate deploy && node server.js`.

## Known limitations

* **No real-time updates**: the UI must poll or refresh (for example, poll `GET /api/notifications/unread-count`); there are no WebSockets.
* **Email is simulated** (see above).
* The overdue scanner and the rate limiter run **in-process**; with several API instances the scan is still safe (it claims each task atomically) but rate limits are per instance. Use a shared store/queue for scale.
* Attachments live on the local disk; use object storage (S3, etc.) and signed URLs for multi-server deployments. There is no virus scanning.
* Roles are per organization (`owner`/`manager`/`employee`); a user logs in with one role. There is no UI-level role switching, password reset or email verification.
* Kanban ordering is optimistic: concurrent moves in the same column are serialized by task version but not by column, so two simultaneous reorders can interleave (positions always stay valid).
* Migration note: labels were global before; the migration assigns each existing label to the organization of the first task using it and drops unused labels. If you have labels shared across organizations, review them after migrating.
