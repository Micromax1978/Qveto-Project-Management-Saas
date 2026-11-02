import React from 'react';
import { Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';

export default function TeamWorkloadBarChart({ workload = [] }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Team Workload Distribution</h3>
          <p className="text-xs text-slate-500">Active task assignment and member backlog</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Users className="w-3.5 h-3.5" />
        </div>
      </div>

      {workload.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs font-semibold text-slate-600">No Member Data</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Team workload will display when members are assigned to tasks.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {workload.map(({ user, totalTasks, completedTasks, inProgressTasks, overdueTasks, completionRate }) => (
            <div
              key={user.id}
              className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar user={user} size="sm" showTooltip={false} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.title || user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {overdueTasks > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{overdueTasks} overdue</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-800">
                    {totalTasks} tasks
                  </span>
                </div>
              </div>

              {/* Progress Bar & Breakdown */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200/70 h-2 rounded-full overflow-hidden flex">
                  {/* Completed segment */}
                  {totalTasks > 0 && completedTasks > 0 && (
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                      title={`Completed: ${completedTasks}`}
                    />
                  )}
                  {/* In Progress segment */}
                  {totalTasks > 0 && inProgressTasks > 0 && (
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
                      title={`In Progress: ${inProgressTasks}`}
                    />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-600 min-w-[32px] text-right">
                  {completionRate}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span>{completedTasks} completed • {inProgressTasks} active</span>
                <span className="text-slate-400">Backlog item allocation</span>
              </div>
            </div>
          ))}

          <p className="text-[10px] text-slate-400 italic pt-1">
            * Task counts represent workflow assignments and not total employee hourly capacity.
          </p>
        </div>
      )}
    </div>
  );
}
