import React from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function DeadlineHorizonCard({
  dueTodayTasks = [],
  dueTomorrowTasks = [],
  dueThisWeekTasks = [],
}) {
  const totalUpcoming = dueTodayTasks.length + dueTomorrowTasks.length + dueThisWeekTasks.length;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Upcoming Deadline Horizon</h3>
          <p className="text-xs text-slate-500">Deliverables scheduled across the next 7 days</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {/* Due Today */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Due Today
          </span>
          <span className="text-xl font-extrabold text-amber-900 block mt-1">
            {dueTodayTasks.length}
          </span>
        </div>

        {/* Due Tomorrow */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            Tomorrow
          </span>
          <span className="text-xl font-extrabold text-blue-900 block mt-1">
            {dueTomorrowTasks.length}
          </span>
        </div>

        {/* Next 7 Days */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
            Next 7 Days
          </span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1">
            {dueThisWeekTasks.length}
          </span>
        </div>
      </div>

      {totalUpcoming === 0 ? (
        <p className="text-xs text-slate-400 text-center py-2">
          No impending deadlines in the next 7 days.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {[...dueTodayTasks, ...dueTomorrowTasks, ...dueThisWeekTasks].slice(0, 5).map(({ task, status }) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs"
            >
              <span className="truncate font-medium text-slate-800 max-w-[200px]">
                {task.title}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.badgeClass}`}>
                {status.shortLabel || status.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
