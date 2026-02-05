'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Target, Plus, GripVertical, CheckCircle2, Circle } from 'lucide-react';
import { calculateDDay, cn } from '@/lib/utils';
import { calculateGoalTimeRemaining, formatTimeRemaining } from '@/lib/lifeCalculations';
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

interface GoalPanelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
  onAddClick?: () => void;
}

function SortableGoalItem({
  goal,
  onGoalClick,
}: {
  goal: Goal;
  onGoalClick?: (goal: Goal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
  });

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
        'border border-border rounded-xl p-4 hover:border-primary/50 transition-all bg-background hover:shadow-sm',
        isDragging && 'shadow-lg ring-2 ring-primary'
      )}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...listeners}
          className="mt-0.5 text-foreground-tertiary hover:text-foreground-secondary cursor-grab active:cursor-grabbing focus:outline-none flex-shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Goal Content */}
        <div
          className="flex-1 cursor-pointer pl-3"
          onClick={() => onGoalClick?.(goal)}
          style={{ borderLeftWidth: '3px', borderLeftColor: goal.color }}
        >
          {/* 제목 & D-day */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-2">
              <h3 className="font-semibold text-foreground text-sm">{goal.title}</h3>
              {goal.LifeGoal && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-block mt-1"
                  style={{
                    backgroundColor: `${goal.LifeGoal.color}20`,
                    color: goal.LifeGoal.color,
                  }}
                >
                  {goal.LifeGoal.icon} {goal.LifeGoal.title}
                </span>
              )}
            </div>
            {dday && (
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0',
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
          <div className="mb-2">
            <div className="flex justify-between items-center text-xs text-foreground-secondary mb-1">
              <span>진행률</span>
              <span className="font-semibold text-foreground">{goal.progress}%</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
              />
            </div>
          </div>

          {/* 남은 시간 */}
          {timeRemaining && !timeRemaining.isOverdue && (
            <div className="text-xs text-foreground-secondary mb-2">
              <span className="flex items-center gap-1">
                <span>남은 시간:</span>
                <span className="font-semibold text-primary">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </span>
            </div>
          )}

          {/* 통계 */}
          <div className="flex gap-3 text-[10px] text-foreground-tertiary">
            {goal.stats.totalTasks > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                작업 {goal.stats.completedTasks}/{goal.stats.totalTasks}
              </span>
            )}
            {goal.stats.totalMilestones > 0 && (
              <span className="flex items-center gap-1">
                <Circle className="w-3 h-3" />
                마일스톤 {goal.stats.completedMilestones}/{goal.stats.totalMilestones}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoalPanelDetailModal({
  isOpen,
  onClose,
  goals,
  onGoalClick,
  onAddClick,
}: GoalPanelDetailModalProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string | null>(null);

  // 드래그 센서
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 인생목표 필터 목록
  const lifeGoalFilters = Array.from(
    new Map(
      goals
        .filter((g) => g.LifeGoal)
        .map((g) => [g.LifeGoal!.id, g.LifeGoal!])
    ).values()
  );

  // 필터링된 목표
  const filteredGoals = filter
    ? goals.filter((g) => g.LifeGoal?.id === filter)
    : goals;

  // 전체 평균 진행률
  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = goals.findIndex((g) => g.id === active.id);
    const newIndex = goals.findIndex((g) => g.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedGoals = arrayMove(goals, oldIndex, newIndex);

    Promise.all(
      reorderedGoals.map((goal, index) =>
        fetch(`/api/goals/${goal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      )
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              세부 목표
            </DialogTitle>
            {onAddClick && (
              <Button onClick={onAddClick} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                추가
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* 요약 통계 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <div className="text-xs text-foreground-secondary mb-1">전체 세부 목표</div>
              <div className="text-lg font-bold text-primary">{goals.length}개</div>
            </div>
            <div className="bg-violet/10 rounded-xl p-3 text-center">
              <div className="text-xs text-foreground-secondary mb-1">평균 달성률</div>
              <div className="text-lg font-bold text-violet">{avgProgress}%</div>
            </div>
            <div className="bg-success/10 rounded-xl p-3 text-center">
              <div className="text-xs text-foreground-secondary mb-1">완료</div>
              <div className="text-lg font-bold text-success">
                {goals.filter((g) => g.progress >= 100).length}개
              </div>
            </div>
          </div>

          {/* 필터 */}
          {lifeGoalFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter(null)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full transition-colors',
                  filter === null
                    ? 'bg-primary text-white'
                    : 'bg-surface text-foreground-secondary hover:bg-surface/80'
                )}
              >
                전체
              </button>
              {lifeGoalFilters.map((lg) => (
                <button
                  key={lg.id}
                  onClick={() => setFilter(lg.id)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full transition-colors',
                    filter === lg.id
                      ? 'text-white'
                      : 'text-foreground-secondary hover:opacity-80'
                  )}
                  style={{
                    backgroundColor: filter === lg.id ? lg.color : `${lg.color}20`,
                    color: filter === lg.id ? 'white' : lg.color,
                  }}
                >
                  {lg.icon} {lg.title}
                </button>
              ))}
            </div>
          )}

          {/* 목표 목록 */}
          {filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-foreground-tertiary" />
              </div>
              <p className="text-foreground-secondary text-sm mb-4">
                {filter ? '해당 핵심 목표에 연결된 세부 목표가 없습니다' : '아직 세부 목표가 없습니다'}
              </p>
              {onAddClick && !filter && (
                <Button onClick={onAddClick} variant="outline">
                  첫 세부 목표를 추가해보세요
                </Button>
              )}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredGoals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {filteredGoals.map((goal) => (
                    <SortableGoalItem key={goal.id} goal={goal} onGoalClick={onGoalClick} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
