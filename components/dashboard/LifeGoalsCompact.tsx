'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import LifeGoalsDetailModal from './LifeGoalsDetailModal';

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

interface LifeGoalsCompactProps {
  onLifeGoalClick?: (lifeGoal: LifeGoal) => void;
  onAddLifeGoalClick?: () => void;
}

export default function LifeGoalsCompact({ onLifeGoalClick, onAddLifeGoalClick }: LifeGoalsCompactProps) {
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchLifeGoals();
  }, []);

  const fetchLifeGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/life-goals');
      const data = await response.json();

      if (data.success) {
        setLifeGoals(data.lifeGoals);
      }
    } catch (err) {
      console.error('Fetch life goals error:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayGoals = lifeGoals.slice(0, 3);
  const remainingCount = lifeGoals.length - 3;

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 border border-border">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-surface rounded w-24"></div>
            <div className="h-6 w-6 bg-surface rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-surface rounded"></div>
            <div className="h-6 bg-surface rounded"></div>
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
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">핵심 목표</span>
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

        {lifeGoals.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-foreground-secondary mb-2">핵심 목표를 설정하세요</p>
            {onAddLifeGoalClick && (
              <Button
                onClick={onAddLifeGoalClick}
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
            {displayGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface/50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                onClick={() => onLifeGoalClick?.(goal)}
              >
                <span className="text-base flex-shrink-0">{goal.icon}</span>
                <span className="text-foreground truncate flex-1 text-xs font-medium">
                  {goal.title}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-12 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold min-w-[28px] text-right" style={{ color: goal.color }}>
                    {goal.progress}%
                  </span>
                </div>
              </div>
            ))}
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

      <LifeGoalsDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        lifeGoals={lifeGoals}
        onLifeGoalClick={(goal) => {
          setIsDetailOpen(false);
          onLifeGoalClick?.(goal);
        }}
        onAddClick={() => {
          setIsDetailOpen(false);
          onAddLifeGoalClick?.();
        }}
        onRefresh={fetchLifeGoals}
      />
    </>
  );
}
