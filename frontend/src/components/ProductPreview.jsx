import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  Layout, 
  Calendar, 
  Users, 
  Settings, 
  ChevronDown, 
  CheckSquare 
} from 'lucide-react';
import { SAMPLE_KANBAN_DATA } from '../data/landingPageData';

export default function ProductPreview({ onOpenAuth }) {
  const [activeMobileColumn, setActiveMobileColumn] = useState('all');

  const columns = [
    { key: 'todo', label: 'TO DO', badgeBg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', count: SAMPLE_KANBAN_DATA.todo.length, tasks: SAMPLE_KANBAN_DATA.todo },
    { key: 'inProgress', label: 'IN PROGRESS', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', count: SAMPLE_KANBAN_DATA.inProgress.length, tasks: SAMPLE_KANBAN_DATA.inProgress },
    { key: 'inReview', label: 'IN REVIEW', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', count: SAMPLE_KANBAN_DATA.inReview.length, tasks: SAMPLE_KANBAN_DATA.inReview },
    { key: 'done', label: 'DONE', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', count: SAMPLE_KANBAN_DATA.done.length, tasks: SAMPLE_KANBAN_DATA.done },
  ];

  return (
    <section id="solutions" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <Layout className="w-3.5 h-3.5" />
            <span>Interactive Workspace</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Everything your team needs. <br className="hidden sm:inline" />
            Nothing standing in the way.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Bring planning, execution, and collaboration into one connected workspace.
          </p>
        </div>

        {/* Master SaaS Dashboard Frame */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-300/40 overflow-hidden">
          
          {/* Top Bar of the Dashboard Application */}
          <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              </div>
              <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <span className="text-white font-semibold">TASKORA App</span>
                <span className="text-slate-500">/</span>
                <span>Acme Product Engineering</span>
                <span className="text-slate-500">/</span>
                <span className="text-blue-400 font-medium">Sprint Board</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="relative hidden md:block">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  placeholder="Filter tasks..."
                  className="bg-slate-800/90 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-700 placeholder-slate-400 w-44 focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('new-task')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>
          </div>

          {/* Main Dashboard Layout (Sidebar + Board Canvas) */}
          <div className="flex flex-col lg:flex-row min-h-[580px]">
            
            {/* Desktop Left Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 text-slate-700 justify-between">
              <div className="space-y-6">
                
                {/* Workspace Selector */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      A
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Acme Engineering</h4>
                      <p className="text-[10px] text-slate-500">12 team members</p>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Primary Views */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Views</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs">
                      <Layout className="w-4 h-4 text-blue-600" />
                      <span>Kanban Board</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer transition-colors">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Sprint Timeline</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer transition-colors">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Team Workload</span>
                    </div>
                  </div>
                </div>

                {/* Project List */}
                <div>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Projects</p>
                    <span className="text-[10px] text-slate-400">4</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-slate-900 font-semibold text-xs shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>Website Redesign</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">74%</span>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>Mobile App v2.0</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">58%</span>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Design System</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">92%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">v1.0</span>
              </div>
            </aside>

            {/* Board Canvas Area */}
            <main className="flex-1 p-4 sm:p-6 bg-slate-50/50 flex flex-col justify-between">
              
              {/* Board Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-xl font-extrabold text-slate-900">Website Redesign</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Active Sprint
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Target Release: Nov 4 • Deliver core marketing website and unified responsive design tokens.
                  </p>
                </div>

                {/* Team Members & Progress Pill */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-1.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                      EC
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                      DK
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                      SL
                    </div>
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                      MR
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-[10px] ring-2 ring-white">
                      +2
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-slate-800">74% Progress</div>
                    <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '74%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Column Switcher (Visible only on smaller screens for clean responsiveness) */}
              <div className="flex lg:hidden overflow-x-auto gap-2 pb-3 mb-3 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveMobileColumn('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    activeMobileColumn === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  All Columns
                </button>
                {columns.map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => setActiveMobileColumn(col.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                      activeMobileColumn === col.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {col.label} ({col.count})
                  </button>
                ))}
              </div>

              {/* Kanban Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {columns
                  .filter((col) => activeMobileColumn === 'all' || activeMobileColumn === col.key)
                  .map((col) => (
                    <div
                      key={col.key}
                      className="bg-slate-100/75 rounded-xl p-3 border border-slate-200/90 flex flex-col min-h-[360px]"
                    >
                      {/* Column Title */}
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                          <h4 className="text-xs font-bold text-slate-800 tracking-wider">
                            {col.label}
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {col.count}
                        </span>
                      </div>

                      {/* Task Cards in Column */}
                      <div className="space-y-2.5 flex-1">
                        {col.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white rounded-lg p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                            onClick={() => onOpenAuth('task-detail')}
                          >
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {task.category}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${task.priorityColor}`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2.5 line-clamp-2 leading-snug">
                              {task.title}
                            </h5>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                              <div className="flex items-center gap-2.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{task.dueDate}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="w-3 h-3 text-slate-400" />
                                  <span>{task.checklist}</span>
                                </span>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full ${task.assignee.bg} text-white font-bold flex items-center justify-center text-[9px]`}
                                title={task.assignee.name}
                              >
                                {task.assignee.initials}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add task button in column */}
                      <button
                        type="button"
                        onClick={() => onOpenAuth('new-task')}
                        className="mt-3 w-full py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:bg-white text-slate-500 hover:text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  ))}
              </div>

            </main>
          </div>
        </div>

      </div>
    </section>
  );
}
