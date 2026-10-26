import React from 'react';
import {
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { PriorityBadge } from '../ui/Badge';
import { TASK_STATUS_LIST } from '../../constants/status';
import { useAuth } from '../../context/AuthContext';
import { Permissions } from '../../constants/roles';

export default function TaskListView({
  tasks = [],
  onOpenDetails,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const { currentUser, users } = useAuth();
  const canDelete = Permissions.canDeleteTask(currentUser?.role);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            <tr>
              <th className="px-5 py-3.5">Code & Title</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">Assignee</th>
              <th className="px-4 py-3.5">Due Date</th>
              <th className="px-4 py-3.5">Subtasks</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const assignee = users.find((u) => u.id === task.assigneeId);
              const subtasks = task.subtasks || [];
              const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
              const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'DONE';

              return (
                <tr
                  key={task.id}
                  onClick={() => onOpenDetails(task)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                    isOverdue ? 'bg-rose-50/15' : ''
                  }`}
                >
                  {/* Code & Title */}
                  <td className="px-5 py-3.5 max-w-xs">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {task.taskCode || 'TSK'}
                      </span>
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex gap-1">
                          {task.labels.slice(0, 2).map((l) => (
                            <span
                              key={l}
                              className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded"
                            >
                              #{l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 line-clamp-1">{task.title}</div>
                  </td>

                  {/* Quick Status Selector */}
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:border-blue-600"
                    >
                      {TASK_STATUS_LIST.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar user={assignee} size="xs" />
                      <span className="text-slate-700 font-medium truncate max-w-[110px]">
                        {assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="px-4 py-3.5">
                    {task.dueDate ? (
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{task.dueDate}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Subtasks */}
                  <td className="px-4 py-3.5">
                    {subtasks.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">
                          {completedSubtasks}/{subtasks.length}
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              completedSubtasks === subtasks.length
                                ? 'bg-emerald-500'
                                : 'bg-blue-600'
                            }`}
                            style={{
                              width: `${(completedSubtasks / subtasks.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
