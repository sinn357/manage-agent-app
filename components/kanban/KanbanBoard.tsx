'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate?: string | null;
  priority: string;
  status: string;
  goalId?: string | null;
  Goal?: {
    title: string;
    color: string;
  };
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: 'todo', title: '할 일', color: 'bg-gray-100' },
  { id: 'in_progress', title: '진행 중', color: 'bg-blue-100' },
  { id: 'completed', title: '완료', color: 'bg-green-100' },
];

export default function KanbanBoard({ tasks, onTaskClick, onTaskStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);

    // over.id가 컬럼 ID인지 확인
    const targetColumn = COLUMNS.find(col => col.id === over.id);

    if (targetColumn && task && task.status !== targetColumn.id) {
      onTaskStatusChange(taskId, targetColumn.id);
    }

    setActiveTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <KanbanCard task={activeTask} onClick={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
