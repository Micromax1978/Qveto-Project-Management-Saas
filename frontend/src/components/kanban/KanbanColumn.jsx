import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import KanbanTaskCard from './KanbanTaskCard';

export default function KanbanColumn({
  statusConfig,
  tasks = [],
  onAddTask,
  onOpenTaskDetails,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  draggingTaskId,
  onDragStartTask,
  onDragEndTask,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only toggle if leaving the column wrapper
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId && onStatusChange) {
      onStatusChange(taskId, statusConfig.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-100/70 rounded-2xl border transition-all duration-200 min-w-[280px] sm:min-w-[300px] flex-1 max-w-full sm:max-w-sm ${
        isDragOver
          ? 'border-blue-400 bg-blue-50/40 ring-2 ring-blue-300 ring-offset-2'
          : 'border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            {statusConfig.label}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
            {tasks.length}
          </span>
        </div>

        {/* Quick Add Task in this Column */}
        <button
          type="button"
          onClick={() => onAddTask(statusConfig.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition-colors"
          title={`Add Task to ${statusConfig.label}`}
          aria-label={`Add Task to ${statusConfig.label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards Container */}
      <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto min-h-[380px] max-h-[calc(100vh-280px)]">
        {tasks.length === 0 ? (
          <div className="h-40 border border-dashed border-slate-300/80 rounded-xl flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-500">No tasks in {statusConfig.label}</p>
            <button
              type="button"
              onClick={() => onAddTask(statusConfig.id)}
              className="mt-2 text-[11px] text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add a task</span>
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              isDragging={draggingTaskId === task.id}
              onDragStart={onDragStartTask}
              onDragEnd={onDragEndTask}
              onOpenDetails={onOpenTaskDetails}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
