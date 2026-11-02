/**
 * Analytics Service for Taskora
 * Provides mathematically accurate, role-aware metric computations,
 * status distributions, workload aggregations, and report exports.
 */

import { isTaskOverdue, getDeadlineStatus } from '../utils/dateUtils.js';

export const analyticsService = {
  /**
   * Filters a list of tasks and projects based on filter criteria and user role.
   *
   * @param {Array} tasks
   * @param {Array} projects
   * @param {Object} filters - { workspaceId, projectId, status, priority, assigneeId, dateRange }
   * @param {Object} currentUser - { id, role }
   * @returns {{ filteredTasks: Array, filteredProjects: Array }}
   */
  filterData(tasks = [], projects = [], filters = {}, currentUser = null) {
    let filteredProjects = [...projects];
    let filteredTasks = [...tasks];

    // 1. Role-based scoping
    if (currentUser?.role === 'EMPLOYEE') {
      // Employees see projects they are members of
      filteredProjects = filteredProjects.filter((p) =>
        (p.members || []).includes(currentUser.id)
      );
      // Employees only analyze tasks assigned to them
      filteredTasks = filteredTasks.filter(
        (t) => t.assigneeId === currentUser.id
      );
    } else if (currentUser?.role === 'MANAGER') {
      // Managers see projects they created or belong to
      // (or all org projects if permitted by org policy)
      filteredProjects = filteredProjects.filter(
        (p) =>
          p.createdById === currentUser.id ||
          (p.members || []).includes(currentUser.id) ||
          p.orgId === currentUser.orgId
      );
    }

    // 2. Project filter
    if (filters.projectId && filters.projectId !== 'ALL') {
      filteredTasks = filteredTasks.filter((t) => t.projectId === filters.projectId);
      filteredProjects = filteredProjects.filter((p) => p.id === filters.projectId);
    }

    // 3. Status filter
    if (filters.status && filters.status !== 'ALL') {
      filteredTasks = filteredTasks.filter((t) => t.status === filters.status);
    }

    // 4. Priority filter
    if (filters.priority && filters.priority !== 'ALL') {
      filteredTasks = filteredTasks.filter((t) => t.priority === filters.priority);
    }

    // 5. Assignee filter (Managers/Owners only)
    if (filters.assigneeId && filters.assigneeId !== 'ALL') {
      filteredTasks = filteredTasks.filter((t) => t.assigneeId === filters.assigneeId);
    }

    // 6. Date Range filter (created or due within range)
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let thresholdDays = 30;
      if (filters.dateRange === '7d') thresholdDays = 7;
      if (filters.dateRange === '30d') thresholdDays = 30;
      if (filters.dateRange === '90d') thresholdDays = 90;

      const cutoffTime = now.getTime() - thresholdDays * 24 * 60 * 60 * 1000;

      filteredTasks = filteredTasks.filter((t) => {
        const itemDate = t.createdAt ? new Date(t.createdAt).getTime() : 0;
        return itemDate >= cutoffTime;
      });
    }

    return { filteredTasks, filteredProjects };
  },

  /**
   * Computes formal Taskora analytics metrics.
   *
   * Formulations:
   * - Task Completion Rate: Completed eligible tasks / total eligible tasks
   * - On-Time Completion Rate: Tasks completed on or before due date / completed tasks with valid due date
   * - Overdue Task Count: Open tasks with due date earlier than current date
   * - Project Progress: Completed non-archived tasks / all non-archived tasks
   * - Assignment Coverage: Tasks with assigned owner / all active tasks
   */
  calculateMetrics(tasks = [], projects = [], referenceDate = new Date()) {
    const totalTasks = tasks.length;
    const eligibleTasks = tasks.filter((t) => t.status !== 'CANCELLED');
    const eligibleCount = eligibleTasks.length;

    const completedTasks = tasks.filter((t) => t.status === 'DONE');
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
    const inReviewTasks = tasks.filter((t) => t.status === 'IN_REVIEW');
    const todoTasks = tasks.filter((t) => t.status === 'TODO');

    // 1. Task Completion Rate
    const taskCompletionRate =
      eligibleCount > 0
        ? Math.round((completedTasks.length / eligibleCount) * 100)
        : 0;

    // 2. On-Time Completion Rate
    // Completed tasks that had a due date
    const completedWithDueDate = completedTasks.filter((t) => Boolean(t.dueDate));
    let onTimeCount = 0;
    completedWithDueDate.forEach((t) => {
      const dueStr = t.dueDate.includes('T') ? t.dueDate.split('T')[0] : t.dueDate;
      // If completedAt exists, check if it was on or before dueDate
      if (t.completedAt) {
        const completedStr = t.completedAt.split('T')[0];
        if (completedStr <= dueStr) onTimeCount++;
      } else {
        // Without specific completedAt, assume on-time if not marked overdue
        onTimeCount++;
      }
    });

    const onTimeCompletionRate =
      completedWithDueDate.length > 0
        ? Math.round((onTimeCount / completedWithDueDate.length) * 100)
        : 100; // If no tasks had due dates, defaults to 100%

    // 3. Overdue Task Count
    const overdueTasks = tasks.filter((t) => isTaskOverdue(t, referenceDate));
    const overdueCount = overdueTasks.length;

    // 4. Project Progress Aggregation
    const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

    const totalNonArchived = tasks.filter((t) => t.status !== 'ARCHIVED').length;
    const overallProjectProgress =
      totalNonArchived > 0
        ? Math.round((completedTasks.length / totalNonArchived) * 100)
        : 0;

    // 5. Assignment Coverage
    const activeTasks = tasks.filter(
      (t) => t.status !== 'ARCHIVED' && t.status !== 'CANCELLED'
    );
    const assignedTasks = activeTasks.filter((t) => Boolean(t.assigneeId));
    const assignmentCoverage =
      activeTasks.length > 0
        ? Math.round((assignedTasks.length / activeTasks.length) * 100)
        : 0;

    return {
      totalTasks,
      completedTasksCount: completedTasks.length,
      inProgressTasksCount: inProgressTasks.length,
      inReviewTasksCount: inReviewTasks.length,
      todoTasksCount: todoTasks.length,
      overdueCount,
      taskCompletionRate,
      onTimeCompletionRate,
      overallProjectProgress,
      assignmentCoverage,
      totalProjects: projects.length,
      activeProjectsCount: activeProjects.length,
      completedProjectsCount: completedProjects.length,
    };
  },

  /**
   * Returns task status breakdown with colors and percentage shares.
   */
  getStatusDistribution(tasks = []) {
    const total = tasks.length;
    const counts = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });

    const categories = [
      {
        key: 'TODO',
        label: 'To Do',
        count: counts.TODO,
        color: '#94a3b8', // slate-400
        bgClass: 'bg-slate-400',
        textClass: 'text-slate-600',
        percentage: total > 0 ? Math.round((counts.TODO / total) * 100) : 0,
      },
      {
        key: 'IN_PROGRESS',
        label: 'In Progress',
        count: counts.IN_PROGRESS,
        color: '#3b82f6', // blue-500
        bgClass: 'bg-blue-500',
        textClass: 'text-blue-600',
        percentage: total > 0 ? Math.round((counts.IN_PROGRESS / total) * 100) : 0,
      },
      {
        key: 'IN_REVIEW',
        label: 'In Review',
        count: counts.IN_REVIEW,
        color: '#a855f7', // purple-500
        bgClass: 'bg-purple-500',
        textClass: 'text-purple-600',
        percentage: total > 0 ? Math.round((counts.IN_REVIEW / total) * 100) : 0,
      },
      {
        key: 'DONE',
        label: 'Completed',
        count: counts.DONE,
        color: '#10b981', // emerald-500
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-600',
        percentage: total > 0 ? Math.round((counts.DONE / total) * 100) : 0,
      },
    ];

    return { total, categories, counts };
  },

  /**
   * Computes project completion statistics.
   */
  getProjectProgress(projects = [], tasks = [], referenceDate = new Date()) {
    return projects.map((p) => {
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const total = projTasks.length;
      const completed = projTasks.filter((t) => t.status === 'DONE').length;
      const inProgress = projTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const overdue = projTasks.filter((t) => isTaskOverdue(t, referenceDate)).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        remainingTasks: total - completed,
        overdueTasks: overdue,
        progress,
        dueDate: p.dueDate,
        membersCount: (p.members || []).length,
      };
    });
  },

  /**
   * Computes team workload distribution.
   */
  getTeamWorkload(users = [], tasks = [], referenceDate = new Date()) {
    return users.map((user) => {
      const userTasks = tasks.filter((t) => t.assigneeId === user.id);
      const total = userTasks.length;
      const completed = userTasks.filter((t) => t.status === 'DONE').length;
      const inProgress = userTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const pending = userTasks.filter((t) => t.status === 'TODO' || t.status === 'IN_REVIEW').length;
      const overdue = userTasks.filter((t) => isTaskOverdue(t, referenceDate)).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        user,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        pendingTasks: pending,
        overdueTasks: overdue,
        completionRate,
      };
    });
  },

  /**
   * Computes overdue task exposure and deadline proximity horizons.
   */
  getOverdueAndDeadlines(tasks = [], projects = [], users = [], referenceDate = new Date()) {
    const overdueTasks = [];
    const dueTodayTasks = [];
    const dueTomorrowTasks = [];
    const dueThisWeekTasks = [];

    tasks.forEach((t) => {
      const status = getDeadlineStatus(t, referenceDate);
      if (status.isOverdue) overdueTasks.push({ task: t, status });
      else if (status.isDueToday) dueTodayTasks.push({ task: t, status });
      else if (status.isDueTomorrow) dueTomorrowTasks.push({ task: t, status });
      else if (status.daysDifference !== null && status.daysDifference <= 7 && status.daysDifference > 1) {
        dueThisWeekTasks.push({ task: t, status });
      }
    });

    // Overdue by project
    const byProjectMap = {};
    overdueTasks.forEach(({ task }) => {
      const proj = projects.find((p) => p.id === task.projectId);
      const name = proj ? proj.name : 'Unassigned Project';
      byProjectMap[name] = (byProjectMap[name] || 0) + 1;
    });

    const overdueByProject = Object.entries(byProjectMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Overdue by assignee
    const byAssigneeMap = {};
    overdueTasks.forEach(({ task }) => {
      const user = users.find((u) => u.id === task.assigneeId);
      const name = user ? user.name : 'Unassigned';
      if (!byAssigneeMap[name]) {
        byAssigneeMap[name] = { user: user || null, count: 0 };
      }
      byAssigneeMap[name].count++;
    });

    const overdueByAssignee = Object.entries(byAssigneeMap).map(([name, data]) => ({
      name,
      user: data.user,
      count: data.count,
    }));

    return {
      overdueTasks,
      dueTodayTasks,
      dueTomorrowTasks,
      dueThisWeekTasks,
      overdueByProject,
      overdueByAssignee,
    };
  },

  /**
   * Exports filtered analytics dataset to CSV format for download.
   */
  generateCSVReport(metrics, tasks = [], projects = []) {
    const headers = [
      'Task ID',
      'Title',
      'Project',
      'Status',
      'Priority',
      'Assignee ID',
      'Due Date',
      'Is Overdue',
      'Subtasks Total',
      'Subtasks Done',
    ];

    const rows = tasks.map((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      const overdue = isTaskOverdue(t) ? 'YES' : 'NO';
      const subTotal = (t.subtasks || []).length;
      const subDone = (t.subtasks || []).filter((s) => s.isCompleted).length;

      return [
        t.taskCode || t.id,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(proj?.name || '').replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.assigneeId || 'Unassigned',
        t.dueDate || 'None',
        overdue,
        subTotal,
        subDone,
      ].join(',');
    });

    const summarySection = [
      '# TASKORA ANALYTICS & PRODUCTIVITY REPORT',
      `Generated At: ${new Date().toISOString()}`,
      `Total Tasks: ${metrics.totalTasks}`,
      `Completion Rate: ${metrics.taskCompletionRate}%`,
      `On-Time Rate: ${metrics.onTimeCompletionRate}%`,
      `Overdue Tasks: ${metrics.overdueCount}`,
      `Project Progress: ${metrics.overallProjectProgress}%`,
      `Assignment Coverage: ${metrics.assignmentCoverage}%`,
      '',
      headers.join(','),
      ...rows,
    ].join('\n');

    return summarySection;
  },

  /**
   * Triggers download of generated CSV report in browser.
   */
  downloadCSVReport(filename, csvContent) {
    if (typeof window === 'undefined') return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
