/**
 * taskService.js
 * Frontend task service layer for Task & Kanban workflow operations.
 * Implements CRUD, status transitions, drag-and-drop state, subtask progress,
 * and multi-criteria filtering with multi-tenant data safety.
 */

import { Storage } from './storage.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../constants/status.js';
import { Permissions } from '../constants/roles.js';
import * as api from './api.js';

const delay = (ms = 70) => new Promise((resolve) => setTimeout(resolve, ms));

export function calculateSubtaskProgress(subtasks) {
  if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
    return 0;
  }
  const completed = subtasks.filter((s) => s.isCompleted).length;
  return Math.round((completed / subtasks.length) * 100);
}

export const taskService = {
  /**
   * List tasks with multi-criteria filtering
   */
  async listTasks(projectId, filters = {}, user) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();
    const allTasks = Storage.getTasks();

    let tasks = allTasks.filter((t) => t.orgId === currentUser.orgId);

    if (projectId) {
      tasks = tasks.filter((t) => t.projectId === projectId);
    }

    // Filter by status
    if (filters.status && filters.status !== 'ALL') {
      const targetStatus = filters.status.toUpperCase();
      tasks = tasks.filter((t) => t.status === targetStatus);
    }

    // Filter by priority
    if (filters.priority && filters.priority !== 'ALL') {
      const targetPriority = filters.priority.toUpperCase();
      tasks = tasks.filter((t) => t.priority === targetPriority);
    }

    // Filter by assignee
    if (filters.assigneeId && filters.assigneeId !== 'ALL') {
      if (filters.assigneeId === 'UNASSIGNED') {
        tasks = tasks.filter((t) => !t.assigneeId);
      } else {
        tasks = tasks.filter((t) => t.assigneeId === filters.assigneeId);
      }
    }

    // Filter by label
    if (filters.label && filters.label !== 'ALL') {
      const targetLabel = filters.label.toLowerCase();
      tasks = tasks.filter(
        (t) => t.labels && t.labels.some((l) => l.toLowerCase() === targetLabel)
      );
    }

    // Filter by overdue status
    if (filters.overdueOnly) {
      const today = new Date().toISOString().split('T')[0];
      tasks = tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'DONE');
    }

    // Search query in title or description
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      tasks = tasks.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.taskCode && t.taskCode.toLowerCase().includes(q))
      );
    }

    // Order by orderIndex or creation
    tasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return tasks.map((t) => ({
      ...t,
      subtaskProgress: calculateSubtaskProgress(t.subtasks),
    }));
  },

  /**
   * Get single task by ID
   */
  async getTaskById(taskId, user) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();
    const allTasks = Storage.getTasks();

    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.orgId !== currentUser.orgId) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    return {
      ...task,
      subtaskProgress: calculateSubtaskProgress(task.subtasks),
    };
  },

  /**
   * Create a new task
   */
  async createTask(data, user) {
    await delay(100);
    const currentUser = user || Storage.getCurrentUser();

    if (!data.title || !data.title.trim()) {
      const error = new Error('Task title is required');
      error.status = 400;
      throw error;
    }

    if (!data.projectId) {
      const error = new Error('Project ID is required');
      error.status = 400;
      throw error;
    }

    // Validate priority
    const priority = data.priority || 'MEDIUM';
    if (!TASK_PRIORITIES[priority]) {
      const error = new Error(`Invalid priority '${priority}'`);
      error.status = 400;
      throw error;
    }

    // Validate due date if provided
    let dueDate = data.dueDate || null;
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        const error = new Error('Invalid due date format');
        error.status = 400;
        throw error;
      }
      dueDate = parsed.toISOString().split('T')[0];
    }

    // Clean subtasks
    const subtasks = (data.subtasks || []).map((st, i) => ({
      id: st.id || `sub_${Date.now()}_${i}`,
      title: st.title.trim(),
      isCompleted: Boolean(st.isCompleted),
    }));

    // Clean labels
    const labels = (data.labels || [])
      .map((l) => (typeof l === 'string' ? l.trim() : l))
      .filter(Boolean);

    const allTasks = Storage.getTasks();
    const projectTasks = allTasks.filter(
      (t) => t.projectId === data.projectId && t.orgId === currentUser.orgId
    );

    const taskSeq = projectTasks.length + 1;
    const taskCode = `TSK-${String(taskSeq).padStart(3, '0')}`;

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskCode,
      orgId: currentUser.orgId,
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      status: data.status || TASK_STATUSES.TODO,
      priority,
      assigneeId: data.assigneeId || null,
      dueDate,
      labels,
      subtasks,
      orderIndex: projectTasks.length,
      createdById: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: data.status === TASK_STATUSES.DONE ? new Date().toISOString() : null,
    };

    allTasks.push(newTask);
    Storage.setTasks(allTasks);

    return {
      ...newTask,
      subtaskProgress: calculateSubtaskProgress(newTask.subtasks),
    };
  },

  /**
   * Update task details (title, description, priority, assignee, due date, subtasks, labels)
   */
  async updateTask(taskId, updates, user) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();
    const allTasks = Storage.getTasks();

    const index = allTasks.findIndex(
      (t) => t.id === taskId && t.orgId === currentUser.orgId
    );

    if (index === -1) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    const task = allTasks[index];

    // Validate priority if updating
    if (updates.priority && !TASK_PRIORITIES[updates.priority]) {
      const error = new Error(`Invalid priority '${updates.priority}'`);
      error.status = 400;
      throw error;
    }

    // Track status change for completion timestamp
    let completedAt = task.completedAt;
    if (updates.status) {
      if ((updates.status === 'DONE' || updates.status === TASK_STATUSES.DONE?.id) && task.status !== 'DONE') {
        completedAt = new Date().toISOString();
      } else if (updates.status !== 'DONE' && updates.status !== TASK_STATUSES.DONE?.id) {
        completedAt = null;
      }
    }

    // Validate due date if updating
    let dueDate = updates.dueDate !== undefined ? updates.dueDate : task.dueDate;
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        const error = new Error('Invalid due date format');
        error.status = 400;
        throw error;
      }
      dueDate = parsed.toISOString().split('T')[0];
    }

    // Clean subtasks if updating
    let subtasks = task.subtasks || [];
    if (updates.subtasks) {
      subtasks = updates.subtasks.map((st, i) => ({
        id: st.id || `sub_${Date.now()}_${i}`,
        title: st.title.trim(),
        isCompleted: Boolean(st.isCompleted),
      }));
    }

    const updatedTask = {
      ...task,
      ...updates,
      dueDate,
      subtasks,
      completedAt,
      updatedAt: new Date().toISOString(),
    };

    allTasks[index] = updatedTask;
    Storage.setTasks(allTasks);

    return {
      ...updatedTask,
      subtaskProgress: calculateSubtaskProgress(updatedTask.subtasks),
    };
  },

  /**
   * Reorder task within same column or across columns with orderIndex persistence
   */
  async reorderTask(taskId, { targetStatus, newIndex }, user) {
    await delay(120);
    const currentUser = user || Storage.getCurrentUser();
    const allTasks = Storage.getTasks();

    const task = allTasks.find(
      (t) => t.id === taskId && t.orgId === currentUser.orgId
    );

    if (!task) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    const prevStatus = task.status;
    const isStageChange = targetStatus && targetStatus !== prevStatus;
    const finalStatus = targetStatus || prevStatus;

    // Validate destination status
    if (!TASK_STATUSES[finalStatus]) {
      const error = new Error(`Invalid target status '${finalStatus}'`);
      error.status = 400;
      throw error;
    }

    // Manage completion timestamp
    let completedAt = task.completedAt;
    if ((finalStatus === 'DONE' || finalStatus === TASK_STATUSES.DONE?.id) && prevStatus !== 'DONE') {
      completedAt = new Date().toISOString();
    } else if (finalStatus !== 'DONE' && finalStatus !== TASK_STATUSES.DONE?.id) {
      completedAt = null;
    }

    // Extract all tasks in the destination column
    const otherTasksInTarget = allTasks
      .filter(
        (t) =>
          t.projectId === task.projectId &&
          t.orgId === currentUser.orgId &&
          t.id !== taskId &&
          t.status === finalStatus
      )
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    // Insert task at requested index
    const targetIdx =
      typeof newIndex === 'number'
        ? Math.max(0, Math.min(newIndex, otherTasksInTarget.length))
        : otherTasksInTarget.length;

    otherTasksInTarget.splice(targetIdx, 0, {
      ...task,
      status: finalStatus,
      completedAt,
      updatedAt: new Date().toISOString(),
    });

    // Reassign contiguous orderIndex for all cards in destination column
    const reindexedMap = new Map();
    otherTasksInTarget.forEach((t, idx) => {
      reindexedMap.set(t.id, { ...t, orderIndex: idx });
    });

    // Also reindex source column if stage changed
    if (isStageChange) {
      const sourceTasks = allTasks
        .filter(
          (t) =>
            t.projectId === task.projectId &&
            t.orgId === currentUser.orgId &&
            t.id !== taskId &&
            t.status === prevStatus
        )
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      sourceTasks.forEach((t, idx) => {
        reindexedMap.set(t.id, { ...t, orderIndex: idx });
      });
    }

    // Merge into storage
    const updatedAllTasks = allTasks.map((t) => {
      if (reindexedMap.has(t.id)) {
        return reindexedMap.get(t.id);
      }
      return t;
    });

    Storage.setTasks(updatedAllTasks);

    const saved = updatedAllTasks.find((t) => t.id === taskId);
    return {
      ...saved,
      subtaskProgress: calculateSubtaskProgress(saved.subtasks),
    };
  },

  /**
   * Quick status change (used by drag-and-drop & keyboard accessible selector)
   */
  async updateStatus(taskId, newStatus, user) {
    return this.updateTask(taskId, { status: newStatus }, user);
  },

  /**
   * Delete task (OWNER & MANAGER only)
   */
  async deleteTask(taskId, user) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();

    if (!Permissions.canDeleteTask(currentUser.role)) {
      const error = new Error('Forbidden: Only managers and organization owners can delete tasks');
      error.status = 403;
      throw error;
    }

    const allTasks = Storage.getTasks();
    const task = allTasks.find((t) => t.id === taskId && t.orgId === currentUser.orgId);

    if (!task) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    const remaining = allTasks.filter((t) => t.id !== taskId);
    Storage.setTasks(remaining);
    return { success: true };
  },

  /**
   * Subtask: Toggle status
   */
  async toggleSubtask(taskId, subtaskId, user) {
    const task = await this.getTaskById(taskId, user);
    const subtasks = (task.subtasks || []).map((st) => {
      if (st.id === subtaskId) {
        return { ...st, isCompleted: !st.isCompleted };
      }
      return st;
    });

    return this.updateTask(taskId, { subtasks }, user);
  },

  /**
   * Subtask: Add subtask
   */
  async addSubtask(taskId, title, user) {
    if (!title || !title.trim()) {
      throw new Error('Subtask title is required');
    }
    const task = await this.getTaskById(taskId, user);
    const newSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      isCompleted: false,
    };
    const subtasks = [...(task.subtasks || []), newSubtask];
    return this.updateTask(taskId, { subtasks }, user);
  },

  /**
   * Subtask: Delete subtask
   */
  async deleteSubtask(taskId, subtaskId, user) {
    const task = await this.getTaskById(taskId, user);
    const subtasks = (task.subtasks || []).filter((st) => st.id !== subtaskId);
    return this.updateTask(taskId, { subtasks }, user);
  },

  /**
   * Comments: List comments for task (oldest-first)
   */
  async listComments(taskId, user) {
    try {
      const res = await api.fetchTaskComments(taskId);
      return res.comments || [];
    } catch (e) {
      const currentUser = user || Storage.getCurrentUser();
      const allComments = Storage.getComments();
      return allComments
        .filter((c) => c.taskId === taskId && c.organizationId === currentUser.orgId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
  },

  /**
   * Comments: Add comment
   */
  async addComment(taskId, text, user) {
    if (!text || !text.trim()) {
      const err = new Error('Comment text cannot be empty');
      err.status = 400;
      throw err;
    }
    try {
      const comment = await api.createTaskComment(taskId, { text: text.trim() });
      return comment;
    } catch (e) {
      const currentUser = user || Storage.getCurrentUser();
      const allComments = Storage.getComments();
      const newComment = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        taskId,
        authorId: currentUser.id,
        organizationId: currentUser.orgId,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        author: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          initials: (currentUser.name || 'U').substring(0, 2).toUpperCase(),
        },
      };
      allComments.push(newComment);
      Storage.setComments(allComments);
      return newComment;
    }
  },

  /**
   * Comments: Delete comment
   */
  async deleteComment(commentId) {
    try {
      await api.deleteComment(commentId);
      return { success: true };
    } catch (e) {
      const allComments = Storage.getComments();
      const filtered = allComments.filter((c) => c.id !== commentId);
      Storage.setComments(filtered);
      return { success: true };
    }
  },
};
