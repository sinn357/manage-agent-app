'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  borderColor?: string;
  textColor?: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ id, title, color, borderColor, textColor, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className={`flex flex-col glass-card rounded-xl shadow-lg border ${borderColor || 'border-border'} overflow-hidden floating-card`}>
      {/* 헤더 */}
      <div className={`${color} px-5 py-4 font-bold ${textColor || 'text-foreground'} flex items-center justify-between border-b ${borderColor || 'border-border'}`}>
        <span className="text-base">{title}</span>
        <span className="bg-background px-3 py-1 rounded-full text-xs font-bold shadow-sm">{tasks.length}</span>
      </div>

      {/* 카드 리스트 */}
      <div
        ref={setNodeRef}
        className="flex-1 p-4 space-y-3 min-h-[500px] max-h-[700px] overflow-y-auto"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-center text-foreground-tertiary py-12">
              <p className="text-sm font-medium">작업이 없습니다</p>
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
