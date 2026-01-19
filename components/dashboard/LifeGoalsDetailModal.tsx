'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Edit2, Target } from 'lucide-react';

interface LifeGoal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  color: string;
  progress: number;
  stats: {
    totalGoals: number;
    activeGoals: number;
  };
}

interface LifeGoalsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifeGoals: LifeGoal[];
  onLifeGoalClick?: (lifeGoal: LifeGoal) => void;
  onAddClick?: () => void;
  onRefresh?: () => void;
}

export default function LifeGoalsDetailModal({
  isOpen,
  onClose,
  lifeGoals,
  onLifeGoalClick,
  onAddClick,
}: LifeGoalsDetailModalProps) {
  // 전체 평균 진행률
  const avgProgress = lifeGoals.length > 0
    ? Math.round(lifeGoals.reduce((sum, g) => sum + g.progress, 0) / lifeGoals.length)
    : 0;

  // 총 연결된 목표 수
  const totalLinkedGoals = lifeGoals.reduce((sum, g) => sum + g.stats.activeGoals, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              인생 목표
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
              <div className="text-xs text-foreground-secondary mb-1">인생목표</div>
              <div className="text-lg font-bold text-primary">{lifeGoals.length}개</div>
            </div>
            <div className="bg-violet/10 rounded-xl p-3 text-center">
              <div className="text-xs text-foreground-secondary mb-1">평균 달성률</div>
              <div className="text-lg font-bold text-violet">{avgProgress}%</div>
            </div>
            <div className="bg-success/10 rounded-xl p-3 text-center">
              <div className="text-xs text-foreground-secondary mb-1">연결된 목표</div>
              <div className="text-lg font-bold text-success">{totalLinkedGoals}개</div>
            </div>
          </div>

          {/* 인생목표 목록 */}
          {lifeGoals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-foreground-tertiary" />
              </div>
              <p className="text-foreground-secondary text-sm mb-4">
                아직 인생목표가 없습니다
              </p>
              {onAddClick && (
                <Button onClick={onAddClick} variant="outline">
                  첫 인생목표를 추가해보세요
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {lifeGoals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => onLifeGoalClick?.(goal)}
                  className="border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer bg-background"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-xs text-foreground-secondary line-clamp-1 mt-0.5">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLifeGoalClick?.(goal);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* 진행률 바 */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-foreground-secondary">달성률</span>
                      <span className="font-semibold" style={{ color: goal.color }}>
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                      />
                    </div>
                  </div>

                  {/* 통계 */}
                  <div className="flex items-center gap-3 text-xs text-foreground-secondary">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>목표 {goal.stats.activeGoals}개</span>
                    </div>
                    <span className="text-foreground-tertiary">|</span>
                    <div className="flex items-center gap-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                      >
                        {goal.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
