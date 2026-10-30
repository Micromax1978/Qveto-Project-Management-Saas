# Qveto SaaS — Project Progress Calculation Formula Specification

**Document Version:** 1.0.0  
**Author:** Member 1 (Database & Analytics Developer)  
**Target Milestone:** Week 4 — Project Analytics  
**Branch:** `Database-Analytics`  

---

## 1. Overview & Objective

In modern SaaS project management, accurate progress reporting is vital for managers, stakeholders, and team members to gauge completion trajectory without distortions.

The assignment specification defines the project completion calculation formula as:

$$\text{Progress Percentage} = \left(\frac{\text{Completed Tasks}}{\text{All Tasks} - \text{Cancelled Tasks}}\right) \times 100$$

This document establishes the mathematical rules, status classifications, edge-case handling, and implementation constraints to ensure 100% consistent behavior across both the **Node.js/Express backend** and the **React/Vite frontend**.

---

## 2. Status Classification Matrix

Based on the canonical `TaskStatus` database enum defined in `backend/prisma/schema.prisma`:

```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}
```

The 5 task statuses map to analytic categories as follows:

| Database Status | Analytic Category | Counts as Completed? | Counts in Denominator (Eligible)? | Counts in Remaining Tasks? |
|---|---|---|---|---|
| `DONE` | Completed | **Yes** | **Yes** | No |
| `TODO` | Unfinished (Backlog) | No | **Yes** | **Yes** |
| `IN_PROGRESS` | Unfinished (Active) | No | **Yes** | **Yes** |
| `IN_REVIEW` | Unfinished (Review) | No | **Yes** | **Yes** |
| `CANCELLED` | Cancelled (Voided) | No | **No (Excluded)** | No |

---

## 3. Definitions & Core Rules

### 3.1 What counts as a Completed Task
A task is counted as **Completed** if and only if its current database status is `DONE`.

### 3.2 What counts as an Unfinished Task (Remaining Tasks)
A task is counted as **Unfinished / Remaining** if it is still part of the active project scope awaiting final completion. This strictly includes:
$$\text{Remaining Tasks} = \text{Tasks}_{TODO} + \text{Tasks}_{IN\_PROGRESS} + \text{Tasks}_{IN\_REVIEW}$$

### 3.3 How Cancelled Tasks are Excluded
Tasks with status `CANCELLED` represent work that was intentionally removed from project scope (e.g. abandoned features, duplicate requests, superseded tasks).
- Cancelled tasks are **excluded** from the denominator ($\text{All Tasks} - \text{Cancelled Tasks}$).
- Cancelled tasks **do not** count as completed, nor do they penalize the team by inflating the denominator.
- They are tracked separately in status metrics (`cancelledTasks`) for audit transparency.

### 3.4 Treatment of Archived Tasks
The current application architecture and database schema do not contain an `ARCHIVED` status. In compliance with architectural requirements, an artificial `ARCHIVED` status is not introduced. Should project or task archiving be implemented in future quarters, archived tasks will be partitioned out of active progress calculations.

### 3.5 Handling Projects with Zero Eligible Tasks
When a project has no eligible tasks (i.e. $\text{Eligible Tasks} \le 0$):
- **Scenario A:** A brand-new project with 0 total tasks.
- **Scenario B:** A project where 100% of tasks are `CANCELLED`.

In both scenarios, naive division would result in $\frac{0}{0}$, producing `NaN` or `Infinity` and crashing UI components.

**Specification Rule:**
$$\text{If } (\text{All Tasks} - \text{Cancelled Tasks}) \le 0 \implies \text{Progress Percentage} = 0$$

### 3.6 Rounding Rules
- Progress is computed as a floating-point number, multiplied by 100, and rounded to the nearest integer using standard mathematical rounding (`Math.round`).
- The returned progress percentage is strictly clamped between `0` and `100`.

---

## 4. Worked Calculation Examples

### Example 1: Standard Active Project
- **Total Tasks:** 10
- **Breakdown:** 4 `DONE`, 2 `IN_PROGRESS`, 2 `TODO`, 2 `CANCELLED`
- **Calculation:**
  - $\text{Eligible Tasks} = 10 - 2 = 8$
  - $\text{Completed Tasks} = 4$
  - $\text{Remaining Tasks} = 2 + 2 = 4$
  - $\text{Progress} = \left(\frac{4}{8}\right) \times 100 = 50\%$

### Example 2: Project with High Velocity
- **Total Tasks:** 7
- **Breakdown:** 5 `DONE`, 1 `IN_REVIEW`, 0 `IN_PROGRESS`, 0 `TODO`, 1 `CANCELLED`
- **Calculation:**
  - $\text{Eligible Tasks} = 7 - 1 = 6$
  - $\text{Completed Tasks} = 5$
  - $\text{Remaining Tasks} = 1$
  - $\text{Progress} = \text{round}\left(\frac{5}{6} \times 100\right) = \text{round}(83.333...) = 83\%$

### Example 3: Project with Only Cancelled Tasks
- **Total Tasks:** 3
- **Breakdown:** 0 `DONE`, 0 `IN_PROGRESS`, 0 `TODO`, 3 `CANCELLED`
- **Calculation:**
  - $\text{Eligible Tasks} = 3 - 3 = 0$
  - $\text{Denominator} \le 0 \implies \text{Progress} = 0\%$ (Division by zero safely prevented)
  - $\text{Remaining Tasks} = 0$

### Example 4: Empty Backlog Project
- **Total Tasks:** 0
- **Breakdown:** All statuses 0
- **Calculation:**
  - $\text{Eligible Tasks} = 0$
  - $\text{Progress} = 0\%$
  - $\text{Remaining Tasks} = 0$

### Example 5: 100% Completed Project
- **Total Tasks:** 5
- **Breakdown:** 4 `DONE`, 1 `CANCELLED`
- **Calculation:**
  - $\text{Eligible Tasks} = 5 - 1 = 4$
  - $\text{Completed Tasks} = 4$
  - $\text{Progress} = \left(\frac{4}{4}\right) \times 100 = 100\%$
  - $\text{Remaining Tasks} = 0$

---

## 5. Architectural Implementation Contract

### Backend Utility Implementation:
```javascript
function calculateProjectProgress(tasks = []) {
    const totalTasks = tasks.length;
    let completedTasks = 0;
    let todoTasks = 0;
    let inProgressTasks = 0;
    let inReviewTasks = 0;
    let cancelledTasks = 0;

    for (const task of tasks) {
        switch (task.status) {
            case "DONE":
                completedTasks++;
                break;
            case "TODO":
                todoTasks++;
                break;
            case "IN_PROGRESS":
                inProgressTasks++;
                break;
            case "IN_REVIEW":
            case "REVIEW":
                inReviewTasks++;
                break;
            case "CANCELLED":
                cancelledTasks++;
                break;
            default:
                todoTasks++;
                break;
        }
    }

    const eligibleTasks = totalTasks - cancelledTasks;
    const remainingTasks = todoTasks + inProgressTasks + inReviewTasks;
    const completionPercentage = eligibleTasks > 0
        ? Math.min(100, Math.max(0, Math.round((completedTasks / eligibleTasks) * 100)))
        : 0;

    return {
        totalTasks,
        completedTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        cancelledTasks,
        remainingTasks,
        eligibleTasks,
        completionPercentage
    };
}
```

This specification will govern all backend analytics services, API controllers, seed verification checks, and frontend UI components.
