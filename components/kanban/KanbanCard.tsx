'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export default function KanbanCard({ task, onClick, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  // 우선순위 색상
  const priorityColors = {
    high: 'border-l-red-500',
    mid: 'border-l-amber-500',
    low: 'border-l-green-500',
  };

  // 날짜 포맷
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white border-l-4 ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.mid} rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* 제목 */}
      <h3 className="font-medium text-gray-800 mb-1 line-clamp-2">{task.title}</h3>

      {/* 설명 */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* 메타 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {/* 목표 */}
        {task.Goal && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ backgroundColor: `${task.Goal.color}20` }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: task.Goal.color }}
            />
            <span className="text-xs truncate max-w-[120px]">{task.Goal.title}</span>
          </div>
        )}

        {/* 날짜 */}
        {task.scheduledDate && (
          <div className="flex items-center gap-1 text-gray-500">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(task.scheduledDate)}</span>
          </div>
        )}
      </div>

      {/* 우선순위 뱃지 */}
      <div className="mt-2">
        {task.priority === 'high' && (
          <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
            높음
          </span>
        )}
      </div>
    </div>
  );
}
