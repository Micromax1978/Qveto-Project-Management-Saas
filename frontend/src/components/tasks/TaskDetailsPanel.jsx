import React, { useState } from 'react';
import {
  X,
  Calendar,
  CheckSquare,
  AlertCircle,
  Trash2,
  Edit2,
  Plus,
  MessageSquare,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { StatusBadge, PriorityBadge, LabelBadge } from '../ui/Badge';
import { TASK_STATUS_LIST, TASK_PRIORITY_LIST, DEFAULT_LABELS } from '../../constants/status';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '../../constants/roles';

export default function TaskDetailsPanel({
  task,
  project,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onAddLabel,
  onRemoveLabel,
}) {
  const { currentUser, users } = useAuth();
  const [newSubtask, setNewSubtask] = useState('');
  const [labelSelectorOpen, setLabelSelectorOpen] = useState(false);

  if (!isOpen || !task) return null;

  const assignee = users.find((u) => u.id === task.assigneeId);
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'DONE';

  const canDelete = Permissions.canDeleteTask(currentUser?.role);

  const handleAddSubtaskSubmit = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Task Details"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-mono">
              {task.taskCode || 'TSK'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-700">
              {project?.name || 'Project'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors ml-1"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
            {task.createdAt && (
              <p className="text-[11px] text-slate-400 mt-1">
                Created {new Date(task.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Quick Attribute Controls (Status, Priority, Assignee, Due Date) */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs">
            {/* Status */}
            <div>
              <span className="text-slate-500 block mb-1 font-medium">Status</span>
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
              >
                {TASK_STATUS_LIST.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <span className="text-slate-500 block mb-1 font-medium">Priority</span>
              <select
                value={task.priority}
                onChange={(e) => onPriorityChange(task.id, e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
              >
                {TASK_PRIORITY_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <span className="text-slate-500 block mb-1 font-medium">Assignee</span>
              <select
                value={task.assigneeId || ''}
                onChange={(e) => onAssigneeChange(task.id, e.target.value || null)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <span className="text-slate-500 block mb-1 font-medium">Due Date</span>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white ${
                  isOverdue ? 'border-rose-300 text-rose-700 font-bold' : 'border-slate-200 text-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{task.dueDate || 'Not set'}</span>
                {isOverdue && (
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-1 rounded ml-auto">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px]">
              {task.description || 'No detailed description provided for this task.'}
            </div>
          </div>

          {/* Labels & Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Labels
              </h3>
              <button
                type="button"
                onClick={() => setLabelSelectorOpen(!labelSelectorOpen)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                {labelSelectorOpen ? 'Done' : '+ Manage Labels'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(task.labels || []).map((lbl) => (
                <LabelBadge
                  key={lbl}
                  label={lbl}
                  onRemove={(l) => onRemoveLabel(task.id, l)}
                />
              ))}
              {(!task.labels || task.labels.length === 0) && (
                <span className="text-xs text-slate-400">No labels applied.</span>
              )}
            </div>

            {/* Label Manager Popover */}
            {labelSelectorOpen && (
              <div className="mt-3 p-3 rounded-xl border border-blue-200 bg-blue-50/50 animate-in fade-in duration-150">
                <p className="text-[11px] font-bold text-blue-900 mb-2">
                  Select tags to attach:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_LABELS.map((lbl) => {
                    const isSelected = (task.labels || []).includes(lbl.name);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            onRemoveLabel(task.id, lbl.name);
                          } else {
                            onAddLabel(task.id, lbl.name);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        #{lbl.name} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Subtasks Checklist */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Subtasks Checklist
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {completedSubtasks}/{subtasks.length} ({progressPercent}%)
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Subtask list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 transition-colors text-xs"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={st.isCompleted}
                      onChange={() => onToggleSubtask(task.id, st.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span
                      className={`truncate ${
                        st.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                      }`}
                    >
                      {st.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onDeleteSubtask(task.id, st.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    aria-label="Delete subtask"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Form */}
            <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add new subtask item..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Week 3 Feature Placeholders Notice */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Discussion & Attachments</span>
                </span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Coming in Week 3
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Task comments, file attachments, and audit activity stream will be integrated during Week 3 collaboration sprints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
