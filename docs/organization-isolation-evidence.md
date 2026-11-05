# Two-Organization Multi-Tenant Isolation Evidence

**Project:** Qveto Technologies — Project Management & Team Collaboration SaaS  
**Author:** Member 5 (Requirements, Testing, Documentation and QA)  
**Date:** Week 4  
**Status:** **VERIFIED & PASSING (Zero Data Leakage Across Tenants)**  

---

## 1. Executive Summary

A core requirement of enterprise SaaS platforms is **airtight multi-tenant data isolation**. Under no circumstance should a user belonging to **Organization A** be able to view, tamper with, enumerate, or mutate resources belonging to **Organization B**.

This document provides formal verification and concrete test evidence proving that Qveto's multi-tenant architecture enforces strict data isolation at the backend service and authorization layers across all domain resources:
1. **Projects & Workspaces**
2. **Tasks, Subtasks & Kanban Board**
3. **Task Comments & Collaboration Threads**
4. **File Attachments & Download Streams**
5. **In-App Notifications & Alerts**
6. **Analytics, KPIs & Executive Summaries**
7. **User Directory & Identity Lookups**

---

## 2. Test Fixture Setup

Two completely distinct organizations were initialized in the database with separate memberships, roles, projects, tasks, comments, and attachments:

| Attribute | Organization A (Acme Corp) | Organization B (Beta Tech) | Isolation Status |
| :--- | :--- | :--- | :--- |
| **Organization ID** | `org_acme_corp` | `org_beta_tech` | Strictly Partitioned |
| **Organization Name** | Acme Corporation | Beta Technologies | Isolated |
| **Owner Account** | Alice (`alice@acme.com`) | Eve (`eve@beta.com`) | Independent Credentials |
| **Manager Account** | Bob (`bob@acme.com`) | N/A | Org-scoped |
| **Developer Account**| Charlie (`charlie@acme.com`) | Frank (`frank@beta.com`) | Org-scoped |
| **Active Projects** | `proj_acme_web`, `proj_acme_mobile` | `proj_beta_crm` | Zero Cross-Visibility |
| **Sample Tasks** | `task_1`, `task_2`, `task_3`, `task_4` | `task_beta_1` | Zero Cross-Visibility |
| **Sample Comments** | `comment_1` | `comment_beta_1` | Zero Cross-Visibility |
| **Sample Attachments**| `att_1` (schema-architecture-v1.pdf)| `att_beta_1` (beta-contract.pdf)| Tenant Storage Paths |

---

## 3. ID Tampering & Cross-Tenant Attack Evidence

The test suite executed deliberate ID tampering attacks where authenticated users of Organization B attempted to access or mutate IDs belonging to Organization A, and vice versa.

### 3.1 HTTP Response Strategy: HTTP 404 Masking
Rather than returning `HTTP 403 Forbidden` (which would confirm that a resource exists under that ID and leak confidential metadata), Qveto strictly returns **`HTTP 404 Not Found`** whenever an ID does not belong to the caller's organization. This neutralizes ID enumeration and snooping attacks.

### 3.2 Concrete Attack Vectors & Results Table

