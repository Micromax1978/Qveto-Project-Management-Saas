/**
 * commentService.js
 * Frontend service layer for Task Comments & Collaboration.
 * Handles comment CRUD operations, author permissions, optimistic state,
 * and integration with audit activity and notifications.
 */

import { Storage } from './storage.js';
import { Permissions } from '../constants/roles.js';
import { activityService } from './activityService.js';
import { notificationService } from './notificationService.js';

const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

export const commentService = {
  /**
   * List comments for a specific task in chronological order
   *
   * @param {string} taskId
   * @param {Object} [user]
   * @returns {Promise<Array>}
   */
  async getComments(taskId, user) {
    await delay();
    if (!taskId) return [];

    const currentUser = user || Storage.getCurrentUser();
    const allComments = Storage.getComments();
    const allUsers = Storage.getUsers();

    // Scope to tenant organization and task ID
    const taskComments = allComments
      .filter((c) => c.taskId === taskId && c.orgId === currentUser.orgId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((c) => {
        const commentUser = allUsers.find((u) => u.id === c.userId) || {
          id: c.userId,
          name: 'Team Member',
          email: '',
          role: 'EMPLOYEE',
          avatar: null,
        };
        return {
          ...c,
          user: commentUser,
        };
      });

    return taskComments;
  },

  /**
   * Add a new comment to a task
   *
   * @param {string} taskId
   * @param {string} content
   * @param {Object} [user]
   * @returns {Promise<Object>}
   */
  async addComment(taskId, content, user) {
    await delay(100);
    const currentUser = user || Storage.getCurrentUser();

    if (!taskId) {
      const err = new Error('Task ID is required');
      err.status = 400;
      throw err;
    }

    if (!content || !content.trim()) {
      const err = new Error('Comment content cannot be empty');
      err.status = 400;
      throw err;
    }

    if (!Permissions.canAddComment(currentUser.role)) {
      const err = new Error('Forbidden: You do not have permission to comment on this task');
      err.status = 403;
      throw err;
    }

    const allTasks = Storage.getTasks();
    const task = allTasks.find((t) => t.id === taskId && t.orgId === currentUser.orgId);
    if (!task) {
      const err = new Error('Task not found in this organization');
      err.status = 404;
      throw err;
    }

    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      orgId: currentUser.orgId,
      userId: currentUser.id,
      content: content.trim(),
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allComments = Storage.getComments();
    Storage.setComments([...allComments, newComment]);

    // Log Activity
    try {
      await activityService.logActivity(
        taskId,
        'COMMENT_ADDED',
        `commented: "${content.trim().substring(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
        null,
        newComment.id,
        currentUser
      );
    } catch (e) {
      console.warn('Activity logging error:', e);
    }

    // Trigger Notification to task assignee or creator (if not self)
    try {
      const targetUserId =
        task.assigneeId && task.assigneeId !== currentUser.id
          ? task.assigneeId
          : task.createdById && task.createdById !== currentUser.id
          ? task.createdById
          : null;

      if (targetUserId) {
        await notificationService.addNotification({
          orgId: currentUser.orgId,
          recipientId: targetUserId,
          actorId: currentUser.id,
          type: 'COMMENT_ADDED',
          title: `New Comment on ${task.taskCode || 'Task'}`,
          message: `${currentUser.name} commented: "${content.trim().substring(0, 80)}${
            content.trim().length > 80 ? '...' : ''
          }"`,
          taskId,
          projectId: task.projectId,
        });
      }
    } catch (e) {
      console.warn('Notification dispatch error:', e);
    }

    return {
      ...newComment,
      user: currentUser,
    };
  },

  /**
   * Edit an existing comment
   *
   * @param {string} commentId
   * @param {string} newContent
   * @param {Object} [user]
   * @returns {Promise<Object>}
   */
  async updateComment(commentId, newContent, user) {
    await delay(80);
    const currentUser = user || Storage.getCurrentUser();

    if (!newContent || !newContent.trim()) {
      const err = new Error('Comment content cannot be empty');
      err.status = 400;
      throw err;
    }

    const allComments = Storage.getComments();
    const commentIndex = allComments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }

    const comment = allComments[commentIndex];
    if (comment.orgId !== currentUser.orgId) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }

    if (!Permissions.canEditComment(currentUser.role, comment.userId, currentUser.id)) {
      const err = new Error('Forbidden: You can only edit your own comments');
      err.status = 403;
      throw err;
    }

    const updated = {
      ...comment,
      content: newContent.trim(),
      isEdited: true,
      updatedAt: new Date().toISOString(),
    };

    allComments[commentIndex] = updated;
    Storage.setComments(allComments);

    // Log Activity
    try {
      await activityService.logActivity(
        comment.taskId,
        'COMMENT_EDITED',
        'edited a comment',
        null,
        commentId,
        currentUser
      );
    } catch (e) {
      console.warn('Activity logging error:', e);
    }

    return {
      ...updated,
      user: currentUser,
    };
  },

  /**
   * Delete a comment
   *
   * @param {string} commentId
   * @param {Object} [user]
   * @returns {Promise<{success: boolean}>}
   */
  async deleteComment(commentId, user) {
    await delay(70);
    const currentUser = user || Storage.getCurrentUser();

    const allComments = Storage.getComments();
    const comment = allComments.find((c) => c.id === commentId);

    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }

    if (comment.orgId !== currentUser.orgId) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }

    if (!Permissions.canDeleteComment(currentUser.role, comment.userId, currentUser.id)) {
      const err = new Error('Forbidden: You do not have permission to delete this comment');
      err.status = 403;
      throw err;
    }

    const filtered = allComments.filter((c) => c.id !== commentId);
    Storage.setComments(filtered);

    // Log Activity
    try {
      await activityService.logActivity(
        comment.taskId,
        'COMMENT_DELETED',
        'removed a comment',
        null,
        null,
        currentUser
      );
    } catch (e) {
      console.warn('Activity logging error:', e);
    }

    return { success: true };
  },
};

