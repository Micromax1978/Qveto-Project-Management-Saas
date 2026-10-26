import React, { useState, useEffect } from 'react';
import { Loader2, Plus, X, Calendar, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { TASK_STATUS_LIST, TASK_PRIORITY_LIST, DEFAULT_LABELS } from '../../constants/status';
import { useAuth } from '../../context/AuthContext';

export default function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  projects = [],
  defaultProjectId = '',
  defaultStatus = 'TODO',
  initialTask = null,
  isLoading = false,
}) {
  const { users } = useAuth();
  const isEditing = Boolean(initialTask);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: defaultProjectId,
    status: defaultStatus,
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    labels: [],
    subtasks: [],
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title || '',
        description: initialTask.description || '',
        projectId: initialTask.projectId || defaultProjectId,
        status: initialTask.status || 'TODO',
        priority: initialTask.priority || 'MEDIUM',
        assigneeId: initialTask.assigneeId || '',
        dueDate: initialTask.dueDate || '',
        labels: initialTask.labels || [],
        subtasks: initialTask.subtasks || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        projectId: defaultProjectId || (projects[0]?.id || ''),
        status: defaultStatus || 'TODO',
        priority: 'MEDIUM',
        assigneeId: '',
        dueDate: '',
        labels: [],
        subtasks: [],
      });
    }
    setErrors({});
    setTouched({});
    setNewSubtaskTitle('');
  }, [initialTask, defaultProjectId, defaultStatus, projects, isOpen]);

  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value || !value.trim()) return 'Task title is required.';
        if (value.trim().length < 3) return 'Task title must be at least 3 characters.';
        return '';
      case 'projectId':
        if (!value) return 'Please select a project.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      isCompleted: false,
    };
    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, newSub],
    }));
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (subId) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((s) => s.id !== subId),
    }));
  };

  const toggleLabel = (labelName) => {
    const norm = labelName.toLowerCase();
    setFormData((prev) => {
      const exists = prev.labels.includes(norm);
      const labels = exists ? prev.labels.filter((l) => l !== norm) : [...prev.labels, norm];
      return { ...prev, labels };
    });
  };

  const handleAddCustomLabel = (e) => {
    e.preventDefault();
    if (!newCustomLabel.trim()) return;
    const norm = newCustomLabel.trim().toLowerCase();
    if (!formData.labels.includes(norm)) {
      setFormData((prev) => ({
        ...prev,
        labels: [...prev.labels, norm],
      }));
    }
    setNewCustomLabel('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const titleErr = validateField('title', formData.title);
    const projectErr = validateField('projectId', formData.projectId);

    setErrors({ title: titleErr, projectId: projectErr });
    setTouched({ title: true, projectId: true });

    if (titleErr || projectErr) return;

    onSubmit(formData);
  };

  const isFormValid =
    formData.title.trim().length >= 3 && Boolean(formData.projectId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description="Plan execution details, priority, due date, and team assignment."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Task Title */}
        <div>
          <label htmlFor="task-title" className="block text-xs font-bold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Build responsive layout for mobile screens"
            disabled={isLoading}
            className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
              errors.title && touched.title
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
            }`}
          />
          {errors.title && touched.title && (
            <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        {/* Task Description */}
        <div>
          <label htmlFor="task-description" className="block text-xs font-bold text-slate-700 mb-1">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="task-description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Add relevant specifications, acceptance criteria, or technical details..."
            disabled={isLoading}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          />
        </div>

        {/* Project & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="task-project" className="block text-xs font-bold text-slate-700 mb-1">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              id="task-project"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white text-slate-900 focus:outline-hidden focus:ring-2 transition-all ${
                errors.projectId && touched.projectId
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
              }`}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-assignee" className="block text-xs font-bold text-slate-700 mb-1">
              Assignee
            </label>
            <select
              id="task-assignee"
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status, Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="task-status" className="block text-xs font-bold text-slate-700 mb-1">
              Status
            </label>
            <select
              id="task-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {TASK_STATUS_LIST.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-xs font-bold text-slate-700 mb-1">
              Priority
            </label>
            <select
              id="task-priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {TASK_PRIORITY_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-dueDate" className="block text-xs font-bold text-slate-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                id="task-dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Labels Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Labels</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DEFAULT_LABELS.map((lbl) => {
              const isSelected = formData.labels.includes(lbl.name);
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => toggleLabel(lbl.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  #{lbl.name}
                </button>
              );
            })}
          </div>

          {/* Add custom label input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCustomLabel}
              onChange={(e) => setNewCustomLabel(e.target.value)}
              placeholder="Add custom tag (e.g. sprint-3)"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white flex-1 focus:outline-hidden focus:border-blue-600"
            />
            <button
              type="button"
              onClick={handleAddCustomLabel}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Subtasks Builder */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Subtasks ({formData.subtasks.length})
          </label>

          {/* Subtask list */}
          {formData.subtasks.length > 0 && (
            <div className="space-y-1.5 mb-2.5 max-h-32 overflow-y-auto">
              {formData.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <span className="text-slate-800 truncate">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add subtask input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add checklist subtask..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask(e);
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white flex-1 focus:outline-hidden focus:border-blue-600"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
