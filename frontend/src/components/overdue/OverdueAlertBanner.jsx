import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Filter, X } from 'lucide-react';
import { isTaskOverdue } from '../../utils/dateUtils';

export default function OverdueAlertBanner({
  tasks = [],
  onFilterOverdue,
  isOverdueFilterActive = false,
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));
  const count = overdueTasks.length;

  if (count === 0 || isDismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/50 border border-rose-200/90 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-extrabold text-rose-950">
                {count === 1 ? '1 Task is Overdue' : `${count} Tasks are Overdue`}
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800">
                Requires Attention
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-rose-700 mt-0.5">
              Deliverables have exceeded their planned target dates. Review and adjust deadlines or expedite completion.
            </p>
          </div>
        </div>

        {/* Action button & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {onFilterOverdue && (
            <button
              type="button"
              onClick={onFilterOverdue}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isOverdueFilterActive
                  ? 'bg-rose-200 text-rose-900 border border-rose-300'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isOverdueFilterActive ? 'Showing Overdue' : 'Filter Overdue'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100/50 transition-colors"
            title="Dismiss alert"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

