import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProjectProgressBarChart({ projects = [] }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Project Delivery Progress</h3>
          <p className="text-xs text-slate-500">Milestone execution and task completion rates</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FolderKanban className="w-3.5 h-3.5" />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No Projects Found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">No projects match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {projects.map((proj) => {
            const isCompleted = proj.progress === 100 || proj.status === 'COMPLETED';

            return (
              <div
                key={proj.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <Link
                      to={`/app/projects/${proj.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 truncate flex items-center gap-1 group"
                    >
                      <span className="truncate">{proj.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {proj.completedTasks} of {proj.totalTasks} tasks completed • {proj.remainingTasks} remaining
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {proj.overdueTasks > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {proj.overdueTasks} overdue
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 min-w-[36px] text-right">
                    {proj.progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
