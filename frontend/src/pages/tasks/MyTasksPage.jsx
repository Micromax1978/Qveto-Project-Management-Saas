import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List,
  Loader2,
} from 'lucide-react';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import TaskListView from '../../components/tasks/TaskListView';
import TaskFilters from '../../components/tasks/TaskFilters';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import TaskDetailsPanel from '../../components/tasks/TaskDetailsPanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function MyTasksPage({ isCreateTaskOpen, onCloseCreateTask }) {
  const { currentUser, users } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board');

  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    assigneeId: 'ALL',
    overdueOnly: false,
  });

  const [localCreateOpen, setLocalCreateOpen] = useState(false);
  const [selectedColumnStatus, setSelectedColumnStatus] = useState('TODO');
  const [editingTask, setEditingTask] = useState(null);
  const [detailedTask, setDetailedTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isModalVisible = isCreateTaskOpen || localCreateOpen || Boolean(editingTask);

  const handleCloseModal = () => {
    setLocalCreateOpen(false);
    setEditingTask(null);
    if (onCloseCreateTask) onCloseCreateTask();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [allProjects, allTasks] = await Promise.all([
        projectService.listProjects(currentUser),
        taskService.listTasks(null, {}, currentUser),
      ]);
      setProjects(allProjects);
      // Filter by tasks assigned to current user
      const myAssigned = allTasks.filter((t) => t.assigneeId === currentUser.id);
      setTasks(myAssigned);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error loading tasks',
        message: err.message || 'Unable to retrieve assigned tasks.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Combined filtered tasks
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

    if (filters.overdueOnly) {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'DONE');
    }

    return result;
  }, [tasks, filters]);

  const handleOpenAddTask = (status = 'TODO') => {
    setSelectedColumnStatus(status);
    setLocalCreateOpen(true);
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
          message: `Task "${updated.title}" updated.`,
        });
      } else {
        const created = await taskService.createTask(
          { ...formData, assigneeId: currentUser.id },
          currentUser
        );
        setTasks((prev) => [created, ...prev]);
        showToast({
          type: 'success',
          title: 'Task Created',
          message: `Task "${created.title}" added to your backlog.`,
        });
      }
      handleCloseModal();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Unable to save task.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const previous = [...tasks];
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
      setTasks(previous);
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await taskService.deleteTask(deleteTarget.id, currentUser);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (detailedTask?.id === deleteTarget.id) setDetailedTask(null);
      setDeleteTarget(null);
      showToast({ type: 'success', message: 'Task deleted successfully.' });
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeTaskProject = projects.find((p) => p.id === detailedTask?.projectId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              My Tasks
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {tasks.length} Assigned
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Prioritized work items and deliverables assigned to {currentUser?.name}.
          </p>
        </div>

        {/* View mode toggle & Add Task button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'board'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddTask('TODO')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task Filters */}
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

      {/* Content Rendering */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold">Loading your assigned tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={
            filters.search || filters.status !== 'ALL' || filters.priority !== 'ALL'
              ? 'No matching tasks'
              : 'You have no assigned tasks'
          }
          description={
            filters.search || filters.status !== 'ALL'
              ? 'Try modifying your search or filter options.'
              : 'Tasks assigned to you across any project will appear on this board.'
          }
          actionLabel="Create Task"
          onAction={() => handleOpenAddTask('TODO')}
        />
      ) : viewMode === 'board' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onAddTask={handleOpenAddTask}
          onOpenTaskDetails={setDetailedTask}
          onEditTask={setEditingTask}
          onDeleteTask={setDeleteTarget}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          onOpenDetails={setDetailedTask}
          onEdit={setEditingTask}
          onDelete={setDeleteTarget}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Task Creation / Edit Modal */}
      <TaskFormModal
        isOpen={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSaveTask}
        projects={projects}
        defaultProjectId={projects[0]?.id || ''}
        defaultStatus={selectedColumnStatus}
        initialTask={editingTask}
        isLoading={isSubmitting}
      />

      {/* Task Details Panel */}
      <TaskDetailsPanel
        task={detailedTask}
        project={activeTaskProject}
        isOpen={Boolean(detailedTask)}
        onClose={() => setDetailedTask(null)}
        onEdit={(t) => setEditingTask(t)}
        onDelete={(t) => setDeleteTarget(t)}
        onStatusChange={handleStatusChange}
        onPriorityChange={async (id, p) => {
          const updated = await taskService.updateTask(id, { priority: p }, currentUser);
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          if (detailedTask?.id === id) setDetailedTask(updated);
        }}
        onAssigneeChange={async (id, a) => {
          const updated = await taskService.updateTask(id, { assigneeId: a }, currentUser);
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          if (detailedTask?.id === id) setDetailedTask(updated);
        }}
        onToggleSubtask={async (id, sId) => {
          const updated = await taskService.toggleSubtask(id, sId, currentUser);
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          if (detailedTask?.id === id) setDetailedTask(updated);
        }}
        onAddSubtask={async (id, title) => {
          const updated = await taskService.addSubtask(id, title, currentUser);
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          if (detailedTask?.id === id) setDetailedTask(updated);
        }}
        onDeleteSubtask={async (id, sId) => {
          const updated = await taskService.deleteSubtask(id, sId, currentUser);
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          if (detailedTask?.id === id) setDetailedTask(updated);
        }}
        onAddLabel={async (id, label) => {
          const current = detailedTask?.labels || [];
          if (!current.includes(label)) {
            const updated = await taskService.updateTask(
              id,
              { labels: [...current, label] },
              currentUser
            );
            setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
            if (detailedTask?.id === id) setDetailedTask(updated);
          }
        }}
        onRemoveLabel={async (id, label) => {
          const current = detailedTask?.labels || [];
          const updated = await taskService.updateTask(
            id,
            { labels: current.filter((l) => l !== label) },
            currentUser
          );
          setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
          if (detailedTask?.id === id) setDetailedTask(updated);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete task "${deleteTarget?.title}"?`}
        confirmText="Delete Task"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
