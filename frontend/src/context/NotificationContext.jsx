import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { Storage } from '../services/storage';
import { isTaskOverdue } from '../utils/dateUtils';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      // Check for any overdue tasks assigned to current user and ensure overdue notification exists
      const allTasks = Storage.getTasks() || [];
      const myOverdueTasks = allTasks.filter(
        (t) => t.orgId === currentUser.orgId && t.assigneeId === currentUser.id && isTaskOverdue(t)
      );

      for (const t of myOverdueTasks) {
        await notificationService.addNotification({
          orgId: currentUser.orgId,
          recipientId: currentUser.id,
          actorId: null,
          type: 'TASK_OVERDUE',
          title: `Overdue Alert: ${t.taskCode || 'Task'}`,
          message: `"${t.title}" is overdue (deadline was ${t.dueDate}).`,
          taskId: t.id,
          projectId: t.projectId,
        });
      }

      const [list, count] = await Promise.all([
        notificationService.getNotifications(currentUser),
        notificationService.getUnreadCount(currentUser),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn('[NotificationContext] Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser, refreshNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId, currentUser);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(currentUser);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const addNotification = async (notifData) => {
    try {
      const created = await notificationService.addNotification(notifData);
      if (created && created.recipientId === currentUser?.id) {
        setNotifications((prev) => [created, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
      return created;
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
