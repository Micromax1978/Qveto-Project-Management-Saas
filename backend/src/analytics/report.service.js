/**
 * report.service.js
 * Business logic and KPI calculations for Project Management & Team Collaboration SaaS.
 * 
 * Implements standard KPI definitions specified in Project 2 Requirements:
 * - Project Progress: Completed non-archived tasks / all non-archived tasks
 * - Task Completion Rate: Completed eligible tasks / total eligible tasks
 * - On-time Completion Rate: Tasks completed on or before due date / tasks completed with valid due dates
 * - Overdue Task Count: Open tasks with due date < current timestamp
 * - Assignment Coverage: Tasks with an assigned owner / total active tasks
 * - Workload Distribution: Per-member task allocation across statuses
 * 
 * Strict multi-tenant data isolation and role permissions enforced.
 */

const { getDb } = require('../data/mockDb');

class ReportService {
  /**
   * Helper to validate user authentication and project authorization
   */
  static _authorizeProjectAccess(projectId, user) {
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized: missing authentication or organization context' };
    }

    const db = getDb();
    const project = db.projects.find(p => p.id === projectId);

    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    // Multi-tenant boundary: mask existence across tenants
    if (project.orgId !== user.orgId) {
      throw { status: 404, message: 'Project not found' };
    }

    // Role-based authorization: Employees must be project members
    if (user.role === 'EMPLOYEE' && (!project.members || !project.members.includes(user.id))) {
      throw { status: 403, message: 'Forbidden: you are not authorized to view reports for this project' };
    }

