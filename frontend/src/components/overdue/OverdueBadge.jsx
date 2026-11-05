import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { getDeadlineStatus } from '../../utils/dateUtils';

export default function OverdueBadge({ task, showIcon = true, size = 'sm' }) {
  const status = getDeadlineStatus(task);

  if (!status.hasDueDate) {
    return null;
  }

  const sizeClasses =
    size === 'xs'
      ? 'text-[10px] px-1.5 py-0.5'
      : size === 'md'
      ? 'text-xs px-2.5 py-1'
      : 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-medium transition-colors ${status.badgeClass} ${sizeClasses}`}
      title={status.label}
    >
      {showIcon && (
        <>
          {status.isOverdue ? (
            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0 animate-pulse" />
          ) : status.isDueToday || status.isDueTomorrow ? (
            <Clock className="w-3 h-3 shrink-0" />
          ) : (
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          )}
        </>
      )}
      <span className="truncate">{status.label}</span>
    </span>
  );
}

