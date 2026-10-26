import React from 'react';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../constants/status';
import { ROLE_CONFIG } from '../../constants/roles';

export function StatusBadge({ status, className = '' }) {
  const config = TASK_STATUSES[status] || {
    label: status,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  const config = TASK_PRIORITIES[priority] || {
    label: priority,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${config.badgeClass} ${className}`}
    >
      <span>{config.label}</span>
    </span>
  );
}

export function LabelBadge({ label, onRemove, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 ${className}`}
    >
      <span>#{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label);
          }}
          className="ml-0.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
          aria-label={`Remove label ${label}`}
        >
          &times;
        </button>
      )}
    </span>
  );
}

export function RoleBadge({ role, className = '' }) {
  const config = ROLE_CONFIG[role] || {
    badge: role,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.badgeClass} ${className}`}
    >
      {config.badge}
    </span>
  );
}
