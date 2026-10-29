# Qveto Project Management SaaS - Setup & Testing Guide

**Document Owner:** Member 5 (QA & Docs) in collaboration with Member 4 (Setup & Base Server)  
**Target Audience:** Development Team, QA Testers, and Technical Mentors  

---

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v24.13.0)
- **Git**: Installed and configured
- **Database (Optional for mock tests)**: PostgreSQL 14+ or MySQL 8.0+

---

## 2. Quick Setup Instructions

### Step 1: Clone the repository & switch to Member 5 branch
```bash
git clone https://github.com/Micromax1978/Qveto-Project-Management-Saas.git
cd Qveto-Project-Management-Saas
git fetch --all
git switch member-5-qa-docs
```

### Step 2: Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```
Ensure `.env` contains valid local variables (defaults to in-memory mock testing if DB is not running).

---

## 3. Running Automated Tests

Member 5 has integrated the full QA test suite into the project scripts:

### Run All Test Suites (Week 1 & Week 2)
```bash
npm test
```
*Expected Output:*
```text
✔ Week 1 - Authentication & User Sessions
✔ Week 1 - Role Permissions Foundation
✔ Week 2 - Day 1: Project Management & Role Access Testing
✔ Week 2 - Day 2: Task Assignment, Priority, Due Dates, Subtasks & Labels
✔ Week 2 - Day 3: Kanban Board Workflows, Drag & Drop, Alternative Controls & Persistence
✔ Week 2 - Day 4: Search, Filters, Role Limits & Multi-Tenant Organization Limits
✔ Week 2 - Day 5: Empty Data, Invalid Data, Security Sanitization & Edge Cases
ℹ tests 39
ℹ pass 39
ℹ fail 0
```

### Run Day-Specific Tests
```bash
# Day 1: Project CRUD & Role Permissions
npm run test:day1

# Day 2: Tasks, Priority, Dates & Subtasks
npm run test:day2

# Day 3: Kanban Board & Alternative Controls
npm run test:day3

# Day 4: Search, Filters & Tenant Boundaries
npm run test:day4

# Day 5: Edge Cases & Security Sanitization
npm run test:day5
```

---

## 4. Manual Verification of Kanban Controls

### Testing Drag and Drop
1. Open the project Kanban board at `/projects/:id/board`.
2. Grab a task card with the mouse and drag it across columns (`TODO` -> `IN_PROGRESS`).
3. Notice immediate optimistic update in the UI.
4. Refresh the page: the task must remain in the new column and order position.

### Testing Accessible Alternative Control (Keyboard Users)
1. Select the task card using the `Tab` key.
2. Press `Alt + Right Arrow` or select the target stage from the "Move Stage" dropdown.
3. Observe the card moves instantly and persists upon page refresh.
