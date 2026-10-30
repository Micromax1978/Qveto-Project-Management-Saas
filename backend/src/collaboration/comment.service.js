/**
 * comment.service.js
 * Service handling task comments, length and payload validation,
 * role authorization, and multi-tenant isolation.
 */

const { getDb } = require('../data/mockDb');

function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const MAX_COMMENT_LENGTH = 2000;

function createComment(taskId, data, user) {
  if (!user || !user.id || !user.orgId) {
    throw { status: 401, message: 'Unauthorized: authentication required' };
  }

  const db = getDb();
  const task = db.tasks.find(t => t.id === taskId);
  if (!task || task.orgId !== user.orgId) {
    throw { status: 404, message: 'Task not found' };
  }

  const project = db.projects.find(p => p.id === task.projectId && p.orgId === user.orgId);
  if (!project) {
    throw { status: 404, message: 'Project not found' };
  }

  // Employee role can only comment on projects they are assigned to
  if (user.role === 'EMPLOYEE' && (!project.members || !project.members.includes(user.id))) {
    throw { status: 403, message: 'Forbidden: you do not have permission to comment on this task' };
  }

  if (!data || !data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    throw { status: 400, message: 'Comment content cannot be empty' };
  }

  if (data.content.length > MAX_COMMENT_LENGTH) {
    throw { status: 400, message: `Comment exceeds maximum allowed length of ${MAX_COMMENT_LENGTH} characters` };
  }

  const sanitizedContent = sanitizeHtml(data.content.trim());

  const newComment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    orgId: user.orgId,
    projectId: project.id,
    taskId: task.id,
    authorId: user.id,
    authorName: user.name || 'Anonymous User',
    content: sanitizedContent,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.comments.push(newComment);

  // Record activity log
  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.push({
    id: `act_${Date.now()}`,
    orgId: user.orgId,
    projectId: project.id,
    taskId: task.id,
    userId: user.id,
    type: 'COMMENT_CREATED',
    details: `Added a comment on task ${task.title}`,
    createdAt: newComment.createdAt
  });

  return newComment;
}

function getCommentsByTask(taskId, user) {
  if (!user || !user.id || !user.orgId) {
    throw { status: 401, message: 'Unauthorized: authentication required' };
  }

  const db = getDb();
  const task = db.tasks.find(t => t.id === taskId);
  if (!task || task.orgId !== user.orgId) {
    throw { status: 404, message: 'Task not found' };
  }

  const project = db.projects.find(p => p.id === task.projectId && p.orgId === user.orgId);
  if (!project) {
    throw { status: 404, message: 'Project not found' };
  }

  if (user.role === 'EMPLOYEE' && (!project.members || !project.members.includes(user.id))) {
    throw { status: 403, message: 'Forbidden: access denied to task comments' };
  }

  return db.comments.filter(c => c.taskId === taskId && c.orgId === user.orgId);
}

function deleteComment(commentId, user) {
  if (!user || !user.id || !user.orgId) {
    throw { status: 401, message: 'Unauthorized: authentication required' };
  }

  const db = getDb();
  const index = db.comments.findIndex(c => c.id === commentId);
  if (index === -1) {
    throw { status: 404, message: 'Comment not found' };
  }

  const comment = db.comments[index];
  if (comment.orgId !== user.orgId) {
    throw { status: 404, message: 'Comment not found' };
  }

  // Only author, manager, or owner can delete
  if (user.role === 'EMPLOYEE' && comment.authorId !== user.id) {
    throw { status: 403, message: 'Forbidden: you cannot delete another user\'s comment' };
  }

  db.comments.splice(index, 1);
  return { success: true, message: 'Comment deleted successfully' };
}

module.exports = {
  createComment,
  getCommentsByTask,
  deleteComment,
  MAX_COMMENT_LENGTH
};
