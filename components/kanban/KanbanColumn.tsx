'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledDate?: string;
  priority: string;
  status: string;
  goalId?: string;
  Goal?: {
    title: string;
    color: string;
  };
}

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ id, title, color, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      {/* 헤더 */}
      <div className={`${color} px-4 py-3 font-semibold text-gray-800 flex items-center justify-between`}>
        <span>{title}</span>
        <span className="bg-white px-2 py-1 rounded-full text-xs font-bold">{tasks.length}</span>
      </div>

      {/* 카드 리스트 */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-2 min-h-[500px] overflow-y-auto"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">작업이 없습니다</p>
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
