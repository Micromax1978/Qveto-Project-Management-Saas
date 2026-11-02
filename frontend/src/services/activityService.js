/**
 * activityService.js
 * Frontend service layer for Task Activity History & Audit Timeline.
 * Tracks task lifecycle changes, assignments, status updates, and collaboration events.
 */

import { Storage } from './storage.js';

const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

export const activityService = {
  /**
   * Get all activity timeline events for a task
   *
   * @param {string} taskId
   * @param {Object} [user]
   * @returns {Promise<Array>}
   */
  async getActivities(taskId, user) {
    await delay();
    if (!taskId) return [];

    const currentUser = user || Storage.getCurrentUser();
    const allActivities = Storage.getActivities();
    const allUsers = Storage.getUsers();

    // Scope to current tenant organization and task ID, sorted reverse chronologically (newest first)
    const taskActivities = allActivities
      .filter((a) => a.taskId === taskId && a.orgId === currentUser.orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((a) => {
        const actor = allUsers.find((u) => u.id === a.userId) || {
          id: a.userId,
          name: 'System / Team Member',
          email: '',
          role: 'EMPLOYEE',
          avatar: null,
        };
        return {
          ...a,
          user: actor,
        };
      });

    return taskActivities;
  },

  /**
   * Log a new activity event for a task
   *
   * @param {string} taskId
   * @param {string} type - from ACTIVITY_TYPES
   * @param {string} description - Human-readable action description
   * @param {any} [oldValue]
   * @param {any} [newValue]
   * @param {Object} [user]
   * @returns {Promise<Object>}
   */
  async logActivity(taskId, type, description, oldValue = null, newValue = null, user) {
    const currentUser = user || Storage.getCurrentUser();
    if (!taskId) return null;

    const newActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      orgId: currentUser.orgId,
      userId: currentUser.id,
      type,
      description,
      oldValue,
      newValue,
      createdAt: new Date().toISOString(),
    };

    const allActivities = Storage.getActivities();
    Storage.setActivities([newActivity, ...allActivities]);

    return {
      ...newActivity,
      user: currentUser,
    };
  },
};

