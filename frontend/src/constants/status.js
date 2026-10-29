/**
 * Task and Project Status Definitions
 * Centralized constants to ensure consistency across UI and backend contracts.
 */

export const TASK_STATUSES = {
  TODO: {
    id: 'TODO',
    label: 'To Do',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  IN_PROGRESS: {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500 animate-pulse',
  },
  REVIEW: {
    id: 'REVIEW',
    label: 'In Review',
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  DONE: {
    id: 'DONE',
    label: 'Done',
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
};

export const TASK_STATUS_LIST = [
  TASK_STATUSES.TODO,
  TASK_STATUSES.IN_PROGRESS,
  TASK_STATUSES.REVIEW,
  TASK_STATUSES.DONE,
];

export const TASK_PRIORITIES = {
  LOW: {
    id: 'LOW',
    label: 'Low',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    iconColor: 'text-slate-400',
    order: 1,
  },
  MEDIUM: {
    id: 'MEDIUM',
    label: 'Medium',
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
    order: 2,
  },
  HIGH: {
    id: 'HIGH',
    label: 'High',
    color: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500',
    order: 3,
  },
  URGENT: {
    id: 'URGENT',
    label: 'Urgent',
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    iconColor: 'text-rose-600',
    order: 4,
  },
};

export const TASK_PRIORITY_LIST = [
  TASK_PRIORITIES.LOW,
  TASK_PRIORITIES.MEDIUM,
  TASK_PRIORITIES.HIGH,
  TASK_PRIORITIES.URGENT,
];

export const PROJECT_STATUSES = {
  ACTIVE: {
    id: 'ACTIVE',
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  COMPLETED: {
    id: 'COMPLETED',
    label: 'Completed',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  ARCHIVED: {
    id: 'ARCHIVED',
    label: 'Archived',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const DEFAULT_LABELS = [
  { id: 'frontend', name: 'frontend', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'backend', name: 'backend', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'ui/ux', name: 'ui/ux', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'bug', name: 'bug', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'feature', name: 'feature', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'database', name: 'database', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'architecture', name: 'architecture', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'api', name: 'api', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];
