'use client';

import { useState } from 'react';
import { calculateDDay, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/lib/hooks/useGoals';
import { Target, ArrowRight, Plus } from 'lucide-react';
import GoalPanelDetailModal from './GoalPanelDetailModal';

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

interface GoalPanelCompactProps {
  onGoalClick?: (goal: Goal) => void;
  onAddClick?: () => void;
}

export default function GoalPanelCompact({ onGoalClick, onAddClick }: GoalPanelCompactProps) {
  const { data: goals = [], isLoading } = useGoals();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const displayGoals = goals.slice(0, 3);
  const remainingCount = goals.length - 3;

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-4 border border-border">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-surface rounded w-16"></div>
            <div className="h-6 w-6 bg-surface rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-surface rounded"></div>
            <div className="h-8 bg-surface rounded"></div>
            <div className="h-8 bg-surface rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">세부 목표</span>
            <span className="text-xs text-foreground-secondary">({goals.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDetailOpen(true)}
            className="h-7 w-7 p-0 hover:bg-primary/10"
          >
            <ArrowRight className="w-4 h-4 text-primary" />
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-foreground-secondary mb-2">세부 목표를 설정하세요</p>
            {onAddClick && (
              <Button
                onClick={onAddClick}
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
              >
                <Plus className="w-3 h-3" />
                추가
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayGoals.map((goal) => {
              const dday = goal.targetDate ? calculateDDay(goal.targetDate) : null;

              return (
                <div
                  key={goal.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-surface/50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                  onClick={() => onGoalClick?.(goal)}
                >
                  {/* 색상 점 */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: goal.color }}
                  />

                  {/* 제목 */}
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {goal.title}
                  </span>

                  {/* 진행률 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-10 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold min-w-[28px] text-right"
                      style={{ color: goal.color }}
                    >
                      {goal.progress}%
                    </span>
                  </div>

                  {/* D-day */}
                  {dday && (
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0',
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
              );
            })}
            {remainingCount > 0 && (
              <button
                onClick={() => setIsDetailOpen(true)}
                className="text-xs text-primary hover:underline w-full text-right"
              >
                +{remainingCount}개 더보기
              </button>
            )}
          </div>
        )}
      </div>

      <GoalPanelDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        goals={goals}
        onGoalClick={(goal) => {
          setIsDetailOpen(false);
          onGoalClick?.(goal);
        }}
        onAddClick={() => {
          setIsDetailOpen(false);
          onAddClick?.();
        }}
      />
    </>
  );
}
