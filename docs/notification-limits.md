# Qveto Notification System, Overdue Engine & Limitations

**Author:** Member 4 (Backend APIs, Integration and Deployment)  
**System:** Qveto Technologies SaaS Platform  
**Target Module:** Activity Tracking, Notifications & Overdue Engine  
**Status:** Implemented, Tested, and Verified  

---

## 1. System Overview

The Week 3 delivery establishes the event recording, notification delivery, and overdue detection engine for the Qveto SaaS platform. This subsystem ensures team members stay informed of assignments, status transitions, comments, and project milestones while preventing duplicate notifications and strictly enforcing tenant isolation.

---

## 2. Notification Events & Triggers

| Event Type | Trigger Condition | Recipient | Deduplication Strategy |
|---|---|---|---|
| `TASK_ASSIGNED` | Task created or updated with a new `assigneeId` | Assigned user (suppressed if actor is assignee) | Key: `assigned:{taskId}:{userId}` |
| `TASK_STATUS_CHANGED` | Task status transitioned (via Kanban drag-and-drop or PATCH) | Assigned user | Suppressed if actor is assignee or status unchanged |
| `COMMENT_ADDED` | A new comment is posted on a task | Task assignee | Suppressed if comment author is assignee |
| `DUE_DATE_CHANGED` | Task due date is modified | Task assignee | Suppressed if actor is assignee or date unchanged |
| `TASK_OVERDUE` | Task `dueDate < nowUTC` and status NOT in (`DONE`, `CANCELLED`) | Task assignee | Daily Key: `overdue:{taskId}:{YYYY-MM-DD}` |

---

## 3. Overdue Detection & Agreed Timezone Rule

### 3.1 Agreed Timezone Standard: UTC (Coordinated Universal Time)
In agreement with Member 2 (Security & Architecture) and Member 1 (Database), all overdue calculations are evaluated strictly in **UTC (Coordinated Universal Time)**:

1. **Standardized Comparison:**
   $$\text{isOverdue} = (\text{task.dueDate} < \text{referenceDate}_{\text{UTC}}) \land (\text{task.status} \notin \{\text{DONE}, \text{CANCELLED}\})$$
2. **Deterministic Day Boundaries:**
   Daily date keys (`YYYY-MM-DD`) are derived using `toISOString().slice(0, 10)`, eliminating daylight saving time ambiguities and regional client offset disparities.
3. **Execution Options:**
   - On-demand via `POST /api/tasks/check-overdue` (called by background cron, scheduler, or administrative workers).
   - Read-only inspection via `GET /api/tasks/overdue` (with calculated `overdueDays` for dashboard badges).

---

## 4. Duplicate Notification Prevention (Day 4)

To prevent notification fatigue and spamming:
- **Daily Key Generation:** Overdue alerts use deduplication keys formatted as `overdue:{taskId}:{dateKey}`.
- **Unread Cooldown:** If an unread notification of the same type for the same task already exists in the user's inbox, duplicate dispatch is suppressed.
- **Atomic Dedup Database Index:** The `Notification` model enforces uniqueness across `[organizationId, userId, dedupKey]`, guaranteeing race condition protection at both database and service layers.

---

## 5. Multi-Tenant Security & User Isolation (Day 5)

- **Strict User Scoping:** `GET /api/notifications` returns records filtered by `organizationId = req.organizationId` AND `userId = req.userId`. Users can never inspect or modify notifications belonging to teammates.
- **Ownership Verification:** `PATCH /api/notifications/:id/read` and `DELETE /api/notifications/:id` return `404 Not Found` if the requested notification belongs to another user or another organization.
- **Fast Unread Counter:** `GET /api/notifications/unread-count` allows frontend header badges to query unread notifications efficiently without fetching full message payloads.

---

## 6. Email Delivery Status: SIMULATED (Day 6)

> [!IMPORTANT]
> **Email dispatch in Qveto SaaS is currently SIMULATED in memory.**
> Real external email delivery (via SMTP or transactional APIs like SendGrid, Resend, or AWS SES) is **NOT active** in this development phase.

### 6.1 Simulated Email Specifications:
- **Delivery Mechanism:** Whenever a qualifying notification event occurs, `emailService.sendSimulatedEmail()` formats the message and writes it to an in-memory test outbox (`simulatedOutbox`).
- **Console Audit Logging:** Every simulated dispatch outputs a standardized console record:
  ```text
  [SIMULATED EMAIL] To: user@example.com | Subject: "[Qveto] Task Assigned: TSK-101" | At: 2026-10-31T14:03:32Z
  ```
- **Audit Endpoint:** Automated integration test suites and QA engineers can inspect simulated outbox items via:
  ```http
  GET /api/notifications/simulated-emails
  ```
- **Production Transition Plan:**
  To connect live email sending in Week 4 deployment, replace the transport logic in `backend/services/emailService.js` with an SMTP/API provider (such as `@sendgrid/mail` or `resend`) using environment variable `EMAIL_API_KEY`.

---

## 7. Known Limits & Constraints

1. **Email Offline:** Emails are not sent to external mailboxes; all emails are captured in the in-memory simulated outbox.
2. **WebSocket Real-time:** In Week 3, notifications use polling and contextual refreshes (`GET /api/notifications`). Live WebSocket pushing can be configured in future sprints.
3. **Task Deletion Cascade:** When a task is deleted, associated activities and notifications have their `taskId` set to `NULL` (or cascade deleted), preserving system activity audit logs.
