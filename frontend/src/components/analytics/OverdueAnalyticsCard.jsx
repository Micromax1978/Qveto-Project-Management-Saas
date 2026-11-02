import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ArrowRight, UserX, FolderKanban } from 'lucide-react';
import Avatar from '../ui/Avatar';

export default function OverdueAnalyticsCard({
  overdueTasks = [],
  overdueByProject = [],
  overdueByAssignee = [],
}) {
  const count = overdueTasks.length;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Overdue Task Exposure</h3>
          <p className="text-xs text-slate-500">Tasks past their due date requiring immediate triage</p>
        </div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          count > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
      </div>

      {count === 0 ? (
        <div className="py-8 text-center bg-emerald-50/40 rounded-xl border border-emerald-100 p-4">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-emerald-800">Zero Overdue Tasks</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">All scheduled deliverables are currently on track!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue Count Banner */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-rose-600">{count}</span>
              <span className="text-xs font-semibold text-rose-800">
                {count === 1 ? 'task past deadline' : 'tasks past deadline'}
              </span>
            </div>
            <Link
              to="/app/tasks"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline"
            >
              <span>Triage Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* By Project */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                By Project
              </span>
              <div className="space-y-1.5">
                {overdueByProject.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate font-medium">{item.name}</span>
                    <span className="font-bold text-rose-600 shrink-0 ml-2">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Assignee */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                By Assignee
              </span>
              <div className="space-y-1.5">
                {overdueByAssignee.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate font-medium">{item.name}</span>
                    <span className="font-bold text-rose-600 shrink-0 ml-2">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
