/**
 * notificationService.js
 * Frontend service layer for Taskora In-App Notification Center.
 * Handles fetching, unread counting, marking as read, filtering, and real-time event dispatch.
 */

import { Storage } from './storage.js';

const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

export const notificationService = {
  /**
   * Get all notifications for the current user
   *
   * @param {Object} [user]
   * @param {Object} [filters] - { category, unreadOnly }
   * @returns {Promise<Array>}
   */
  async getNotifications(user, filters = {}) {
    await delay();
    const currentUser = user || Storage.getCurrentUser();
    if (!currentUser) return [];

    const allNotifications = Storage.getNotifications();
    const allUsers = Storage.getUsers();

    // Filter by organization and recipient (targeted to this user or broadcast)
    let userNotifs = allNotifications.filter(
      (n) =>
        n.orgId === currentUser.orgId &&
        (n.recipientId === currentUser.id || !n.recipientId)
    );

    // Filter by category
    if (filters.category && filters.category !== 'ALL') {
      userNotifs = userNotifs.filter((n) => n.type === filters.category);
    }

    // Filter by unread
    if (filters.unreadOnly) {
      userNotifs = userNotifs.filter((n) => !n.isRead);
    }

    // Sort newest first
    userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with actor profile
    return userNotifs.map((n) => {
      const actor = allUsers.find((u) => u.id === n.actorId) || null;
      return {
        ...n,
        actor,
      };
    });
  },

  /**
   * Get count of unread notifications for a user
   *
   * @param {Object} [user]
   * @returns {Promise<number>}
   */
  async getUnreadCount(user) {
    const currentUser = user || Storage.getCurrentUser();
    if (!currentUser) return 0;

    const allNotifications = Storage.getNotifications();
    return allNotifications.filter(
      (n) =>
        n.orgId === currentUser.orgId &&
        (n.recipientId === currentUser.id || !n.recipientId) &&
        !n.isRead
    ).length;
  },

  /**
   * Mark a single notification as read
   *
   * @param {string} notificationId
   * @param {Object} [user]
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId, user) {
    await delay(30);
    const currentUser = user || Storage.getCurrentUser();
    const allNotifications = Storage.getNotifications();
    const index = allNotifications.findIndex((n) => n.id === notificationId);

    if (index === -1) {
      const err = new Error('Notification not found');
      err.status = 404;
      throw err;
    }

    allNotifications[index] = {
      ...allNotifications[index],
      isRead: true,
      readAt: new Date().toISOString(),
    };

    Storage.setNotifications(allNotifications);
    return allNotifications[index];
  },

  /**
   * Mark all notifications as read for current user
   *
   * @param {Object} [user]
   * @returns {Promise<{success: boolean, updatedCount: number}>}
   */
  async markAllAsRead(user) {
    await delay(50);
    const currentUser = user || Storage.getCurrentUser();
    const allNotifications = Storage.getNotifications();

    let updatedCount = 0;
    const updated = allNotifications.map((n) => {
      if (
        n.orgId === currentUser.orgId &&
        (n.recipientId === currentUser.id || !n.recipientId) &&
        !n.isRead
      ) {
        updatedCount++;
        return {
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        };
      }
      return n;
    });

    Storage.setNotifications(updated);
    return { success: true, updatedCount };
  },

  /**
   * Add a new notification
   *
   * @param {Object} notificationData
   * @returns {Promise<Object>}
   */
  async addNotification(notificationData) {
    const allNotifications = Storage.getNotifications();

    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orgId: notificationData.orgId,
      recipientId: notificationData.recipientId,
      actorId: notificationData.actorId || null,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      taskId: notificationData.taskId || null,
      projectId: notificationData.projectId || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // Avoid duplicate unread alerts within 10 seconds for the same task and type
    const isDuplicate = allNotifications.some(
      (n) =>
        n.recipientId === newNotif.recipientId &&
        n.taskId === newNotif.taskId &&
        n.type === newNotif.type &&
        !n.isRead &&
        Math.abs(new Date(n.createdAt).getTime() - new Date(newNotif.createdAt).getTime()) < 10000
    );

    if (isDuplicate) {
      return null;
    }

    Storage.setNotifications([newNotif, ...allNotifications]);
    return newNotif;
  },
};

