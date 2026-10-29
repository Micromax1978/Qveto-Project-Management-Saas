/**
 * taskService.js
 * Frontend task service layer for Task & Kanban workflow operations.
 * Implements CRUD, status transitions, drag-and-drop state, subtask progress,
 * and multi-criteria filtering with multi-tenant data safety.
 */

import { Storage } from './storage.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../constants/status.js';
import { Permissions } from '../constants/roles.js';

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

    // Validate status
    const status = data.status || 'TODO';
    if (!TASK_STATUSES[status]) {
      const error = new Error(`Invalid status '${status}'`);
      error.status = 400;
      throw error;
    }

    const allTasks = Storage.getTasks();
    const taskNumber = allTasks.length + 101;

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskCode: `TSK-${taskNumber}`,
      orgId: currentUser.orgId,
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      status,
      priority,
      orderIndex: 0,
      assigneeId: data.assigneeId || null,
      createdById: currentUser.id,
      dueDate: data.dueDate || null,
      labels: Array.isArray(data.labels) ? data.labels.map((l) => l.toLowerCase().trim()) : [],
      subtasks: Array.isArray(data.subtasks)
        ? data.subtasks.map((st, i) => ({
            id: st.id || `sub_${Date.now()}_${i}`,
            title: st.title.trim(),
            isCompleted: Boolean(st.isCompleted),
          }))
        : [],
      createdAt: new Date().toISOString(),
      completedAt: status === 'DONE' ? new Date().toISOString() : null,
    };

    const updated = [newTask, ...allTasks];
    Storage.setTasks(updated);

    return {
      ...newTask,
      subtaskProgress: calculateSubtaskProgress(newTask.subtasks),
    };
  },

  /**
   * Update task fields
   */
  async updateTask(taskId, updates, user) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();
    const allTasks = Storage.getTasks();
    const index = allTasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    const task = allTasks[index];
    if (task.orgId !== currentUser.orgId) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    if (updates.title !== undefined) {
      if (!updates.title || !updates.title.trim()) {
        const error = new Error('Task title cannot be empty');
        error.status = 400;
        throw error;
      }
      task.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      task.description = updates.description.trim();
    }

    if (updates.status !== undefined) {
      if (!TASK_STATUSES[updates.status]) {
        const error = new Error(`Invalid status '${updates.status}'`);
        error.status = 400;
        throw error;
      }
      task.status = updates.status;
      if (updates.status === 'DONE') {
        task.completedAt = task.completedAt || new Date().toISOString();
      } else {
        task.completedAt = null;
      }
    }

    if (updates.priority !== undefined) {
      if (!TASK_PRIORITIES[updates.priority]) {
        const error = new Error(`Invalid priority '${updates.priority}'`);
        error.status = 400;
        throw error;
      }
      task.priority = updates.priority;
    }

    if (updates.assigneeId !== undefined) {
      task.assigneeId = updates.assigneeId || null;
    }

    if (updates.dueDate !== undefined) {
      task.dueDate = updates.dueDate || null;
    }

    if (updates.labels !== undefined && Array.isArray(updates.labels)) {
      task.labels = updates.labels.map((l) => l.toLowerCase().trim());
    }

    if (updates.subtasks !== undefined && Array.isArray(updates.subtasks)) {
      task.subtasks = updates.subtasks;
    }

    if (updates.orderIndex !== undefined) {
      task.orderIndex = updates.orderIndex;
    }

    task.updatedAt = new Date().toISOString();
    allTasks[index] = { ...task };
    Storage.setTasks(allTasks);

    return {
      ...task,
      subtaskProgress: calculateSubtaskProgress(task.subtasks),
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
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.orgId !== currentUser.orgId) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    const filtered = allTasks.filter((t) => t.id !== taskId);
    Storage.setTasks(filtered);

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
};
