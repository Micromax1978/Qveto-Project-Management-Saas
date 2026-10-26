import React, { useState } from 'react';
import KanbanColumn from './KanbanColumn';
import { TASK_STATUS_LIST } from '../../constants/status';

export default function KanbanBoard({
  tasks = [],
  onAddTask,
  onOpenTaskDetails,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) {
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  return (
    <div className="w-full">
      {/* Kanban Columns Row (with smooth horizontal scroll on smaller viewports) */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start snap-x snap-mandatory">
        {TASK_STATUS_LIST.map((statusConfig) => {
          const columnTasks = tasks.filter((t) => t.status === statusConfig.id);

          return (
            <div key={statusConfig.id} className="snap-start shrink-0">
              <KanbanColumn
                statusConfig={statusConfig}
                tasks={columnTasks}
                draggingTaskId={draggingTaskId}
                onDragStartTask={setDraggingTaskId}
                onDragEndTask={() => setDraggingTaskId(null)}
                onAddTask={onAddTask}
                onOpenTaskDetails={onOpenTaskDetails}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onStatusChange={onStatusChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
