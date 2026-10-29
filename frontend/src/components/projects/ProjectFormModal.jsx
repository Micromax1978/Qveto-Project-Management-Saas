import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { PROJECT_STATUSES } from '../../constants/status';

export default function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialProject = null,
  isLoading = false,
}) {
  const { currentUser, users } = useAuth();

  const isEditing = Boolean(initialProject);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    dueDate: '',
    status: 'ACTIVE',
    members: [],
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initialProject) {
      setFormData({
        name: initialProject.name || '',
        description: initialProject.description || '',
        startDate: initialProject.startDate || '',
        dueDate: initialProject.dueDate || '',
        status: initialProject.status || 'ACTIVE',
        members: initialProject.members || [currentUser?.id],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'ACTIVE',
        members: currentUser ? [currentUser.id] : [],
      });
    }
    setErrors({});
    setTouched({});
  }, [initialProject, currentUser, isOpen]);

  const validateField = (name, value, currentFormData = formData) => {
    switch (name) {
      case 'name':
        if (!value || !value.trim()) {
          return 'Project name is required.';
        }
        if (value.trim().length < 3) {
          return 'Project name must be at least 3 characters.';
        }
        return '';

      case 'dueDate':
        if (value && currentFormData.startDate && value < currentFormData.startDate) {
          return 'Due date cannot be earlier than the start date.';
        }
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value, updated),
      }));
    }

    // Re-check dueDate error if startDate changes
    if (name === 'startDate' && formData.dueDate) {
      setErrors((prev) => ({
        ...prev,
        dueDate: validateField('dueDate', formData.dueDate, updated),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const toggleMember = (userId) => {
    setFormData((prev) => {
      const exists = prev.members.includes(userId);
      const members = exists
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId];
      return { ...prev, members };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameErr = validateField('name', formData.name);
    const dateErr = validateField('dueDate', formData.dueDate);

    setErrors({ name: nameErr, dueDate: dateErr });
    setTouched({ name: true, dueDate: true });

    if (nameErr || dateErr) return;

    onSubmit(formData);
  };

  const isFormValid =
    formData.name.trim().length >= 3 &&
    (!formData.dueDate || !formData.startDate || formData.dueDate >= formData.startDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      description="Plan and structure milestones, sprint cycles, and team initiatives."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Project Name */}
        <div>
          <label htmlFor="project-name" className="block text-xs font-bold text-slate-700 mb-1">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Q4 Customer Portal"
            disabled={isLoading}
            className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
              errors.name && touched.name
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
            }`}
          />
          {errors.name && touched.name && (
            <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Project Description */}
        <div>
          <label htmlFor="project-description" className="block text-xs font-bold text-slate-700 mb-1">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="project-description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief scope, target objectives, and milestones..."
            disabled={isLoading}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          />
        </div>

        {/* Start Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="project-startDate" className="block text-xs font-bold text-slate-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                id="project-startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="project-dueDate" className="block text-xs font-bold text-slate-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                id="project-dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border bg-white text-slate-900 focus:outline-hidden focus:ring-2 transition-all ${
                  errors.dueDate && touched.dueDate
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                }`}
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            {errors.dueDate && touched.dueDate && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.dueDate}</span>
              </p>
            )}
          </div>
        </div>

        {/* Project Status */}
        <div>
          <label htmlFor="project-status" className="block text-xs font-bold text-slate-700 mb-1">
            Status
          </label>
          <select
            id="project-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all"
          >
            {Object.keys(PROJECT_STATUSES).map((statusKey) => (
              <option key={statusKey} value={statusKey}>
                {PROJECT_STATUSES[statusKey].label}
              </option>
            ))}
          </select>
        </div>

        {/* Project Members Multi-select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Project Members <span className="text-slate-400 font-normal">({formData.members.length} selected)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 max-h-36 overflow-y-auto">
            {users.map((user) => {
              const isChecked = formData.members.includes(user.id);
              return (
                <label
                  key={user.id}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleMember(user.id)}
                    disabled={isLoading}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Avatar user={user} size="xs" showTooltip={false} />
                  <span className="truncate">{user.name}</span>
                </label>
              );
            })}
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
            <span>{isEditing ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
