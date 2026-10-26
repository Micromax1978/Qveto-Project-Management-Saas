import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  FolderKanban,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import ProjectOverviewTab from '../../components/projects/ProjectOverviewTab';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskListView from '../../components/tasks/TaskListView';
import TaskFilters from '../../components/tasks/TaskFilters';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import TaskDetailsPanel from '../../components/tasks/TaskDetailsPanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProjectDetailPage({ isCreateTaskOpen, onCloseCreateTask }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const { currentUser, users } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Task Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    assigneeId: 'ALL',
    overdueOnly: false,
  });

  // Modal / Drawer state
  const [localCreateTaskOpen, setLocalCreateTaskOpen] = useState(false);
  const [selectedColumnStatus, setSelectedColumnStatus] = useState('TODO');
  const [editingTask, setEditingTask] = useState(null);
  const [detailedTask, setDetailedTask] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const isTaskModalVisible = isCreateTaskOpen || localCreateTaskOpen || Boolean(editingTask);

  const handleCloseTaskModal = () => {
    setLocalCreateTaskOpen(false);
    setEditingTask(null);
    if (onCloseCreateTask) onCloseCreateTask();
  };

  const loadProjectAndTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, taskData] = await Promise.all([
        projectService.getProjectById(projectId, currentUser),
        taskService.listTasks(projectId, {}, currentUser),
      ]);
      setProject(projData);
      setTasks(taskData);
    } catch (err) {
      setError(err);
      showToast({
        type: 'error',
        title: 'Project Error',
        message: err.message || 'Unable to load project workspace.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && currentUser) {
      loadProjectAndTasks();
    }
  }, [projectId, currentUser]);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.taskCode && t.taskCode.toLowerCase().includes(q))
      );
    }

    if (filters.status !== 'ALL') {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.priority !== 'ALL') {
      result = result.filter((t) => t.priority === filters.priority);
    }

    if (filters.assigneeId !== 'ALL') {
      if (filters.assigneeId === 'UNASSIGNED') {
        result = result.filter((t) => !t.assigneeId);
      } else {
        result = result.filter((t) => t.assigneeId === filters.assigneeId);
      }
    }

    if (filters.overdueOnly) {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'DONE');
    }

    return result;
  }, [tasks, filters]);

  // Task CRUD Handlers
  const handleOpenAddTask = (columnStatus = 'TODO') => {
    setSelectedColumnStatus(columnStatus);
    setLocalCreateTaskOpen(true);
  };

  const handleSaveTask = async (formData) => {
    try {
      setIsSubmittingTask(true);
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask.id, formData, currentUser);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        if (detailedTask?.id === updated.id) setDetailedTask(updated);
        showToast({
          type: 'success',
          title: 'Task Updated',
          message: `Task "${updated.title}" was successfully updated.`,
        });
      } else {
        const created = await taskService.createTask(
          { ...formData, projectId },
          currentUser
        );
        setTasks((prev) => [created, ...prev]);
        showToast({
          type: 'success',
          title: 'Task Created',
          message: `Task "${created.title}" added to backlog.`,
        });
      }
      handleCloseTaskModal();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Unable to save task.',
      });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (detailedTask?.id === taskId) {
      setDetailedTask((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      const updated = await taskService.updateStatus(taskId, newStatus, currentUser);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (detailedTask?.id === taskId) setDetailedTask(updated);
    } catch (err) {
      // Rollback on failure
      setTasks(previousTasks);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update task status.',
      });
    }
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    try {
      const updated = await taskService.updateTask(taskId, { priority: newPriority }, currentUser);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (detailedTask?.id === taskId) setDetailedTask(updated);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update priority.',
      });
    }
  };

  const handleAssigneeChange = async (taskId, newAssigneeId) => {
    try {
      const updated = await taskService.updateTask(
        taskId,
        { assigneeId: newAssigneeId },
        currentUser
      );
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (detailedTask?.id === taskId) setDetailedTask(updated);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Could not update assignee.',
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    try {
      setIsDeletingTask(true);
      await taskService.deleteTask(deleteTaskTarget.id, currentUser);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTaskTarget.id));
      if (detailedTask?.id === deleteTaskTarget.id) setDetailedTask(null);
      setDeleteTaskTarget(null);
      showToast({
        type: 'success',
        title: 'Task Deleted',
        message: `Task was deleted from the project.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete task.',
      });
    } finally {
      setIsDeletingTask(false);
    }
  };

  // Subtask handlers
  const handleToggleSubtask = async (taskId, subtaskId) => {
    try {
      const updated = await taskService.toggleSubtask(taskId, subtaskId, currentUser);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (detailedTask?.id === taskId) setDetailedTask(updated);
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleAddSubtask = async (taskId, title) => {
    try {
      const updated = await taskService.addSubtask(taskId, title, currentUser);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (detailedTask?.id === taskId) setDetailedTask(updated);
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      const updated = await taskService.deleteSubtask(taskId, subtaskId, currentUser);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (detailedTask?.id === taskId) setDetailedTask(updated);
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  // Label handlers
  const handleAddLabel = async (taskId, label) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const current = task.labels || [];
    if (current.includes(label)) return;
    const labels = [...current, label];
    const updated = await taskService.updateTask(taskId, { labels }, currentUser);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (detailedTask?.id === taskId) setDetailedTask(updated);
  };

  const handleRemoveLabel = async (taskId, label) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const labels = (task.labels || []).filter((l) => l !== label);
    const updated = await taskService.updateTask(taskId, { labels }, currentUser);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (detailedTask?.id === taskId) setDetailedTask(updated);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">Loading project workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertCircle}
          title={error?.status === 403 ? 'Access Forbidden' : 'Project Not Found'}
          description={
            error?.message || 'The requested project does not exist or you do not have permission to view it.'
          }
          actionLabel="Back to Projects"
          onAction={() => navigate('/app/projects')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Project Header */}
      <div>
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {project.name}
                </h1>
                <StatusBadge status={project.status || 'ACTIVE'} />
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl line-clamp-1">
                {project.description || 'Sprint initiative and backlog execution.'}
              </p>
            </div>
          </div>

          {/* Quick Context Action: Add Task */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddTask('TODO')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Project Navigation Tabs: Overview, Board, List */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-4">
        <div className="flex items-center gap-2 -mb-px">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('board')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'board'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Board</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('list')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Active on Board and List Views) */}
      {activeTab !== 'overview' && (
        <TaskFilters
          filters={filters}
          onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
          onResetFilters={() =>
            setFilters({
              search: '',
              status: 'ALL',
              priority: 'ALL',
              assigneeId: 'ALL',
              overdueOnly: false,
            })
          }
          users={users}
          totalCount={filteredTasks.length}
        />
      )}

      {/* Tab Content Rendering */}
      {activeTab === 'overview' && (
        <ProjectOverviewTab
          project={project}
          tasks={tasks}
          users={users}
          onSwitchTab={handleTabChange}
          onOpenTaskDetails={setDetailedTask}
        />
      )}

      {activeTab === 'board' && (
        <KanbanBoard
          tasks={filteredTasks}
          onAddTask={handleOpenAddTask}
          onOpenTaskDetails={setDetailedTask}
          onEditTask={setEditingTask}
          onDeleteTask={setDeleteTaskTarget}
          onStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'list' && (
        <TaskListView
          tasks={filteredTasks}
          onOpenDetails={setDetailedTask}
          onEdit={setEditingTask}
          onDelete={setDeleteTaskTarget}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create / Edit Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalVisible}
        onClose={handleCloseTaskModal}
        onSubmit={handleSaveTask}
        projects={[project]}
        defaultProjectId={project.id}
        defaultStatus={selectedColumnStatus}
        initialTask={editingTask}
        isLoading={isSubmittingTask}
      />

      {/* Detailed Task Side Panel */}
      <TaskDetailsPanel
        task={detailedTask}
        project={project}
        isOpen={Boolean(detailedTask)}
        onClose={() => setDetailedTask(null)}
        onEdit={(t) => {
          setEditingTask(t);
        }}
        onDelete={(t) => {
          setDeleteTaskTarget(t);
        }}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onAssigneeChange={handleAssigneeChange}
        onToggleSubtask={handleToggleSubtask}
        onAddSubtask={handleAddSubtask}
        onDeleteSubtask={handleDeleteSubtask}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
      />

      {/* Confirm Task Deletion Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTaskTarget)}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to permanently delete task "${deleteTaskTarget?.title}"?`}
        confirmText="Delete Task"
        isDanger={true}
        isLoading={isDeletingTask}
      />
    </div>
  );
}
