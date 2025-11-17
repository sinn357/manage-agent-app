'use client';

import { useState, useMemo } from 'react';
import { getPriorityColor, getPriorityLabel, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTasks, useToggleTaskComplete } from '@/lib/hooks/useTasks';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  priority: string;
  status: string;
  goalId: string | null;
  Goal: {
    id: string;
    title: string;
    color: string;
  } | null;
  _count: {
    FocusSession: number;
  };
}

interface TaskListProps {
  onTaskClick?: (task: Task) => void;
  onAddClick?: () => void;
}

// Sortable Task Item Component
function SortableTaskItem({
  task,
  onTaskClick,
  onToggleComplete,
}: {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = getPriorityColor(task.priority);
  const isCompleted = task.status === 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2 p-3 rounded-lg border transition-colors',
        isCompleted
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-gray-300',
        isDragging && 'shadow-lg ring-2 ring-violet-400'
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      <button
        {...listeners}
        className="flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing focus:outline-none"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Checkbox */}
      <button
        onClick={(e) => onToggleComplete(task.id, e)}
        aria-label={`${task.title} ${isCompleted ? '완료 취소' : '완료 처리'}`}
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          isCompleted
            ? 'bg-blue-500 border-blue-500'
            : 'border-gray-300 hover:border-blue-500'
        )}
      >
        {isCompleted && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onTaskClick?.(task)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTaskClick?.(task);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`작업: ${task.title}, 우선순위: ${getPriorityLabel(task.priority)}, ${isCompleted ? '완료됨' : '미완료'}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={cn(
              'font-medium text-gray-900',
              isCompleted && 'line-through text-gray-500'
            )}
          >
            {task.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Priority */}
          <span
            className={cn(
              'px-2 py-0.5 rounded border',
              priorityColor.bg,
              priorityColor.text,
              priorityColor.border
            )}
          >
            {getPriorityLabel(task.priority)}
          </span>

          {/* Goal */}
          {task.Goal && (
            <span
              className="px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: task.Goal.color }}
            >
              {task.Goal.title}
            </span>
          )}

          {/* Date */}
          {task.scheduledDate && (
            <span className="text-gray-500">
              {formatDate(task.scheduledDate, 'short')}
            </span>
          )}

          {/* Focus sessions */}
          {task._count.FocusSession > 0 && (
            <span className="text-gray-500">
              🔥 {task._count.FocusSession}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskList({ onTaskClick, onAddClick }: TaskListProps) {
  const [showOverdue, setShowOverdue] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);

  // TanStack Query로 작업 가져오기
  const { data: allTasks = [], isLoading, error } = useTasks();
  const toggleComplete = useToggleTaskComplete();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 완료되지 않은 작업만 필터링
  const tasks = useMemo(() => {
    return allTasks.filter(t => t.status !== 'completed');
  }, [allTasks]);

  // 통계 계산
  const stats = useMemo(() => {
    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      todo: allTasks.filter(t => t.status === 'todo').length,
    };
  }, [allTasks]);

  // 작업을 오늘/밀린/예정으로 분류
  const categorizedTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks: Task[] = [];
    const overdueTasks: Task[] = [];
    const upcomingTasks: Task[] = [];

    tasks.forEach((task) => {
      if (!task.scheduledDate) {
        // 날짜가 없는 작업은 오늘 할 일에 포함
        todayTasks.push(task);
        return;
      }

      const taskDate = new Date(task.scheduledDate);
      const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

      if (taskDateOnly < today) {
        overdueTasks.push(task);
      } else if (taskDateOnly.getTime() === today.getTime()) {
        todayTasks.push(task);
      } else {
        upcomingTasks.push(task);
      }
    });

    return { todayTasks, overdueTasks, upcomingTasks };
  }, [tasks]);

  const handleToggleComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    toggleComplete.mutate(taskId); // TanStack Query 뮤테이션으로 자동 업데이트
  };

  // Drag end handler for each category
  const createHandleDragEnd = (taskList: Task[]) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = taskList.findIndex((t) => t.id === active.id);
    const newIndex = taskList.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder locally
    const reorderedTasks = arrayMove(taskList, oldIndex, newIndex);

    // Update each task's order in the backend and refetch
    Promise.all(
      reorderedTasks.map((task, index) =>
        fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      )
    ).then(() => {
      // Refetch tasks after all updates complete
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">오늘 할 일</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">오늘 할 일</h2>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }


  return (
    <section className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6" aria-label="작업 목록">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">작업 목록</h2>
          <p className="text-sm text-gray-500">
            {stats.completed}/{stats.total} 완료
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddClick}
          className="text-violet-500 hover:text-violet-600"
        >
          + 추가
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-3">작업이 없습니다</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddClick}
            className="text-violet-500 hover:text-violet-600"
          >
            첫 작업을 추가해보세요
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 오늘 할 일 */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <h3 className="text-base font-semibold text-blue-900 mb-3">
              오늘 할 일 ({categorizedTasks.todayTasks.length})
            </h3>
            {categorizedTasks.todayTasks.length === 0 ? (
              <p className="text-sm text-blue-600">오늘 할 일이 없습니다</p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={createHandleDragEnd(categorizedTasks.todayTasks)}
              >
                <SortableContext
                  items={categorizedTasks.todayTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categorizedTasks.todayTasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onTaskClick={onTaskClick}
                        onToggleComplete={handleToggleComplete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* 밀린 작업 */}
          {categorizedTasks.overdueTasks.length > 0 && (
            <div className="border-2 border-red-200 rounded-lg">
              <button
                onClick={() => setShowOverdue(!showOverdue)}
                aria-expanded={showOverdue}
                aria-label={`밀린 작업 ${categorizedTasks.overdueTasks.length}개 ${showOverdue ? '접기' : '펼치기'}`}
                className="w-full flex items-center justify-between p-3 bg-red-50 rounded-t-lg hover:bg-red-100 transition-colors"
              >
                <h3 className="text-sm font-semibold text-red-900">
                  ⚠️ 밀린 작업 ({categorizedTasks.overdueTasks.length})
                </h3>
                <svg
                  className={cn(
                    'w-5 h-5 text-red-600 transition-transform',
                    showOverdue && 'rotate-180'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showOverdue && (
                <div className="p-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={createHandleDragEnd(categorizedTasks.overdueTasks)}
                  >
                    <SortableContext
                      items={categorizedTasks.overdueTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {categorizedTasks.overdueTasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onTaskClick={onTaskClick}
                            onToggleComplete={handleToggleComplete}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          )}

          {/* 예정 작업 */}
          {categorizedTasks.upcomingTasks.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setShowUpcoming(!showUpcoming)}
                aria-expanded={showUpcoming}
                aria-label={`예정 작업 ${categorizedTasks.upcomingTasks.length}개 ${showUpcoming ? '접기' : '펼치기'}`}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-sm font-medium text-gray-700">
                  📅 예정 작업 ({categorizedTasks.upcomingTasks.length})
                </h3>
                <svg
                  className={cn(
                    'w-5 h-5 text-gray-500 transition-transform',
                    showUpcoming && 'rotate-180'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showUpcoming && (
                <div className="p-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={createHandleDragEnd(categorizedTasks.upcomingTasks)}
                  >
                    <SortableContext
                      items={categorizedTasks.upcomingTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {categorizedTasks.upcomingTasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            onTaskClick={onTaskClick}
                            onToggleComplete={handleToggleComplete}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
