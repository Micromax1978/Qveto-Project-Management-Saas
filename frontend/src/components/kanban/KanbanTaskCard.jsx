import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Trash2,
  Edit2,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { PriorityBadge, LabelBadge } from '../ui/Badge';
import { TASK_STATUSES, TASK_STATUS_LIST } from '../../constants/status';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '../../constants/roles';

export default function KanbanTaskCard({
  task,
  onOpenDetails,
  onEdit,
  onDelete,
  onStatusChange,
  isDragging = false,
  onDragStart,
  onDragEnd,
}) {
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

  const assignee = users.find((u) => u.id === task.assigneeId);
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'DONE';

  const canDelete = Permissions.canDeleteTask(currentUser?.role);

  // Accessible alternatives to drag-and-drop: other available statuses to move to
  const alternativeStatuses = TASK_STATUS_LIST.filter((s) => s.id !== task.status);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpenDetails(task)}
      tabIndex={0}
      role="article"
      aria-label={`Task: ${task.title}. Status: ${TASK_STATUSES[task.status]?.label || task.status}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(task);
        }
      }}
      className={`group bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing select-none relative focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
        isDragging
          ? 'opacity-40 border-blue-400 scale-95 shadow-lg'
          : isOverdue
          ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
          : 'border-slate-200/90 hover:border-blue-300'
      }`}
    >
      {/* Top row: Task code, Priority badge, & Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 font-mono">
            {task.taskCode || 'TSK'}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Action / Accessibility menu */}
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Task options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenDetails(task);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-left"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>View Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(task);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Task</span>
              </button>

              {/* Accessible Quick Status Mover */}
              <div className="pt-1.5 mt-1 border-t border-slate-100">
                <span className="px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Move to Status
                </span>
                {alternativeStatuses.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onStatusChange(task.id, st.id);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <span>{st.label}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>

              {canDelete && (
                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 mb-2">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.labels.slice(0, 3).map((lbl) => (
            <LabelBadge key={lbl} label={lbl} />
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Subtasks Progress Fraction */}
      {subtasks.length > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span className="inline-flex items-center gap-1 font-medium">
              <CheckSquare className="w-3 h-3 text-slate-400" />
              <span>Subtasks</span>
            </span>
            <span className="font-semibold text-slate-700">
              {completedSubtasks}/{subtasks.length}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                completedSubtasks === subtasks.length ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{
                width: `${(completedSubtasks / subtasks.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Card Footer: Due Date & Assignee Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
        {/* Due date with overdue alert styling */}
        {task.dueDate ? (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              isOverdue
                ? 'text-rose-600 font-semibold'
                : 'text-slate-500'
            }`}
            title={isOverdue ? 'Task is past its due date!' : 'Target completion date'}
          >
            {isOverdue ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>{task.dueDate}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">No due date</span>
        )}

        {/* Assignee Avatar */}
        <Avatar user={assignee} size="xs" />
      </div>
    </div>
  );
}
