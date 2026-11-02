/**
 * dateUtils.js
 * Centralized date calculations and formatting for Taskora.
 * Enforces consistent overdue calculations, deadline statuses, and relative time formatting.
 */

/**
 * Checks if a task is overdue.
 * A task is overdue when:
 * 1. Its status is NOT 'DONE' and NOT 'CANCELLED'
 * 2. It has a valid dueDate
 * 3. The dueDate is strictly before today's date (based on standard ISO date string YYYY-MM-DD)
 *
 * @param {Object} task
 * @param {Date|string} [referenceDate] - Default is current system date
 * @returns {boolean}
 */
export function isTaskOverdue(task, referenceDate = new Date()) {
  if (!task || !task.dueDate) return false;
  if (task.status === 'DONE' || task.status === 'CANCELLED') return false;

  const todayStr =
    referenceDate instanceof Date
      ? referenceDate.toISOString().split('T')[0]
      : new Date(referenceDate).toISOString().split('T')[0];

  const dueStr = task.dueDate.includes('T')
    ? task.dueDate.split('T')[0]
    : task.dueDate;

  return dueStr < todayStr;
}

/**
 * Calculates deadline status, days remaining/overdue, and badge styles.
 *
 * @param {Object} task
 * @param {Date|string} [referenceDate]
 * @returns {Object}
 */
export function getDeadlineStatus(task, referenceDate = new Date()) {
  if (!task || !task.dueDate) {
    return {
      hasDueDate: false,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      daysDifference: null,
      label: 'No due date',
      badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
    };
  }

  if (task.status === 'DONE' || task.status === 'CANCELLED') {
    return {
      hasDueDate: true,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: false,
      daysDifference: 0,
      label: 'Completed',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  const todayStr =
    referenceDate instanceof Date
      ? referenceDate.toISOString().split('T')[0]
      : new Date(referenceDate).toISOString().split('T')[0];

  const dueStr = task.dueDate.includes('T')
    ? task.dueDate.split('T')[0]
    : task.dueDate;

  const todayTime = new Date(`${todayStr}T00:00:00Z`).getTime();
  const dueTime = new Date(`${dueStr}T00:00:00Z`).getTime();
  const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      hasDueDate: true,
      isOverdue: true,
      isDueToday: false,
      isDueTomorrow: false,
      daysDifference: diffDays,
      overdueDays,
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      shortLabel: `${overdueDays}d overdue`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    };
  }

  if (diffDays === 0) {
    return {
      hasDueDate: true,
      isOverdue: false,
      isDueToday: true,
      isDueTomorrow: false,
      daysDifference: 0,
      label: 'Due today',
      shortLabel: 'Today',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
    };
  }

  if (diffDays === 1) {
    return {
      hasDueDate: true,
      isOverdue: false,
      isDueToday: false,
      isDueTomorrow: true,
      daysDifference: 1,
      label: 'Due tomorrow',
      shortLabel: 'Tomorrow',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
    };
  }

  return {
    hasDueDate: true,
    isOverdue: false,
    isDueToday: false,
    isDueTomorrow: false,
    daysDifference: diffDays,
    label: `Due in ${diffDays} days`,
    shortLabel: `${diffDays}d left`,
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
  };
}

/**
 * Formats an ISO date string into human-friendly relative time (e.g., "5 minutes ago", "Yesterday").
 *
 * @param {string|number|Date} dateInput
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 45) {
    return 'just now';
  }
  if (diffSeconds < 90) {
    return '1 minute ago';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }
  if (diffHours === 1) {
    return '1 hour ago';
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Formats a date into a clean display format (e.g., "Oct 25, 2026").
 *
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date and time for tooltips and audit stamps (e.g., "Oct 25, 2026 at 2:30 PM").
 *
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  return `${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

