'use client';

import { calculateDDay, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { GripVertical, Plus, Target } from 'lucide-react';

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
  LifeGoal?: {
    id: string;
    title: string;
    icon: string;
    color: string;
  } | null;
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
        "border border-border rounded-2xl p-4 hover:border-primary/50 transition-all bg-background hover:shadow-md",
        isDragging && "shadow-xl ring-2 ring-primary"
      )}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...listeners}
          className="mt-1 text-foreground-tertiary hover:text-foreground-secondary cursor-grab active:cursor-grabbing focus:outline-none flex-shrink-0 transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Goal Content */}
        <div
          className="flex-1 cursor-pointer pl-3"
          onClick={() => onGoalClick?.(goal)}
          style={{ borderLeftWidth: '3px', borderLeftColor: goal.color }}
        >
          {/* 제목 & D-day */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 pr-2">
              <h3 className="font-semibold text-foreground mb-1.5">{goal.title}</h3>
              {goal.LifeGoal && (
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${goal.LifeGoal.color}20`,
                      color: goal.LifeGoal.color,
                    }}
                  >
                    {goal.LifeGoal.icon} {goal.LifeGoal.title}
                  </span>
                </div>
              )}
            </div>
            {dday && (
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0',
                  dday.isOverdue
                    ? 'bg-danger/10 text-danger'
                    : dday.daysLeft <= 7
                    ? 'bg-warning/10 text-warning'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {dday.display}
              </span>
            )}
          </div>

          {/* 진행률 */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs text-foreground-secondary mb-2">
              <span>진행률</span>
              <span className="font-semibold text-foreground">{goal.progress}%</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-500 ease-out"
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
              <div className="flex justify-between items-center text-xs text-foreground-secondary mb-2">
                <span className="flex items-center gap-1">
                  ⏰ 남은 시간
                </span>
                <span className={cn(
                  "font-semibold",
                  timeRemaining.isOverdue ? "text-danger" : "text-primary"
                )}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              {!timeRemaining.isOverdue && (
                <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-500",
                      timeRemaining.days <= 7 ? "bg-danger" :
                      timeRemaining.days <= 30 ? "bg-warning" : "bg-primary"
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
          <div className="flex gap-4 text-xs text-foreground-tertiary">
            {goal.stats.totalTasks > 0 && (
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground-secondary">작업</span>{' '}
                {goal.stats.completedTasks}/{goal.stats.totalTasks}
              </span>
            )}
            {goal.stats.totalMilestones > 0 && (
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground-secondary">마일스톤</span>{' '}
                {goal.stats.completedMilestones}/{goal.stats.totalMilestones}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-surface rounded-lg w-3/4"></div>
                <div className="h-2.5 bg-surface rounded-full w-full"></div>
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
            <Target className="w-5 h-5 text-primary" />
            목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-danger text-sm">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          목표
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

      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-foreground-tertiary" />
            </div>
            <p className="text-foreground-secondary text-sm mb-4">아직 목표가 없습니다</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddClick}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
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
              <div className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
