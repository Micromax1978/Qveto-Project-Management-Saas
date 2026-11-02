import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  FolderKanban,
  CheckSquare,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { isTaskOverdue, getDeadlineStatus } from '../../utils/dateUtils';
import { Permissions } from '../../constants/roles';
import Avatar from '../../components/ui/Avatar';
import { RoleBadge } from '../../components/ui/Badge';
import OverdueAlertBanner from '../../components/overdue/OverdueAlertBanner';

export default function WorkspaceOverviewPage() {
  const { currentUser, organization, activeWorkspace, activeWorkspaceId, switchWorkspace } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspaceData() {
      setLoading(true);
      try {
        const [allProjects, allTasks] = await Promise.all([
          projectService.listProjects(currentUser),
          taskService.listTasks({}),
        ]);
        setProjects(allProjects || []);
        setTasks(allTasks || []);
      } catch (e) {
        console.error('Failed to load workspace overview:', e);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaceData();
  }, [currentUser]);

  // Derived metrics
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const inReviewTasks = tasks.filter((t) => t.status === 'IN_REVIEW');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t.dueDate, t.status));

  const totalTasksCount = tasks.length;
  const completionPercentage =
    totalTasksCount > 0 ? Math.round((doneTasks.length / totalTasksCount) * 100) : 0;

  // Workload by member
  const memberWorkload = (organization?.workspaces || []).flatMap(() => []);
  const allUsers = [
    { id: 'user_owner_1', name: 'Alice Owner', role: 'OWNER', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', title: 'CTO' },
    { id: 'user_manager_1', name: 'Bob Manager', role: 'MANAGER', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', title: 'Engineering Lead' },
    { id: 'user_employee_1', name: 'Charlie Dev', role: 'EMPLOYEE', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', title: 'Senior Frontend' },
    { id: 'user_employee_2', name: 'David QA', role: 'EMPLOYEE', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', title: 'QA Specialist' },
  ];

  const userStats = allUsers.map((user) => {
    const assignedTasks = tasks.filter((t) => t.assigneeId === user.id);
    const userDone = assignedTasks.filter((t) => t.status === 'DONE').length;
    const userOverdue = assignedTasks.filter((t) => isTaskOverdue(t.dueDate, t.status)).length;
    return {
      user,
      total: assignedTasks.length,
      done: userDone,
      overdue: userOverdue,
    };
  });

  const canCreate = Permissions.canCreateProject(currentUser?.role);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Workspace Header & Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <Building2 className="w-4 h-4" />
            <span>{organization?.name || 'Taskora Enterprise'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{organization?.plan || 'Enterprise Pro'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Workspace Overview: {activeWorkspace?.name || 'Engineering & Product'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeWorkspace?.description || 'Cross-project sprint velocity, organizational capacity, and milestone delivery.'}
          </p>
        </div>

        {/* Switch Workspace Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Switch Workspace:</span>
          {organization?.workspaces?.map((ws) => {
            const isSelected = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => switchWorkspace(ws.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {ws.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overdue Alert Notification if active */}
      {overdueTasks.length > 0 && (
        <OverdueAlertBanner overdueCount={overdueTasks.length} />
      )}

      {/* Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{projects.length}</span>
            <span className="text-xs text-emerald-600 font-medium">
              {activeProjects.length} active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{completedProjects.length} completed milestones</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks Velocity</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{completionPercentage}%</span>
            <span className="text-xs text-slate-500 font-medium">completed</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Backlog</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{tasks.length}</span>
            <span className="text-xs text-amber-600 font-medium">
              {inProgressTasks.length} in progress
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{todoTasks.length} awaiting start</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Tasks</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              overdueTasks.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdueTasks.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">past deadline</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires immediate triage</p>
        </div>
      </div>

      {/* Main Grid: Projects Status & Workflow Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Projects Portfolio */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Projects Portfolio</h2>
                <p className="text-xs text-slate-500">Cross-team initiative health and delivery milestones</p>
              </div>
              <Link
                to="/app/projects"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => {
                const projTasks = tasks.filter((t) => t.projectId === proj.id);
                const doneCount = projTasks.filter((t) => t.status === 'DONE').length;
                const pct = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;

                return (
                  <Link
                    key={proj.id}
                    to={`/app/projects/${proj.id}`}
                    className="block p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {proj.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {proj.description}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        proj.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {proj.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span>{doneCount} of {projTasks.length} tasks completed</span>
                      <span className="font-bold text-slate-700">{pct}%</span>
                    </div>

                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Workflow Status Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Task Stage Distribution</h2>
            <p className="text-xs text-slate-500 mb-4">Current distribution of tasks across the delivery pipeline</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>To Do</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{todoTasks.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {totalTasksCount > 0 ? Math.round((todoTasks.length / totalTasksCount) * 100) : 0}% of pipeline
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>In Progress</span>
                </div>
                <p className="text-xl font-bold text-blue-900">{inProgressTasks.length}</p>
                <p className="text-[10px] text-blue-600/70 mt-0.5">
                  {totalTasksCount > 0 ? Math.round((inProgressTasks.length / totalTasksCount) * 100) : 0}% of pipeline
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>In Review</span>
                </div>
                <p className="text-xl font-bold text-purple-900">{inReviewTasks.length}</p>
                <p className="text-[10px] text-purple-600/70 mt-0.5">
                  {totalTasksCount > 0 ? Math.round((inReviewTasks.length / totalTasksCount) * 100) : 0}% of pipeline
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Done</span>
                </div>
                <p className="text-xl font-bold text-emerald-900">{doneTasks.length}</p>
                <p className="text-[10px] text-emerald-600/70 mt-0.5">
                  {totalTasksCount > 0 ? Math.round((doneTasks.length / totalTasksCount) * 100) : 0}% of pipeline
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Team Workload & Quick Shortcuts */}
        <div className="space-y-4">
          {/* Team Workload */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Team Capacity</h2>
                <p className="text-xs text-slate-500">Active workload per member</p>
              </div>
              <Link
                to="/app/team"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {userStats.map(({ user, total, done, overdue }) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar user={user} size="sm" showTooltip={false} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.title}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs font-bold text-slate-800">{total} tasks</span>
                      {overdue > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {overdue} overdue
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-600">{done} completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Quick Access</span>
            </div>
            <h3 className="text-base font-bold mb-1">Collaboration Hub</h3>
            <p className="text-xs text-blue-100/90 mb-4">
              Manage cross-department initiatives, review task attachments, and participate in discussion threads.
            </p>
            <div className="space-y-2">
              <Link
                to="/app/tasks"
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors"
              >
                <span>My Assigned Backlog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/app/notifications"
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors"
              >
                <span>Notification Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

