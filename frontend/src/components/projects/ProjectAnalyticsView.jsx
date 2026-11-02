import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  XCircle,
  HelpCircle,
  RefreshCw,
  ListTodo,
  FileText,
  BarChart2,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '../ui/Badge';

/**
 * ProjectAnalyticsView.jsx
 * Week 4 — Comprehensive Project Analytics & Progress Dashboard
 *
 * Implements official progress formula:
 *   Progress Percentage = (Completed Tasks / (Total Tasks - Cancelled Tasks)) * 100
 */
export default function ProjectAnalyticsView({
  project,
  tasks = [],
  loading = false,
  error = null,
  onRefresh,
}) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'INPROGRESS'
  ).length;
  const inReviewTasks = tasks.filter(
    (t) => t.status === 'IN_REVIEW' || t.status === 'INREVIEW' || t.status === 'REVIEW'
  ).length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO' || !t.status).length;
  const cancelledTasks = tasks.filter(
    (t) => t.status === 'CANCELLED' || t.status === 'CANCELED'
  ).length;

  const remainingTasks = todoTasks + inProgressTasks + inReviewTasks;
  const eligibleTasks = totalTasks - cancelledTasks;

  // Strict division-by-zero protection: If no eligible tasks exist, progress is 0%
  const progressPercentage =
    eligibleTasks > 0
      ? Math.min(100, Math.max(0, Math.round((completedTasks / eligibleTasks) * 100)))
      : 0;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">Calculating project analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center my-6">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-900">Analytics Load Error</h3>
        <p className="text-xs text-rose-700 mt-1">{error.message || 'Unable to compute project analytics.'}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
          >
            Retry Calculation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header with Refresh */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Project Analytics & Progress</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time delivery progress calculated with the official Qveto progress formula.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh Analytics</span>
            </button>
          )}
        </div>
      </div>

      {/* Formula Specification Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 text-xs text-blue-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                Standard Progress Formula:
              </span>
              <span className="font-mono bg-blue-100/90 text-blue-900 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-blue-200">
                Progress = (Completed / (Total - Cancelled)) &times; 100
              </span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Cancelled tasks are removed from the denominator so dropped or obsolete features do not penalize project completion.
              {eligibleTasks > 0 ? (
                <span className="block mt-1 font-medium font-mono text-[11px] text-blue-900">
                  Current Calculation: ({completedTasks} / ({totalTasks} - {cancelledTasks})) &times; 100 ={' '}
                  <span className="font-bold text-blue-950">{progressPercentage}%</span>
                </span>
              ) : (
                <span className="block mt-1 font-medium text-[11px] text-blue-700 italic">
                  Zero eligible tasks: Safely defaulted to 0% to prevent division by zero.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 8 Required Metrics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Overall Progress */}
        <div className="bg-white rounded-2xl border border-blue-200/90 p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/60 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-blue-700">Project Progress</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-700">{progressPercentage}%</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Overall</span>
          </div>
          <div className="mt-2 w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Total Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalTasks}</span>
            <span className="text-[11px] text-slate-400">all tickets</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Database task records</p>
        </div>

        {/* Metric 3: Completed Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-emerald-700">Completed Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{completedTasks}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              of {eligibleTasks} eligible
            </span>
          </div>
          <p className="text-[10px] text-emerald-600/80 mt-2 font-medium">Status: DONE</p>
        </div>

        {/* Metric 4: Remaining Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-amber-700">Remaining Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{remainingTasks}</span>
            <span className="text-[11px] text-amber-600 font-semibold">active backlog</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">TODO + Active + Review</p>
        </div>

        {/* Metric 5: To-Do Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">To-Do Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{todoTasks}</span>
            <span className="text-[11px] text-slate-400">unstarted</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Status: TODO</p>
        </div>

        {/* Metric 6: In-Progress Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-blue-700">In-Progress Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{inProgressTasks}</span>
            <span className="text-[11px] text-blue-600 font-medium">in development</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Status: IN_PROGRESS</p>
        </div>

        {/* Metric 7: In-Review Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-purple-700">In-Review Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{inReviewTasks}</span>
            <span className="text-[11px] text-purple-600 font-medium">in QA / review</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Status: IN_REVIEW</p>
        </div>

        {/* Metric 8: Cancelled Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-rose-700">Cancelled Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{cancelledTasks}</span>
            <span className="text-[11px] text-rose-600 font-medium">excluded</span>
          </div>
          <p className="text-[10px] text-rose-600/80 mt-2 font-medium">Excluded from denominator</p>
        </div>
      </div>

      {/* Progress & Milestone Delivery Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sprint Delivery Velocity & Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Task distribution across workflow stages ({eligibleTasks} eligible tasks)
            </p>
          </div>
          <span className="text-lg font-black text-blue-600">{progressPercentage}%</span>
        </div>

        {/* Multi-segment stacked progress bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            title={`Completed (Done): ${completedTasks}`}
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
            title={`Cancelled (Excluded): ${cancelledTasks}`}
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

      {/* Breakdown Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Task Status Audit Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Task Count</th>
                <th className="py-2.5 px-3">Progress Impact</th>
                <th className="py-2.5 px-3">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    DONE
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium">Completed</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">{completedTasks}</td>
                <td className="py-2.5 px-3 text-emerald-600 font-medium">Included in numerator &amp; denominator</td>
                <td className="py-2.5 px-3 font-medium">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    IN_PROGRESS
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium">Active (Remaining)</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">{inProgressTasks}</td>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Included in denominator</td>
                <td className="py-2.5 px-3 font-medium">{totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    IN_REVIEW
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium">Review (Remaining)</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">{inReviewTasks}</td>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Included in denominator</td>
                <td className="py-2.5 px-3 font-medium">{totalTasks > 0 ? Math.round((inReviewTasks / totalTasks) * 100) : 0}%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    TODO
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium">Backlog (Remaining)</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">{todoTasks}</td>
                <td className="py-2.5 px-3 text-slate-500 font-medium">Included in denominator</td>
                <td className="py-2.5 px-3 font-medium">{totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%</td>
              </tr>
              <tr className="bg-rose-50/40">
                <td className="py-2.5 px-3">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    CANCELLED
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium text-rose-800">Cancelled (Voided)</td>
                <td className="py-2.5 px-3 font-bold text-rose-700">{cancelledTasks}</td>
                <td className="py-2.5 px-3 text-rose-700 font-semibold">Excluded from denominator</td>
                <td className="py-2.5 px-3 font-medium text-rose-700">{totalTasks > 0 ? Math.round((cancelledTasks / totalTasks) * 100) : 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
