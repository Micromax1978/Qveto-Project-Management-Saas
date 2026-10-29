import React from 'react';
import { Search, X, Filter, AlertCircle } from 'lucide-react';
import { TASK_STATUS_LIST, TASK_PRIORITY_LIST } from '../../constants/status';

export default function TaskFilters({
  filters,
  onFilterChange,
  onResetFilters,
  users = [],
  totalCount,
}) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.assigneeId !== 'ALL' ||
    Boolean(filters.overdueOnly);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search tasks by keyword or code (e.g. TSK-101)..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            {TASK_STATUS_LIST.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            {TASK_PRIORITY_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Assignee */}
          <select
            value={filters.assigneeId}
            onChange={(e) => onFilterChange('assigneeId', e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            aria-label="Filter by assignee"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Overdue Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange('overdueOnly', !filters.overdueOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
              filters.overdueOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue</span>
          </button>
        </div>
      </div>

      {/* Filter status bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <span>
          Showing <strong>{totalCount}</strong> matching tasks
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Clear All Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
