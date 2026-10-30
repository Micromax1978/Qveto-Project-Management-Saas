/**
 * attachment.service.js
 * Secure file attachment workflow: upload validation, size limits,
 * MIME type checking, access control, and private downloads.
 */

const path = require('path');
const { getDb } = require('../data/mockDb');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'csv', 'docx', 'txt', 'zip'];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed'
];

function sanitizeFileName(fileName) {
  if (typeof fileName !== 'string') return 'attachment';
  // Strip directory traversal sequences
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function uploadAttachment(taskId, fileData, user) {
  if (!user || !user.id || !user.orgId) {
    throw { status: 401, message: 'Unauthorized: authentication required to upload attachments' };
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
    throw { status: 403, message: 'Forbidden: you do not have permission to upload files to this project' };
  }

  if (!fileData || !fileData.fileName || fileData.fileSize === undefined || fileData.fileSize === null) {
    throw { status: 400, message: 'Missing required file data' };
  }

  // Validate file size
  if (fileData.fileSize <= 0) {
    throw { status: 400, message: 'File is empty (0 bytes)' };
  }

  if (fileData.fileSize > MAX_FILE_SIZE) {
    const sizeInMB = (fileData.fileSize / (1024 * 1024)).toFixed(2);
    throw {
      status: 400,
      message: `File size (${sizeInMB}MB) exceeds maximum limit of 10MB`
    };
  }

  // Validate extension and MIME type
  const ext = (path.extname(fileData.fileName) || '').replace('.', '').toLowerCase();
  const mimeType = (fileData.mimeType || '').toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw {
      status: 400,
      message: `Disallowed file type '.${ext}'. Allowed formats: PDF, PNG, JPG, CSV, DOCX, TXT, ZIP`
    };
  }

  const safeFileName = sanitizeFileName(fileData.fileName);
  const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const storagePath = `storage/${user.orgId}/${project.id}/${attachmentId}_${safeFileName}`;

  const newAttachment = {
    id: attachmentId,
    orgId: user.orgId,
    projectId: project.id,
    taskId: task.id,
    uploaderId: user.id,
    uploaderName: user.name || 'Anonymous User',
    fileName: safeFileName,
    fileSize: fileData.fileSize,
    mimeType: fileData.mimeType,
    storagePath,
    isPublic: false, // Strictly private - no direct public link
    createdAt: new Date().toISOString()
  };

  if (!db.attachments) db.attachments = [];
  db.attachments.push(newAttachment);

  if (!db.activityLogs) db.activityLogs = [];
  db.activityLogs.push({
    id: `act_${Date.now()}`,
    orgId: user.orgId,
    projectId: project.id,
    taskId: task.id,
    userId: user.id,
    type: 'ATTACHMENT_UPLOADED',
    details: `Uploaded attachment '${safeFileName}' (${(fileData.fileSize / 1024).toFixed(1)} KB)`,
    createdAt: newAttachment.createdAt
  });

  return newAttachment;
}

function downloadAttachment(attachmentId, user, options = {}) {
  // Try logged out or public access
  if (!user || !user.id || !user.orgId || options.isPublicLink) {
    throw {
      status: 401,
      message: 'Unauthorized: Authentication required to download attachments. Public links are disabled.'
    };
  }

  const db = getDb();
  if (!db.attachments) db.attachments = [];
  const attachment = db.attachments.find(a => a.id === attachmentId);

  // Cross-organization boundary masking
  if (!attachment || attachment.orgId !== user.orgId) {
    throw { status: 404, message: 'Attachment not found' };
  }

  const project = db.projects.find(p => p.id === attachment.projectId && p.orgId === user.orgId);
  if (!project) {
    throw { status: 404, message: 'Associated project not found' };
  }

  if (user.role === 'EMPLOYEE' && (!project.members || !project.members.includes(user.id))) {
    throw { status: 403, message: 'Forbidden: access denied to attachment in unassigned project' };
  }

  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    storagePath: attachment.storagePath,
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    }
  };
}

function getAttachmentsByTask(taskId, user) {
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
    throw { status: 403, message: 'Forbidden: access denied to task attachments' };
  }

  if (!db.attachments) db.attachments = [];
  return db.attachments.filter(a => a.taskId === taskId && a.orgId === user.orgId);
}

module.exports = {
  uploadAttachment,
  downloadAttachment,
  getAttachmentsByTask,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES
};