    return project;
  }

  /**
   * Calculate Project Progress
   * Formula: Completed non-archived tasks / all non-archived tasks * 100
   * Also computes subtask-weighted progress
   */
  static calculateProjectProgress(projectId, user, options = {}) {
    const project = this._authorizeProjectAccess(projectId, user);
    const db = getDb();

    // Active non-archived tasks for this project & organization
    const tasks = db.tasks.filter(t => t.projectId === projectId && t.orgId === user.orgId && t.status !== 'ARCHIVED');

    const totalTasks = tasks.length;
    if (totalTasks === 0) {
      return {
        projectId,
        projectName: project.name,
        totalTasks: 0,
        completedTasks: 0,
        progressPercentage: 0,
        subtaskWeightedProgress: 0,
        status: project.status
      };
    }

    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

    // Subtask weighted calculation
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    tasks.forEach(t => {
      if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
        totalSubtasks += t.subtasks.length;
        completedSubtasks += t.subtasks.filter(s => s.isCompleted).length;
      } else {
        // If no subtasks, task counts as 1 atomic subtask unit
        totalSubtasks += 1;
        if (t.status === 'DONE') completedSubtasks += 1;
      }
    });

    const subtaskWeightedProgress = totalSubtasks > 0 
      ? Math.round((completedSubtasks / totalSubtasks) * 100) 
      : progressPercentage;

    return {
      projectId,
      projectName: project.name,
      totalTasks,
      completedTasks,
      progressPercentage,
      subtaskWeightedProgress,
      status: project.status
    };
  }

  /**
   * Calculate Core KPIs for a Project
   */
  static getProjectKPIs(projectId, user, options = {}) {
    const project = this._authorizeProjectAccess(projectId, user);
    const db = getDb();
    const referenceTime = options.currentTime ? new Date(options.currentTime) : new Date();

    const tasks = db.tasks.filter(t => t.projectId === projectId && t.orgId === user.orgId && t.status !== 'ARCHIVED');
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return {
        projectId,
        projectName: project.name,
        totalTasks: 0,
        completionRate: 0,
        onTimeCompletionRate: 100, // No late completions
        overdueTaskCount: 0,
        assignmentCoverage: 100,
        statusBreakdown: { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 },
        priorityBreakdown: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
      };
    }

    // 1. Task Completion Rate
    const completedTasks = tasks.filter(t => t.status === 'DONE');
    const completionRate = Math.round((completedTasks.length / totalTasks) * 100);

    // 2. On-Time Completion Rate
    // Formula: Tasks completed on or before due date / tasks completed with valid due dates
    const completedWithDueDate = completedTasks.filter(t => t.dueDate);
    let onTimeCompletionRate = 100;
    if (completedWithDueDate.length > 0) {
      const onTimeCount = completedWithDueDate.filter(t => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt).getTime() <= new Date(t.dueDate).getTime();
      }).length;
      onTimeCompletionRate = Math.round((onTimeCount / completedWithDueDate.length) * 100);
    }

    // 3. Overdue Task Count
    // Formula: Open tasks (status != 'DONE') where dueDate < referenceTime
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'DONE') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate).getTime() < referenceTime.getTime();
    });

    // 4. Assignment Coverage
    // Formula: Tasks with assigned owner / total active tasks
    const assignedTasks = tasks.filter(t => Boolean(t.assigneeId));
    const assignmentCoverage = Math.round((assignedTasks.length / totalTasks) * 100);

    // 5. Status Breakdown
    const statusBreakdown = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      REVIEW: tasks.filter(t => t.status === 'REVIEW').length,
      DONE: completedTasks.length
    };

    // 6. Priority Breakdown
    const priorityBreakdown = {
      LOW: tasks.filter(t => t.priority === 'LOW').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter(t => t.priority === 'HIGH').length,
      URGENT: tasks.filter(t => t.priority === 'URGENT').length
    };

    return {
      projectId,
      projectName: project.name,
      totalTasks,
      completedCount: completedTasks.length,
      completionRate,
      onTimeCompletionRate,
      overdueTaskCount: overdueTasks.length,
      overdueTaskIds: overdueTasks.map(t => t.id),
      assignmentCoverage,
      statusBreakdown,
      priorityBreakdown
    };
  }

  /**
   * Get Team Workload and Productivity Breakdown for a Project
   */
  static getTeamWorkload(projectId, user) {
    this._authorizeProjectAccess(projectId, user);
    const db = getDb();
    const referenceTime = new Date();

    const tasks = db.tasks.filter(t => t.projectId === projectId && t.orgId === user.orgId && t.status !== 'ARCHIVED');
    const orgUsers = db.users.filter(u => u.orgId === user.orgId);

    const workloadMap = {};

    tasks.forEach(task => {
      const assigneeKey = task.assigneeId || 'unassigned';
      if (!workloadMap[assigneeKey]) {
        const u = orgUsers.find(user => user.id === assigneeKey);
        workloadMap[assigneeKey] = {
          userId: assigneeKey,
          userName: u ? u.name : 'Unassigned',
          totalAssigned: 0,
          openTasks: 0,
          completedTasks: 0,
          overdueTasks: 0
        };
      }

      workloadMap[assigneeKey].totalAssigned += 1;
      if (task.status === 'DONE') {
        workloadMap[assigneeKey].completedTasks += 1;
      } else {
        workloadMap[assigneeKey].openTasks += 1;
        if (task.dueDate && new Date(task.dueDate).getTime() < referenceTime.getTime()) {
          workloadMap[assigneeKey].overdueTasks += 1;
        }
      }
    });

    return Object.values(workloadMap);
  }

  /**
   * Organization-wide Executive Analytics (OWNER or MANAGER only)
   */
  static getOrganizationExecutiveSummary(user) {
    if (!user || !user.orgId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      throw { status: 403, message: 'Forbidden: executive summary is restricted to Owners and Managers' };
    }

    const db = getDb();
    const org = db.organizations.find(o => o.id === user.orgId);
    if (!org) {
      throw { status: 404, message: 'Organization not found' };
    }

    const projects = db.projects.filter(p => p.orgId === user.orgId);
    const tasks = db.tasks.filter(t => t.orgId === user.orgId && t.status !== 'ARCHIVED');
    const users = db.users.filter(u => u.orgId === user.orgId);
    const comments = db.comments.filter(c => c.orgId === user.orgId);
    const attachments = db.attachments.filter(a => a.orgId === user.orgId);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const activeTasks = totalTasks - completedTasks;
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate).getTime() < now.getTime()).length;

    return {
      organizationId: org.id,
      organizationName: org.name,
      totalProjects: projects.length,
      totalMembers: users.length,
      totalTasks,
      activeTasks,
      completedTasks,
      overdueTasks,
      overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalCollaborationEvents: comments.length + attachments.length,
      projectsOverview: projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        taskCount: tasks.filter(t => t.projectId === p.id).length
      }))
    };
  }

  /**
   * Generate Markdown / Text Report for Export
   */
  static exportReportMarkdown(projectId, user) {
    const kpis = this.getProjectKPIs(projectId, user);
    const progress = this.calculateProjectProgress(projectId, user);
    const workload = this.getTeamWorkload(projectId, user);

    let md = `# Project Analytics Report: ${kpis.projectName}\n\n`;
    md += `- **Project ID:** ${projectId}\n`;
    md += `- **Generated For:** ${user.name} (${user.role})\n`;
    md += `- **Generated At:** ${new Date().toISOString()}\n\n`;

    md += `## Key Performance Indicators\n`;
    md += `| Metric | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Project Progress** | ${progress.progressPercentage}% |\n`;
    md += `| **Subtask-Weighted Progress** | ${progress.subtaskWeightedProgress}% |\n`;
    md += `| **Task Completion Rate** | ${kpis.completionRate}% (${kpis.completedCount}/${kpis.totalTasks}) |\n`;
    md += `| **On-Time Completion Rate** | ${kpis.onTimeCompletionRate}% |\n`;
    md += `| **Overdue Task Count** | ${kpis.overdueTaskCount} |\n`;
    md += `| **Assignment Coverage** | ${kpis.assignmentCoverage}% |\n\n`;

    md += `## Task Status Distribution\n`;
    md += `- **TODO:** ${kpis.statusBreakdown.TODO}\n`;
    md += `- **IN_PROGRESS:** ${kpis.statusBreakdown.IN_PROGRESS}\n`;
    md += `- **REVIEW:** ${kpis.statusBreakdown.REVIEW}\n`;
    md += `- **DONE:** ${kpis.statusBreakdown.DONE}\n\n`;

    md += `## Team Workload\n`;
    md += `| Member | Total Assigned | Open Tasks | Completed | Overdue |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    workload.forEach(w => {
      md += `| ${w.userName} | ${w.totalAssigned} | ${w.openTasks} | ${w.completedTasks} | ${w.overdueTasks} |\n`;
    });

    return md;
  }
}

module.exports = ReportService;
