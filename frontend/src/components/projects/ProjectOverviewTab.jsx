import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Calendar,
  Users,
  UserCheck,
  ArrowRight,
  TrendingUp,
  XCircle,
  BarChart2,
  ListTodo,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { StatusBadge, PriorityBadge } from '../ui/Badge';

export default function ProjectOverviewTab({
  project,
  tasks = [],
  users = [],
  onSwitchTab,
  onOpenTaskDetails,
}) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'INPROGRESS'
  ).length;
  const inReviewTasks = tasks.filter(
    (t) => t.status === 'IN_REVIEW' || t.status === 'REVIEW' || t.status === 'INREVIEW'
  ).length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO' || !t.status).length;
  const cancelledTasks = tasks.filter(
    (t) => t.status === 'CANCELLED' || t.status === 'CANCELED'
  ).length;

  const remainingTasks = todoTasks + inProgressTasks + inReviewTasks;
  const eligibleTasks = totalTasks - cancelledTasks;

  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'DONE'
  ).length;

  // Official Progress Percentage formula:
  // (Completed Tasks / (Total Tasks - Cancelled Tasks)) * 100
  const progressPercentage =
    eligibleTasks > 0
      ? Math.min(100, Math.max(0, Math.round((completedTasks / eligibleTasks) * 100)))
      : 0;

  // Resolve members
  const memberObjects = (project.members || [])
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  const owner = users.find((u) => u.id === project.createdById);

  // Recent 5 tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Progress Percentage */}
        <div className="bg-white rounded-2xl border border-blue-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-blue-700">Overall Progress</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{progressPercentage}%</span>
            <span className="text-[11px] text-blue-600 font-semibold">
              ({completedTasks}/{eligibleTasks} eligible)
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalTasks}</span>
            <span className="text-[11px] text-slate-400">total scoped</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">All recorded tasks</p>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-emerald-700">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{completedTasks}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              done
            </span>
          </div>
          <p className="text-[10px] text-emerald-600/80 mt-2">Status: DONE</p>
        </div>

        {/* Remaining Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-amber-700">Remaining</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{remainingTasks}</span>
            <span className="text-[11px] text-slate-400">unfinished</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">TODO + Active + Review</p>
        </div>
      </div>

      {/* Secondary Status Breakdown Strip (To-Do, In-Progress, In-Review, Cancelled, Overdue) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
            <ListTodo className="w-3.5 h-3.5 text-slate-400" /> To-Do Tasks
          </span>
          <span className="text-lg font-black text-slate-800">{todoTasks}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> In-Progress
          </span>
          <span className="text-lg font-black text-blue-700">{inProgressTasks}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-500" /> In-Review
          </span>
          <span className="text-lg font-black text-purple-700">{inReviewTasks}</span>
        </div>

        <div className="bg-white rounded-xl border border-rose-100 bg-rose-50/30 p-3 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 mb-1" title="Excluded from progress denominator">
            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Cancelled (Excluded)
          </span>
          <span className="text-lg font-black text-rose-700">{cancelledTasks}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Overdue
          </span>
          <span className={`text-lg font-black ${overdueTasks > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {overdueTasks}
          </span>
        </div>
      </div>

      {/* Progress & Milestone Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sprint Delivery Progress</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Task distribution across delivery milestones &bull; Progress = (Completed / (Total - Cancelled)) &times; 100
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSwitchTab('analytics')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Full Analytics</span>
            </button>
            <span className="text-base font-extrabold text-blue-600">
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* Multi-segment stacked progress bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            title={`Done: ${completedTasks}`}
          />
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (inReviewTasks / totalTasks) * 100 : 0}%` }}
            title={`In Review: ${inReviewTasks}`}
          />
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
            title={`In Progress: ${inProgressTasks}`}
          />
          <div
            className="h-full bg-slate-300 transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
            title={`To Do: ${todoTasks}`}
          />
          <div
            className="h-full bg-rose-400 transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (cancelledTasks / totalTasks) * 100 : 0}%` }}
            title={`Cancelled (Excluded from denominator): ${cancelledTasks}`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs pt-3 mt-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Done ({completedTasks})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-600 font-medium">In Review ({inReviewTasks})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 font-medium">In Progress ({inProgressTasks})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-600 font-medium">To Do ({todoTasks})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-600 font-medium">Cancelled ({cancelledTasks})</span>
          </div>
        </div>
      </div>

      {/* 2-Column: Project Details & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Activity & Tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Tasks</h3>
              <button
                type="button"
                onClick={() => onSwitchTab('board')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>Open Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No tasks created for this project yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentTasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskDetails && onOpenTaskDetails(task)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-400">
                            {task.taskCode || 'TSK'}
                          </span>
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {task.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {task.dueDate && (
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            {task.dueDate}
                          </span>
                        )}
                        <Avatar user={assignee} size="xs" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Project Meta & Team Members */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Project Scope</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Project Lead</span>
              <span className="font-semibold text-slate-800">{owner?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Start Date</span>
              <span className="font-semibold text-slate-800">
                {project.startDate || 'Not specified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Due Date</span>
              <span className="font-semibold text-slate-800">
                {project.dueDate || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Members list */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-3">
              Team Members ({memberObjects.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {memberObjects.map((member) => (
                <div key={member.id} className="flex items-center gap-2.5 p-1.5 rounded-lg">
                  <Avatar user={member} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize truncate">
                      {member.role?.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
