import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layout,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  Calendar,
  Users,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  X,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchProjects,
  createProject,
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  getStoredAuth,
} from '../services/api';

const KANBAN_COLUMNS = [
  { key: 'TODO', label: 'TO DO', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: 'IN PROGRESS', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { key: 'IN_REVIEW', label: 'IN REVIEW', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { key: 'DONE', label: 'DONE', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
];

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'projects'

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedDue, setSelectedDue] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Form states
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '' });
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'TODO',
    priority: 'MEDIUM',
    label: '',
    dueDate: '',
  });

  const { organizationId } = getStoredAuth();

  // Load live data from backend APIs
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const projRes = await fetchProjects();
      const projList = projRes.projects || [];
      setProjects(projList);

      const params = {};
      if (selectedProjectId) params.projectId = selectedProjectId;
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedDue) params.due = selectedDue;
      if (selectedLabel) params.label = selectedLabel;

      const taskRes = await fetchTasks(params);
      setTasks(taskRes.tasks || []);
    } catch (err) {
      setErrorMessage(err.error || err.message || 'Failed to communicate with the server.');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, searchTerm, selectedStatus, selectedPriority, selectedDue, selectedLabel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Kanban task move
  const handleMoveStatus = async (taskId, newStatus) => {
    try {
      setErrorMessage('');
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      setErrorMessage(err.error || 'Failed to update task status.');
    }
  };

  // Handle Project Creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.name.trim()) {
      setErrorMessage('Project name is required.');
      return;
    }
    try {
      setErrorMessage('');
      const created = await createProject(newProjectData);
      setProjects((prev) => [created, ...prev]);
      setShowNewProjectModal(false);
      setNewProjectData({ name: '', description: '' });
      if (!selectedProjectId) {
        setSelectedProjectId(created.id);
      }
    } catch (err) {
      setErrorMessage(err.error || 'Failed to create project.');
    }
  };

  // Handle Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const targetProjId = newTaskData.projectId || selectedProjectId || (projects[0] && projects[0].id);

    if (!targetProjId) {
      setErrorMessage('Please select or create a project first before adding tasks.');
      return;
    }
    if (!newTaskData.title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    try {
      setErrorMessage('');
      const payload = {
        ...newTaskData,
        projectId: targetProjId,
      };
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.label) delete payload.label;

      const created = await createTask(payload);
      setTasks((prev) => [created, ...prev]);
      setShowNewTaskModal(false);
      setNewTaskData({
        title: '',
        description: '',
        projectId: targetProjId,
        status: 'TODO',
        priority: 'MEDIUM',
        label: '',
        dueDate: '',
      });
    } catch (err) {
      setErrorMessage(err.error || 'Failed to create task.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    try {
      setErrorMessage('');
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setErrorMessage(err.error || 'Failed to delete task.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Application Navbar */}
      <header className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex items-center justify-between border-b border-slate-800 shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md group-hover:bg-blue-500 transition-colors">
              Q
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">TASKORA</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 font-medium">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Org: {organizationId ? organizationId.slice(0, 8) : 'demo-org'}...
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Backend Connected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Global Error Banner for Invalid Data / 401 / 403 / 404 */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 flex items-center justify-between text-rose-800 text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 max-w-4xl">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-semibold">Notice:</span> {errorMessage}
            </div>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="p-1 text-rose-500 hover:text-rose-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Controls Bar: Search, Filters & Project Selector */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks by title or description..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scope / View Switcher */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setActiveTab('kanban')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'kanban' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Kanban Board
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'projects' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Projects Overview ({projects.length})
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Filters:
            </span>

            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium / Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            {/* Due Date Filter */}
            <select
              value={selectedDue}
              onChange={(e) => setSelectedDue(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Any Due Date</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="this_week">Due This Week</option>
              <option value="overdue">Overdue Tasks</option>
            </select>

            {/* Label Filter */}
            <input
              type="text"
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              placeholder="Filter by label..."
              className="w-32 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 font-medium placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
            />

            {(selectedProjectId || selectedStatus || selectedPriority || selectedDue || selectedLabel || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedProjectId('');
                  setSelectedStatus('');
                  setSelectedPriority('');
                  setSelectedDue('');
                  setSelectedLabel('');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </section>

        {/* Tab 1: Kanban Board View */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);

              return (
                <div
                  key={col.key}
                  className="bg-slate-100/80 rounded-xl border border-slate-200/80 p-3.5 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h3 className="text-xs font-bold text-slate-800 tracking-wider">{col.label}</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards List */}
                  <div className="space-y-3 flex-1">
                    {colTasks.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            {task.label && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {task.label}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-auto ${
                                PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM
                              }`}
                            >
                              {task.priority || 'MEDIUM'}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 leading-snug">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}

                          {/* Project context tag */}
                          {task.project && (
                            <div className="text-[11px] font-medium text-slate-400 mb-3 flex items-center gap-1">
                              <FolderKanban className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{task.project.name}</span>
                            </div>
                          )}

                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            {/* Assignee avatar */}
                            {task.assignee ? (
                              <div className="flex items-center gap-1.5" title={task.assignee.email}>
                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                                  {task.assignee.initials || task.assignee.name.charAt(0)}
                                </div>
                                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[80px]">
                                  {task.assignee.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                            )}

                            {/* Due date */}
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Status Move Actions (Kanban Progression) */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-slate-400 font-semibold">Move:</span>
                            <div className="flex items-center gap-1">
                              {col.key !== 'TODO' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'TODO')}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                                  title="Move to TO DO"
                                >
                                  To Do
                                </button>
                              )}
                              {col.key !== 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'IN_PROGRESS')}
                                  className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                                  title="Move to IN PROGRESS"
                                >
                                  In Prog
                                </button>
                              )}
                              {col.key !== 'IN_REVIEW' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'IN_REVIEW')}
                                  className="px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium"
                                  title="Move to IN REVIEW"
                                >
                                  Review
                                </button>
                              )}
                              {col.key !== 'DONE' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'DONE')}
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium"
                                  title="Move to DONE"
                                >
                                  Done
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-1.5 py-0.5 rounded text-rose-500 hover:bg-rose-50 font-medium ml-1"
                                title="Delete task"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Projects Overview */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {proj.workspace ? proj.workspace.name : 'Default Workspace'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {proj.taskCount || 0} tasks
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{proj.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Progress</span>
                      <span>{proj.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${proj.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks by status mini tags */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      Todo: {proj.tasksByStatus ? proj.tasksByStatus.TODO : 0}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                      Active: {proj.tasksByStatus ? proj.tasksByStatus.IN_PROGRESS : 0}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      Done: {proj.tasksByStatus ? proj.tasksByStatus.DONE : 0}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setActiveTab('kanban');
                    }}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <span>View in Kanban</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create New Project</h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  placeholder="Outline project deliverables and scope..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add New Task</h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  placeholder="e.g. Design navigation components"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project *
                </label>
                <select
                  required
                  value={newTaskData.projectId || selectedProjectId || (projects[0] && projects[0].id)}
                  onChange={(e) => setNewTaskData({ ...newTaskData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  placeholder="Add context, subtasks, or acceptance criteria..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={newTaskData.status}
                    onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium / Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Label / Category
                  </label>
                  <input
                    type="text"
                    value={newTaskData.label}
                    onChange={(e) => setNewTaskData({ ...newTaskData, label: e.target.value })}
                    placeholder="e.g. Design, Engineering"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskData.dueDate}
                    onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
