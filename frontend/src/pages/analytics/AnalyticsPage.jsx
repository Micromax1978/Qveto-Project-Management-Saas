import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  Download,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { analyticsService } from '../../services/analyticsService';
import { ROLES } from '../../constants/roles';
import StatMetricCard from '../../components/analytics/StatMetricCard';
import TaskStatusDonutChart from '../../components/analytics/TaskStatusDonutChart';
import ProjectProgressBarChart from '../../components/analytics/ProjectProgressBarChart';
import TeamWorkloadBarChart from '../../components/analytics/TeamWorkloadBarChart';
import OverdueAnalyticsCard from '../../components/analytics/OverdueAnalyticsCard';
import DeadlineHorizonCard from '../../components/analytics/DeadlineHorizonCard';
import DataSyncStatus from '../../components/common/DataSyncStatus';
import { useToast } from '../../context/ToastContext';

export default function AnalyticsPage() {
  const { currentUser, organization, users } = useAuth();
  const { showToast } = useToast();

  const [rawProjects, setRawProjects] = useState([]);
  const [rawTasks, setRawTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filter States
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  const isEmployee = currentUser?.role === ROLES.EMPLOYEE;
  const isManager = currentUser?.role === ROLES.MANAGER;
  const isOwner = currentUser?.role === ROLES.OWNER;

  // Load live data
  const loadData = useCallback(async () => {
    try {
      const [projectsList, tasksList] = await Promise.all([
        projectService.listProjects(currentUser),
        taskService.listTasks({}),
      ]);
      setRawProjects(projectsList || []);
      setRawTasks(tasksList || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      showToast?.('Unable to refresh analytics data', 'error');
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadData();
      setLoading(false);
    }
    init();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    showToast?.('Analytics synchronized with latest data', 'info');
  };

  // Filter application
  const { filteredTasks, filteredProjects } = useMemo(() => {
    return analyticsService.filterData(
      rawTasks,
      rawProjects,
      {
        projectId: selectedProject,
        status: selectedStatus,
        assigneeId: selectedAssignee,
        dateRange: selectedDateRange,
      },
      currentUser
    );
  }, [rawTasks, rawProjects, selectedProject, selectedStatus, selectedAssignee, selectedDateRange, currentUser]);

  // Derived Metrics & Chart Datasets
  const metrics = useMemo(() => {
    return analyticsService.calculateMetrics(filteredTasks, filteredProjects);
  }, [filteredTasks, filteredProjects]);

  const statusDistribution = useMemo(() => {
    return analyticsService.getStatusDistribution(filteredTasks);
  }, [filteredTasks]);

  const projectProgressData = useMemo(() => {
    return analyticsService.getProjectProgress(filteredProjects, filteredTasks);
  }, [filteredProjects, filteredTasks]);

  const teamWorkloadData = useMemo(() => {
    return analyticsService.getTeamWorkload(users || [], filteredTasks);
  }, [users, filteredTasks]);

  const overdueAndDeadlines = useMemo(() => {
    return analyticsService.getOverdueAndDeadlines(filteredTasks, filteredProjects, users || []);
  }, [filteredTasks, filteredProjects, users]);

  // Export CSV Handler
  const handleExportCSV = () => {
    try {
      const csvContent = analyticsService.generateCSVReport(
        metrics,
        filteredTasks,
        filteredProjects
      );
      const filename = `taskora_analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
      analyticsService.downloadCSVReport(filename, csvContent);
      showToast?.('Analytics report exported as CSV', 'success');
    } catch (e) {
      showToast?.('Failed to export report', 'error');
    }
  };

  const hasActiveFilters =
    selectedProject !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedAssignee !== 'ALL' ||
    selectedDateRange !== 'all';

  const clearFilters = () => {
    setSelectedProject('ALL');
    setSelectedStatus('ALL');
    setSelectedAssignee('ALL');
    setSelectedDateRange('all');
  };

  // Role contextual titles
  const dashboardTitle = isEmployee
    ? 'My Work Analytics & Performance'
    : isManager
    ? 'Manager Analytics & Project Health'
    : 'Executive Analytics & Reporting';

  const dashboardSubtitle = isEmployee
    ? 'Track your personal completion velocity, upcoming deadlines, and backlog focus.'
    : isManager
    ? 'Cross-initiative delivery velocity, team workload balance, and deadline triage.'
    : 'Organization-wide delivery velocity, enterprise health, and multi-team resource allocation.';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>{organization?.name || 'Taskora'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Live Metrics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {dashboardTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{dashboardSubtitle}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <DataSyncStatus
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
          />

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors shadow-xs"
            title="Download CSV report of current metrics and task list"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>Analytics Filters:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 lg:max-w-4xl">
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by project"
            >
              <option value="ALL">All Projects</option>
              {rawProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Completed</option>
            </select>

            {/* Assignee Filter (for Owner/Manager) */}
            {!isEmployee ? (
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by team member"
              >
                <option value="ALL">All Team Members</option>
                {(users || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-2.5 py-1.5 text-xs bg-slate-100/60 border border-slate-200 rounded-xl text-slate-500 truncate flex items-center">
                <span>Personal View ({currentUser?.name})</span>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Completion Rate"
          value={`${metrics.taskCompletionRate}%`}
          subtext={`${metrics.completedTasksCount} of ${metrics.totalTasks} eligible tasks`}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          trend={{ value: `${metrics.completedTasksCount} done`, isPositive: true, label: 'in pipeline' }}
        />

        <StatMetricCard
          title="On-Time Delivery"
          value={`${metrics.onTimeCompletionRate}%`}
          subtext="Delivered on or before due date"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={{ value: 'Reliability', isPositive: true, label: 'adherence score' }}
        />

        <StatMetricCard
          title="Overdue Backlog"
          value={metrics.overdueCount}
          subtext={metrics.overdueCount > 0 ? 'Requires immediate action' : 'Zero overdue items'}
          icon={AlertTriangle}
          iconColor={metrics.overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}
          iconBg={metrics.overdueCount > 0 ? 'bg-rose-50' : 'bg-slate-50'}
          trend={metrics.overdueCount > 0 ? { value: 'Past Deadline', isPositive: false, label: 'triage queue' } : null}
        />

        <StatMetricCard
          title={isEmployee ? 'My Active Work' : 'Assignment Coverage'}
          value={isEmployee ? `${metrics.inProgressTasksCount + metrics.todoTasksCount}` : `${metrics.assignmentCoverage}%`}
          subtext={isEmployee ? `${metrics.inProgressTasksCount} currently in progress` : `${metrics.totalTasks} active tasks assigned`}
          icon={FolderKanban}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          trend={{ value: `${metrics.activeProjectsCount} active`, isPositive: 'neutral', label: 'projects' }}
        />
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task Status Distribution (5 Cols) */}
        <div className="lg:col-span-5">
          <TaskStatusDonutChart data={statusDistribution} />
        </div>

        {/* Project Delivery Progress (7 Cols) */}
        <div className="lg:col-span-7">
          <ProjectProgressBarChart projects={projectProgressData} />
        </div>

        {/* Team Workload (for Managers & Owners) */}
        {!isEmployee && (
          <div className="lg:col-span-7">
            <TeamWorkloadBarChart workload={teamWorkloadData} />
          </div>
        )}

        {/* Overdue Task Analytics & Deadlines (5 or 12 Cols) */}
        <div className={!isEmployee ? 'lg:col-span-5 space-y-6' : 'lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6'}>
          <OverdueAnalyticsCard
            overdueTasks={overdueAndDeadlines.overdueTasks}
            overdueByProject={overdueAndDeadlines.overdueByProject}
            overdueByAssignee={overdueAndDeadlines.overdueByAssignee}
          />

          <DeadlineHorizonCard
            dueTodayTasks={overdueAndDeadlines.dueTodayTasks}
            dueTomorrowTasks={overdueAndDeadlines.dueTomorrowTasks}
            dueThisWeekTasks={overdueAndDeadlines.dueThisWeekTasks}
          />
        </div>
      </div>
    </div>
  );
}
