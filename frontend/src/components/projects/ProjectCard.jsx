import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { StatusBadge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '../../constants/roles';

export default function ProjectCard({
  project,
  tasks = [],
  onDelete,
}) {
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute metrics from real project tasks
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Resolve member objects
  const projectMembers = (project.members || [])
    .map((memberId) => users.find((u) => u.id === memberId))
    .filter(Boolean);

  const owner = users.find((u) => u.id === project.createdById);
  const canDelete = Permissions.canDeleteProject(currentUser?.role);

  const formattedDueDate = project.dueDate
    ? new Date(project.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No due date';

  return (
    <div
      onClick={() => navigate(`/app/projects/${project.id}`)}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer relative"
    >
      <div>
        {/* Top Header: Icon, Title, Status & Context Menu */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {project.name}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Lead: {owner?.name || 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <StatusBadge status={project.status || 'ACTIVE'} />

            {/* Context Action Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Project actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-20 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/app/projects/${project.id}`);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-left"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/app/projects/${project.id}?tab=board`);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-left"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Board</span>
                  </button>

                  {canDelete && onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(project);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left border-t border-slate-100 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {project.description || 'No description provided for this project.'}
        </p>
      </div>

      {/* Progress & Task Completion Indicator */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Progress</span>
            <span className="font-bold text-slate-800">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer: Due date, Task counts & Member avatars */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>
                <strong>{completedTasks}</strong>/{totalTasks} tasks
              </span>
            </span>

            <span className="inline-flex items-center gap-1 hidden sm:inline-flex">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDueDate}</span>
            </span>
          </div>

          {/* Member Avatars stack */}
          <div className="flex items-center -space-x-1.5">
            {projectMembers.slice(0, 3).map((member) => (
              <Avatar key={member.id} user={member} size="xs" />
            ))}
            {projectMembers.length > 3 && (
              <span className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                +{projectMembers.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