| Test Case | Attack Description | Actor | Target ID / Resource | Expected Behavior | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ISO-01** | Cross-tenant project read | Eve (Org B Owner) | `proj_acme_web` | HTTP 404 Masking | `404: Project not found` | **PASS** |
| **TC-ISO-01** | Cross-tenant project read | Alice (Org A Owner) | `proj_beta_crm` | HTTP 404 Masking | `404: Project not found` | **PASS** |
| **TC-ISO-01** | Project list scoping | Eve (Org B Owner) | List endpoint | Only Org B projects | Exactly 1 project (`proj_beta_crm`) | **PASS** |
| **TC-ISO-02** | Cross-tenant task read | Frank (Org B Dev) | `task_1` (Acme) | HTTP 404 Masking | `404: Task not found` | **PASS** |
| **TC-ISO-02** | Cross-tenant task update | Frank (Org B Dev) | `task_1` (Acme) | HTTP 404 Masking | `404: Task not found` | **PASS** |
| **TC-ISO-02** | Cross-tenant Kanban move | Eve (Org B Owner) | `task_1` (Acme) | HTTP 404 Masking | `404: Task not found` | **PASS** |
| **TC-ISO-02** | Trojan task injection | Eve (Org B Owner) | Insert into `proj_acme_web` | HTTP 404 Masking | `404: Project not found in your org`| **PASS** |
| **TC-ISO-03** | Cross-tenant comments read | Frank (Org B Dev) | `task_1` comments | HTTP 404 Masking | `404: Task not found` | **PASS** |
| **TC-ISO-03** | Unauthorized comment inject| Eve (Org B Owner) | `task_1` (Acme) | HTTP 404 Masking | `404: Task not found` | **PASS** |
| **TC-ISO-03** | Comment deletion tampering | Bob (Org A Manager)| `comment_beta_1` | HTTP 404 Masking | `404: Comment not found` | **PASS** |
| **TC-ISO-04** | Private attachment theft | Eve (Org B Owner) | `att_1` (Acme PDF) | HTTP 404 Masking | `404: Attachment not found` | **PASS** |
| **TC-ISO-04** | Private attachment theft | Alice (Org A Owner)| `att_beta_1` (Beta PDF)| HTTP 404 Masking | `404: Attachment not found` | **PASS** |
| **TC-ISO-04** | Malicious attachment upload| Frank (Org B Dev) | `task_1` (Acme) | HTTP 404 Masking | `404: Task not found` | **PASS** |
| **TC-ISO-05** | Notification inbox leak | Eve (Org B Owner) | Org A alerts | Zero Org A alerts | Filtered strictly to `org_beta_tech`| **PASS** |
| **TC-ISO-05** | Cross-tenant mark-as-read | Eve (Org B Owner) | `notif_1` (Acme) | HTTP 404 Masking | `404: Notification not found` | **PASS** |
| **TC-ISO-06** | KPI report snooping | Eve (Org B Owner) | `proj_acme_web` KPIs | HTTP 404 Masking | `404: Project not found` | **PASS** |
| **TC-ISO-06** | Executive summary isolation| Eve (Org B Owner) | Org metrics | Only Org B metrics | Acme tasks = 0, Beta tasks = 1 | **PASS** |
| **TC-ISO-07** | Directory harvest attack | Alice (Org A Owner)| `user_external_emp` | HTTP 404 Masking | `404: User not found` | **PASS** |

---

## 4. Execution Logs Evidence

```bash
$ node --test tests/week4/day2-two-org-isolation.test.js

▶ Week 4 - Day 2: Two-Organization Strict Isolation & ID Tampering Tests
  ✔ TC-ISO-01: Cross-organization project access and mutation returns 404 (3.2635ms)
  ✔ TC-ISO-02: Cross-organization task query and mutation returns 404 (1.8932ms)
  ✔ TC-ISO-03: Cross-organization comment reading and creation returns 404 (1.3307ms)
  ✔ TC-ISO-04: Cross-organization attachment download and upload returns 404 (1.3978ms)
  ✔ TC-ISO-05: Notifications are strictly partitioned between organizations (1.1298ms)
  ✔ TC-ISO-06: Cross-organization reporting and executive analytics returns 404 (1.5147ms)
  ✔ TC-ISO-07: Cross-organization user lookup is masked with 404 (0.7477ms)
✔ Week 4 - Day 2: Two-Organization Strict Isolation & ID Tampering Tests (13.4755ms)

ℹ tests 7
ℹ suites 1
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 377.8019
```

---

## 5. Architectural Proof: How Isolation is Guaranteed

1. **Mandatory Tenant Context (`user.orgId`):**
   Every single backend service method (`ProjectService`, `TaskService`, `CommentService`, `AttachmentService`, `NotificationService`, `ReportService`) requires an authenticated `user` object carrying the verified `user.orgId`.
2. **Server-Side Predicate Filtering:**
   Database queries filter not only by target resource ID, but also by `resource.orgId === user.orgId`:
   ```javascript
   const task = db.tasks.find(t => t.id === taskId && t.orgId === user.orgId);
   if (!task) {
     throw { status: 404, message: 'Task not found' };
   }
   ```
3. **Partitioned Storage Paths:**
   File attachments are stored in directories named after the organization ID (`storage/:orgId/:projectId/:fileName`), preventing cross-tenant file collision or path traversal.
4. **Zero Reliance on Client Trust:**
   The client application never dictates tenant boundaries. The server always reads the caller's organization from the validated session token.

---

## 6. Conclusion
The automated test evidence confirms that **Organization A (Acme Corp)** and **Organization B (Beta Tech)** operate in complete mutual isolation. Cross-tenant tampering is fully defended and results in zero data leakage.
