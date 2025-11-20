'use client';

import { calculateDDay, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/lib/hooks/useGoals';
import { useQueryClient } from '@tanstack/react-query';
import { calculateGoalTimeRemaining, formatTimeRemaining } from '@/lib/lifeCalculations';
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

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  status: string;
  color: string;
  progress: number;
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
  };
}

interface GoalPanelProps {
  onGoalClick?: (goal: Goal) => void;
  onAddClick?: () => void;
}

// Sortable Goal Item Component
function SortableGoalItem({ goal, onGoalClick }: { goal: Goal; onGoalClick?: (goal: Goal) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dday = goal.targetDate ? calculateDDay(goal.targetDate) : null;
  const timeRemaining = goal.targetDate ? calculateGoalTimeRemaining(goal.targetDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-white",
        isDragging && "shadow-lg ring-2 ring-violet-400"
      )}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing focus:outline-none flex-shrink-0"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Goal Content */}
        <div
          className="flex-1 cursor-pointer pl-3"
          onClick={() => onGoalClick?.(goal)}
          style={{ borderLeftWidth: '4px', borderLeftColor: goal.color }}
        >
          {/* 제목 & D-day */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium text-gray-900 flex-1 pr-2">{goal.title}</h3>
            {dday && (
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-1 rounded flex-shrink-0',
                  dday.isOverdue
                    ? 'bg-red-100 text-red-700'
                    : dday.daysLeft <= 7
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                )}
              >
                {dday.display}
              </span>
            )}
          </div>

          {/* 진행률 */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
              <span>진행률</span>
              <span className="font-semibold">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: goal.color,
                }}
              ></div>
            </div>
          </div>

          {/* 기한까지 남은 시간 */}
          {timeRemaining && (
            <div className="mb-3">
              <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                <span>⏰ 남은 시간</span>
                <span className={cn(
                  "font-semibold",
                  timeRemaining.isOverdue ? "text-red-600" : "text-violet-600"
                )}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              {!timeRemaining.isOverdue && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      timeRemaining.days <= 7 ? "bg-red-500" :
                      timeRemaining.days <= 30 ? "bg-orange-500" : "bg-violet-500"
                    )}
                    style={{
                      width: `${Math.max(0, 100 - timeRemaining.percentage)}%`,
                    }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* 통계 */}
          <div className="flex gap-3 text-xs text-gray-500">
            {goal.stats.totalTasks > 0 && (
              <span>
                작업 {goal.stats.completedTasks}/{goal.stats.totalTasks}
              </span>
            )}
            {goal.stats.totalMilestones > 0 && (
              <span>
                마일스톤 {goal.stats.completedMilestones}/{goal.stats.totalMilestones}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoalPanel({ onGoalClick, onAddClick }: GoalPanelProps) {
  // TanStack Query로 목표 가져오기
  const { data: goals = [], isLoading, error } = useGoals();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = goals.findIndex((g) => g.id === active.id);
    const newIndex = goals.findIndex((g) => g.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder locally
    const reorderedGoals = arrayMove(goals, oldIndex, newIndex);

    // Update each goal's order in the backend and refetch
    Promise.all(
      reorderedGoals.map((goal, index) =>
        fetch(`/api/goals/${goal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      )
    ).then(() => {
      // Refetch goals after all updates complete
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">목표</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">목표</h2>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">목표</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddClick}
          className="text-violet-500 hover:text-violet-600"
        >
          + 추가
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-3">아직 목표가 없습니다</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddClick}
            className="text-violet-500 hover:text-violet-600"
          >
            첫 목표를 추가해보세요
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={goals.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {goals.map((goal) => (
                <SortableGoalItem
                  key={goal.id}
                  goal={goal}
                  onGoalClick={onGoalClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
