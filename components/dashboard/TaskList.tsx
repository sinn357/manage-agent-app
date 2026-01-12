'use client';

import { useState, useMemo } from 'react';
import { getPriorityColor, getPriorityLabel, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { GripVertical, Plus, CheckCircle2, Circle, ListTodo, ChevronDown, AlertCircle, Calendar as CalendarIcon, Flame, Play, MoreVertical, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  priority: string;
  status: string;
  goalId: string | null;
  isFromRoutine?: boolean;
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
  onStartFocus?: (task: Task, minutes: number | 'custom') => void;
}

// Sortable Task Item Component
function SortableTaskItem({
  task,
  onTaskClick,
  onToggleComplete,
  onStartFocus,
}: {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
  onStartFocus?: (task: Task, minutes: number | 'custom') => void;
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
        'group flex items-start gap-3 p-3 rounded-xl border transition-all',
        isCompleted
          ? 'bg-surface/50 border-border'
          : 'bg-background border-border hover:border-primary/50 hover:shadow-sm',
        isDragging && 'shadow-xl ring-2 ring-primary'
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      <button
        {...listeners}
        className="flex-shrink-0 mt-0.5 text-foreground-tertiary hover:text-foreground-secondary cursor-grab active:cursor-grabbing focus:outline-none transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Checkbox */}
      <button
        onClick={(e) => onToggleComplete(task.id, e)}
        aria-label={`${task.title} ${isCompleted ? '완료 취소' : '완료 처리'}`}
        className="flex-shrink-0 mt-0.5 transition-all"
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-border hover:text-primary transition-colors" />
        )}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onTaskClick?.(task)}
      >
        <h3
          className={cn(
            'font-medium text-foreground mb-2 transition-all',
            isCompleted && 'line-through text-foreground-tertiary'
          )}
        >
          {task.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Priority */}
          <span
            className={cn(
              'px-2 py-0.5 rounded-lg font-medium border',
              priorityColor.bg,
              priorityColor.text,
              priorityColor.border
            )}
          >
            {getPriorityLabel(task.priority)}
          </span>

          {/* Routine Badge */}
          {task.isFromRoutine && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet/10 text-violet border border-violet/30 font-medium">
              <RefreshCw className="w-3 h-3" />
              루틴
            </span>
          )}

          {/* Goal */}
          {task.Goal && (
            <span
              className="px-2 py-0.5 rounded-lg text-white font-medium"
              style={{ backgroundColor: task.Goal.color }}
            >
              {task.Goal.title}
            </span>
          )}

          {/* Date */}
          {task.scheduledDate && (
            <span className="flex items-center gap-1 text-foreground-secondary">
              <CalendarIcon className="w-3 h-3" />
              {formatDate(task.scheduledDate, 'short')}
            </span>
          )}

          {/* Focus sessions */}
          {task._count.FocusSession > 0 && (
            <span className="flex items-center gap-1 text-foreground-secondary">
              <Flame className="w-3 h-3 text-warning" />
              {task._count.FocusSession}
            </span>
          )}
        </div>
      </div>

      {/* Start Focus Button */}
      {!isCompleted && onStartFocus && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Play className="w-4 h-4" />
              시작
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFocus(task, 10); }}>
              10분
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFocus(task, 20); }}>
              20분
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFocus(task, 30); }}>
              30분
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFocus(task, 40); }}>
              40분
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFocus(task, 50); }}>
              50분
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFocus(task, 60); }}>
              60분
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFocus(task, 'custom'); }} className="border-t">
              자세히...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default function TaskList({ onTaskClick, onAddClick, onStartFocus }: TaskListProps) {
  const [showOverdue, setShowOverdue] = useState(true);
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

  const handleToggleComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComplete.mutate(taskId);
  };

  // 작업 분류: 오늘, 밀린, 예정
  const categorizedTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayTasks: Task[] = [];
    const overdueTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    const noDateTasks: Task[] = [];

    allTasks.forEach((task) => {
      if (task.status === 'completed') return;

      if (!task.scheduledDate) {
        noDateTasks.push(task);
        return;
      }

      const taskDate = new Date(task.scheduledDate);
      const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

      if (taskDay < today) {
        overdueTasks.push(task);
      } else if (taskDay.getTime() === today.getTime()) {
        todayTasks.push(task);
      } else {
        upcomingTasks.push(task);
      }
    });

    return { todayTasks, overdueTasks, upcomingTasks, noDateTasks };
  }, [allTasks]);

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

    const reorderedTasks = arrayMove(taskList, oldIndex, newIndex);

    Promise.all(
      reorderedTasks.map((task, index) =>
        fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      )
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-3 p-3">
                <div className="w-5 h-5 rounded-full bg-surface"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface rounded-lg w-3/4"></div>
                  <div className="h-3 bg-surface rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outline">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-danger text-sm">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const totalIncompleteTasks =
    categorizedTasks.todayTasks.length +
    categorizedTasks.overdueTasks.length +
    categorizedTasks.upcomingTasks.length +
    categorizedTasks.noDateTasks.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          작업
          {totalIncompleteTasks > 0 && (
            <span className="text-sm font-normal text-foreground-tertiary">
              ({totalIncompleteTasks})
            </span>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddClick}
          className="gap-1.5 h-8"
        >
          <Plus className="w-4 h-4" />
          추가
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {totalIncompleteTasks === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8 text-foreground-tertiary" />
            </div>
            <p className="text-foreground-secondary text-sm mb-4">미완료 작업이 없습니다</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddClick}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              새 작업 추가하기
            </Button>
          </div>
        ) : (
          <>
            {/* 오늘 할 일 */}
            {(categorizedTasks.todayTasks.length > 0 || categorizedTasks.noDateTasks.length > 0) && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  오늘 ({categorizedTasks.todayTasks.length + categorizedTasks.noDateTasks.length})
                </h3>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={createHandleDragEnd([...categorizedTasks.todayTasks, ...categorizedTasks.noDateTasks])}
                >
                  <SortableContext
                    items={[...categorizedTasks.todayTasks, ...categorizedTasks.noDateTasks].map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {[...categorizedTasks.todayTasks, ...categorizedTasks.noDateTasks].map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onTaskClick={onTaskClick}
                          onToggleComplete={handleToggleComplete}
                          onStartFocus={onStartFocus}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* 밀린 작업 */}
            {categorizedTasks.overdueTasks.length > 0 && (
              <div className="border border-danger/20 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowOverdue(!showOverdue)}
                  className="w-full flex items-center justify-between p-3 bg-danger/5 hover:bg-danger/10 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-danger flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    밀린 작업 ({categorizedTasks.overdueTasks.length})
                  </h3>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-danger transition-transform',
                      showOverdue && 'rotate-180'
                    )}
                  />
                </button>
                {showOverdue && (
                  <div className="p-3 bg-background">
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
                              onStartFocus={onStartFocus}
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
              <div className="border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  className="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface/80 transition-colors"
                >
                  <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    예정 작업 ({categorizedTasks.upcomingTasks.length})
                  </h3>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-foreground-tertiary transition-transform',
                      showUpcoming && 'rotate-180'
                    )}
                  />
                </button>
                {showUpcoming && (
                  <div className="p-3 bg-background">
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
                              onStartFocus={onStartFocus}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
