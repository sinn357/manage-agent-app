'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, GripVertical, Flag, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate?: string | null;
  completedAt?: string | null;
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
  onArchive?: (taskId: string, status: 'archived_success' | 'archived_failed') => void;
  isDragging?: boolean;
}

export default function KanbanCard({
  task,
  onClick,
  onArchive,
  isDragging = false,
}: KanbanCardProps) {
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
  const priorityConfig = {
    high: { border: 'border-l-danger', bg: 'bg-danger/10', text: 'text-danger', icon: 'text-danger' },
    mid: { border: 'border-l-warning', bg: 'bg-warning/10', text: 'text-warning', icon: 'text-warning' },
    low: { border: 'border-l-success', bg: 'bg-success/10', text: 'text-success', icon: 'text-success' },
  };

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.mid;

  // 날짜 포맷
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const formatElapsed = (dateString?: string | null) => {
    if (!dateString) return null;
    const completedDate = new Date(dateString);
    const diffMs = Date.now() - completedDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return '방금 전';
    if (diffHours < 1) return `${diffMinutes}분 경과`;
    if (diffDays < 1) return `${diffHours}시간 경과`;
    return `${diffDays}일 경과`;
  };

  const elapsedText = task.status === 'completed' ? formatElapsed(task.completedAt) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onClick}
      className={`glass-card border-l-4 ${priority.border} rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer p-4 group ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-[1.02]'}`}
    >
      {/* 드래그 핸들 & 제목 */}
      <div className="flex items-start gap-2 mb-2">
        <div {...listeners} className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-foreground-tertiary" />
        </div>
        <h3 className="flex-1 font-semibold text-foreground line-clamp-2 leading-tight">{task.title}</h3>
      </div>

      {/* 설명 */}
      {task.description && (
        <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* 메타 정보 */}
      <div className="flex items-center gap-2 flex-wrap">
        {elapsedText && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 rounded-lg text-xs font-medium text-success">
            <Clock className="w-3 h-3" />
            <span>완료 후 {elapsedText}</span>
          </div>
        )}

        {/* 목표 */}
        {task.Goal && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm"
            style={{ backgroundColor: `${task.Goal.color}20`, color: task.Goal.color }}
          >
            <div
              className="w-2 h-2 rounded-full shadow-sm"
              style={{ backgroundColor: task.Goal.color }}
            />
            <span className="truncate max-w-[100px]">{task.Goal.title}</span>
          </div>
        )}

        {/* 날짜 */}
        {task.scheduledDate && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface rounded-lg text-xs font-medium text-foreground-secondary">
            <CalendarDays className="w-3 h-3" />
            <span>{formatDate(task.scheduledDate)}</span>
          </div>
        )}

        {/* 우선순위 뱃지 */}
        {task.priority === 'high' && (
          <div className={`flex items-center gap-1 px-2.5 py-1 ${priority.bg} rounded-lg`}>
            <Flag className={`w-3 h-3 ${priority.icon}`} />
            <span className={`text-xs font-bold ${priority.text}`}>높음</span>
          </div>
        )}
      </div>

      {task.status === 'completed' && onArchive && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onArchive(task.id, 'archived_success');
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors"
          >
            성공 아카이브
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onArchive(task.id, 'archived_failed');
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors"
          >
            실패 아카이브
          </button>
        </div>
      )}
    </div>
  );
}
