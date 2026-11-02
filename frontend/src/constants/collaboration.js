/**
 * collaboration.js
 * Centralized collaboration constants for Taskora Week 3:
 * File attachments, notifications, and activity history.
 */

// File upload configuration & security boundaries
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per file
export const MAX_ATTACHMENT_SIZE_LABEL = '10MB';

export const ALLOWED_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'json',
  'zip',
];

export const DISALLOWED_EXTENSIONS = [
  'exe',
  'bat',
  'sh',
  'cmd',
  'bin',
  'msi',
  'com',
  'scr',
  'vbs',
  'ps1',
  'jar',
  'app',
];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
];

// Activity History Action Types
export const ACTIVITY_TYPES = {
  TASK_CREATED: 'TASK_CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  ASSIGNEE_CHANGED: 'ASSIGNEE_CHANGED',
  DUE_DATE_CHANGED: 'DUE_DATE_CHANGED',
  SUBTASK_TOGGLED: 'SUBTASK_TOGGLED',
  SUBTASK_ADDED: 'SUBTASK_ADDED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  COMMENT_EDITED: 'COMMENT_EDITED',
  COMMENT_DELETED: 'COMMENT_DELETED',
  ATTACHMENT_UPLOADED: 'ATTACHMENT_UPLOADED',
  ATTACHMENT_DELETED: 'ATTACHMENT_DELETED',
};

export const ACTIVITY_TYPE_CONFIG = {
  TASK_CREATED: {
    label: 'Task Created',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'PlusCircle',
  },
  STATUS_CHANGED: {
    label: 'Status Changed',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'ArrowRight',
  },
  PRIORITY_CHANGED: {
    label: 'Priority Updated',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'Flag',
  },
  ASSIGNEE_CHANGED: {
    label: 'Assignee Changed',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'UserCheck',
  },
  DUE_DATE_CHANGED: {
    label: 'Due Date Modified',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: 'Calendar',
  },
  SUBTASK_TOGGLED: {
    label: 'Subtask Updated',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: 'CheckSquare',
  },
  SUBTASK_ADDED: {
    label: 'Subtask Added',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: 'ListPlus',
  },
  COMMENT_ADDED: {
    label: 'Comment Added',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: 'MessageSquare',
  },
  COMMENT_EDITED: {
    label: 'Comment Edited',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: 'Edit2',
  },
  COMMENT_DELETED: {
    label: 'Comment Removed',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'Trash2',
  },
  ATTACHMENT_UPLOADED: {
    label: 'File Attached',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: 'Paperclip',
  },
  ATTACHMENT_DELETED: {
    label: 'File Removed',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'Trash2',
  },
};

// Notification Categories & Metadata
export const NOTIFICATION_CATEGORIES = {
  ALL: 'ALL',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  DUE_DATE_CHANGED: 'DUE_DATE_CHANGED',
  TASK_OVERDUE: 'TASK_OVERDUE',
  STATUS_CHANGED: 'STATUS_CHANGED',
};

export const NOTIFICATION_CONFIG = {
  TASK_ASSIGNED: {
    label: 'Task Assignment',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50/70',
  },
  COMMENT_ADDED: {
    label: 'New Comment',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50/70',
  },
  DUE_DATE_CHANGED: {
    label: 'Due Date Update',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50/70',
  },
  TASK_OVERDUE: {
    label: 'Overdue Alert',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-50/70',
  },
  STATUS_CHANGED: {
    label: 'Workflow Update',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50/70',
  },
};

