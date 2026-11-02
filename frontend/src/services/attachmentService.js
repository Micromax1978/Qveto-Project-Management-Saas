/**
 * attachmentService.js
 * Frontend service layer for Task File Attachments.
 * Enforces file size limits, MIME type/extension security boundaries,
 * upload progress callbacks, secure authorized downloads, and audit tracking.
 */

import { Storage } from './storage.js';
import { Permissions } from '../constants/roles.js';
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_LABEL,
  ALLOWED_EXTENSIONS,
  DISALLOWED_EXTENSIONS,
} from '../constants/collaboration.js';
import { activityService } from './activityService.js';
import { notificationService } from './notificationService.js';

const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validates a file before upload
 *
 * @param {File} file
 * @returns {{isValid: boolean, error: string|null}}
 */
export function validateAttachmentFile(file) {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  // Size limit
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the ${MAX_ATTACHMENT_SIZE_LABEL} limit. Selected file is ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'Empty files (0 bytes) cannot be uploaded.',
    };
  }

  // Extension check
  const ext = file.name.split('.').pop().toLowerCase();

  // Explicit security blocklist
  if (DISALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Security violation: Executable and script files (.${ext}) are strictly forbidden.`,
    };
  }

  // Whitelist check
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported file type (.${ext}). Allowed types: images (png, jpg, webp, svg), documents (pdf, docx, xlsx, pptx, txt, csv), json, zip.`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Formats bytes to readable size string
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const attachmentService = {
  /**
   * Get all attachments for a task
   *
   * @param {string} taskId
   * @param {Object} [user]
   * @returns {Promise<Array>}
   */
  async getAttachments(taskId, user) {
    await delay();
    if (!taskId) return [];

    const currentUser = user || Storage.getCurrentUser();
    const allAttachments = Storage.getAttachments();
    const allUsers = Storage.getUsers();

    return allAttachments
      .filter((a) => a.taskId === taskId && a.orgId === currentUser.orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((a) => {
        const uploader = allUsers.find((u) => u.id === a.userId) || {
          id: a.userId,
          name: 'Team Member',
          email: '',
          role: 'EMPLOYEE',
          avatar: null,
        };
        return {
          ...a,
          user: uploader,
        };
      });
  },

  /**
   * Upload an attachment to a task with progress feedback
   *
   * @param {string} taskId
   * @param {File} file
   * @param {Object} [user]
   * @param {Function} [onProgress] - callback(percent: number)
   * @returns {Promise<Object>}
   */
  async uploadAttachment(taskId, file, user, onProgress) {
    const currentUser = user || Storage.getCurrentUser();

    if (!taskId) {
      const err = new Error('Task ID is required');
      err.status = 400;
      throw err;
    }

    if (!Permissions.canUploadAttachment(currentUser.role)) {
      const err = new Error('Forbidden: You do not have permission to attach files');
      err.status = 403;
      throw err;
    }

    const validation = validateAttachmentFile(file);
    if (!validation.isValid) {
      const err = new Error(validation.error);
      err.status = 400;
      throw err;
    }

    const allTasks = Storage.getTasks();
    const task = allTasks.find((t) => t.id === taskId && t.orgId === currentUser.orgId);
    if (!task) {
      const err = new Error('Task not found in this organization');
      err.status = 404;
      throw err;
    }

    // Simulate upload progress
    if (onProgress) {
      onProgress(20);
      await delay(80);
      onProgress(60);
      await delay(80);
      onProgress(100);
      await delay(40);
    } else {
      await delay(120);
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Generate safe local object URL if browser File API is supported
    let dataUrl = null;
    try {
      if (typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
        dataUrl = window.URL.createObjectURL(file);
      }
    } catch (e) {
      console.warn('Could not create ObjectURL:', e);
    }

    const newAttachment = {
      id: attachmentId,
      taskId,
      orgId: currentUser.orgId,
      userId: currentUser.id,
      name: file.name,
      size: file.size,
      type: file.type || `application/${ext}`,
      extension: ext,
      localUrl: dataUrl,
      downloadUrl: `/api/attachments/${attachmentId}/download`,
      createdAt: new Date().toISOString(),
    };

    const allAttachments = Storage.getAttachments();
    Storage.setAttachments([newAttachment, ...allAttachments]);

    // Log Activity
    try {
      await activityService.logActivity(
        taskId,
        'ATTACHMENT_UPLOADED',
        `attached file "${file.name}" (${formatFileSize(file.size)})`,
        null,
        file.name,
        currentUser
      );
    } catch (e) {
      console.warn('Activity logging error:', e);
    }

    // Trigger Notification
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
          title: `File Attached to ${task.taskCode || 'Task'}`,
          message: `${currentUser.name} uploaded "${file.name}" to "${task.title}".`,
          taskId,
          projectId: task.projectId,
        });
      }
    } catch (e) {
      console.warn('Notification dispatch error:', e);
    }

    return {
      ...newAttachment,
      user: currentUser,
    };
  },

  /**
   * Securely download an authorized attachment
   *
   * @param {Object} attachment
   * @param {Object} [user]
   * @returns {Promise<void>}
   */
  async downloadAttachment(attachment, user) {
    const currentUser = user || Storage.getCurrentUser();

    if (!attachment) {
      throw new Error('Attachment reference is missing');
    }

    if (!Permissions.canDownloadAttachment(currentUser.role)) {
      const err = new Error('Forbidden: You are not authorized to download attachments');
      err.status = 403;
      throw err;
    }

    if (attachment.orgId && attachment.orgId !== currentUser.orgId) {
      const err = new Error('Forbidden: Attachment belongs to another tenant organization');
      err.status = 403;
      throw err;
    }

    // If local object URL exists, trigger download
    if (typeof window !== 'undefined' && window.document) {
      const downloadLink = document.createElement('a');
      let url = attachment.localUrl;

      if (!url) {
        // Fallback: create mock blob text content representing the authorized downloaded file
        const blob = new Blob(
          [`[Taskora Secure Vault File Content: ${attachment.name}]\nTask ID: ${attachment.taskId}\nVerified Tenant: ${currentUser.orgId}\nDownloaded At: ${new Date().toISOString()}`],
          { type: attachment.type || 'application/octet-stream' }
        );
        url = window.URL.createObjectURL(blob);
      }

      downloadLink.href = url;
      downloadLink.download = attachment.name;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  },

  /**
   * Delete an attachment
   *
   * @param {string} attachmentId
   * @param {Object} [user]
   * @returns {Promise<{success: boolean}>}
   */
  async deleteAttachment(attachmentId, user) {
    await delay(70);
    const currentUser = user || Storage.getCurrentUser();

    const allAttachments = Storage.getAttachments();
    const attachment = allAttachments.find((a) => a.id === attachmentId);

    if (!attachment) {
      const err = new Error('Attachment not found');
      err.status = 404;
      throw err;
    }

    if (attachment.orgId !== currentUser.orgId) {
      const err = new Error('Attachment not found in this organization');
      err.status = 404;
      throw err;
    }

    if (!Permissions.canDeleteAttachment(currentUser.role, attachment.userId, currentUser.id)) {
      const err = new Error('Forbidden: You do not have permission to remove this attachment');
      err.status = 403;
      throw err;
    }

    const filtered = allAttachments.filter((a) => a.id !== attachmentId);
    Storage.setAttachments(filtered);

    // Clean up local object URL if revoked
    if (attachment.localUrl && typeof window !== 'undefined' && window.URL && window.URL.revokeObjectURL) {
      try {
        window.URL.revokeObjectURL(attachment.localUrl);
      } catch (e) {
        // ignore
      }
    }

    // Log Activity
    try {
      await activityService.logActivity(
        attachment.taskId,
        'ATTACHMENT_DELETED',
        `removed attachment "${attachment.name}"`,
        attachment.name,
        null,
        currentUser
      );
    } catch (e) {
      console.warn('Activity logging error:', e);
    }

    return { success: true };
  },
};

