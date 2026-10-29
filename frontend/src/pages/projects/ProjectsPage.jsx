import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectFilters from '../../components/projects/ProjectFilters';
import ProjectFormModal from '../../components/projects/ProjectFormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Permissions } from '../../constants/roles';

export default function ProjectsPage({ isCreateModalOpen, onCloseCreateModal }) {
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Local state for modal if opened from page button
  const [localCreateOpen, setLocalCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isModalVisible = isCreateModalOpen || localCreateOpen;

  const handleCloseModal = () => {
    setLocalCreateOpen(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [projList, taskList] = await Promise.all([
        projectService.listProjects(currentUser),
        taskService.listTasks(null, {}, currentUser),
      ]);
      setProjects(projList);
      setTasks(taskList);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed to load projects',
        message: err.message || 'Unable to retrieve workspace projects.',
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

  // Client filtering & sorting
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    return result;
  }, [projects, search, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, currentPage]);

  const canCreate = Permissions.canCreateProject(currentUser?.role);

  const handleCreateProject = async (formData) => {
    try {
      setIsSubmitting(true);
      const newProj = await projectService.createProject(formData, currentUser);
      setProjects((prev) => [newProj, ...prev]);
      handleCloseModal();
      showToast({
        type: 'success',
        title: 'Project Created',
        message: `Project "${newProj.name}" was successfully provisioned.`,
      });
      navigate(`/app/projects/${newProj.id}`);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Unable to create project.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await projectService.deleteProject(deleteTarget.id, currentUser);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast({
        type: 'success',
        title: 'Project Deleted',
        message: `Project "${deleteTarget.name}" has been removed.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Could not delete project.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Projects
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {projects.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track initiative roadmaps, sprint deliverables, and team capacity.
          </p>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            type="button"
            onClick={() => setLocalCreateOpen(true)}
            disabled={!canCreate}
            title={
              !canCreate
                ? 'Only Managers and Organization Owners can create projects'
                : 'Create Project'
            }
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              canCreate
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
            }`}
          >
            {canCreate ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Role notice for Employee if restricted */}
      {!canCreate && (
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Employee Access:</strong> You are viewing projects where you are assigned as a member. Project creation is reserved for Managers and Organization Owners.
            </span>
          </div>
        </div>
      )}

      {/* Filter and View Controls */}
      <ProjectFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={filteredProjects.length}
      />

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="w-3/4 h-4 rounded bg-slate-100" />
                <div className="w-full h-3 rounded bg-slate-100" />
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search || statusFilter !== 'ALL' ? 'No matching projects' : 'No projects yet'}
          description={
            search || statusFilter !== 'ALL'
              ? 'Try modifying your search or clearing the status filter to see other projects.'
              : canCreate
              ? 'Get started by creating your first project workspace for your team.'
              : 'You have not been assigned to any project in this organization yet.'
          }
          actionLabel={canCreate ? 'Create First Project' : undefined}
          onAction={canCreate ? () => setLocalCreateOpen(true) : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        /* Structured List View */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Progress</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5">Members</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProjects.map((project) => {
                  const projectTasks = tasks.filter((t) => t.projectId === project.id);
                  const total = projectTasks.length;
                  const completed = projectTasks.filter((t) => t.status === 'DONE').length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                  const projectMembers = (project.members || [])
                    .map((id) => users.find((u) => u.id === id))
                    .filter(Boolean);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => navigate(`/app/projects/${project.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{project.name}</div>
                        <div className="text-slate-500 text-[11px] line-clamp-1 max-w-xs">
                          {project.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={project.status || 'ACTIVE'} />
                      </td>
                      <td className="px-4 py-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700">
                          <span>{percent}%</span>
                          <span className="text-slate-400 font-normal">
                            {completed}/{total}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {project.dueDate || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center -space-x-1.5">
                          {projectMembers.slice(0, 3).map((m) => (
                            <Avatar key={m.id} user={m} size="xs" />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
          <p className="text-slate-500">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Project Creation Dialog */}
      <ProjectFormModal
        isOpen={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project Workspace"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All associated tasks and Kanban states will be deleted.`}
        confirmText="Delete Project"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
