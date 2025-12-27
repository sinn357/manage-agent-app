'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, Settings, Plus, Sparkles } from 'lucide-react';
import { formatLifeTimeRemaining, formatSimpleDate } from '@/lib/lifeCalculations';
import type { LifeStats } from '@/lib/lifeCalculations';

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

interface LifeTimelineProps {
  onSettingsClick: () => void;
  onLifeGoalClick?: (lifeGoal: LifeGoal) => void;
  onAddLifeGoalClick?: () => void;
}

export default function LifeTimeline({ onSettingsClick, onLifeGoalClick, onAddLifeGoalClick }: LifeTimelineProps) {
  const [lifeStats, setLifeStats] = useState<LifeStats | null>(null);
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifeGoalsLoading, setLifeGoalsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLifeStats();
    fetchLifeGoals();
  }, []);

  const fetchLifeStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setLifeStats(data.lifeStats);
      } else {
        setError(data.error || 'Failed to fetch life stats');
      }
    } catch (err) {
      console.error('Fetch life stats error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLifeGoals = async () => {
    try {
      setLifeGoalsLoading(true);
      const response = await fetch('/api/life-goals');
      const data = await response.json();

      if (data.success) {
        setLifeGoals(data.lifeGoals);
      } else {
        console.error('Failed to fetch life goals:', data.error);
      }
    } catch (err) {
      console.error('Fetch life goals error:', err);
    } finally {
      setLifeGoalsLoading(false);
    }
  };

  // 외부에서 새로고침할 수 있도록 expose
  // (프로필 설정 팝업에서 저장 후 호출)
  const refresh = () => {
    fetchLifeStats();
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Life Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-surface rounded-lg w-full"></div>
            <div className="h-4 bg-surface rounded-lg w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Life Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-danger text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // LifeStats가 없는 경우 (아직 설정하지 않음)
  if (!lifeStats) {
    return (
      <Card variant="glass">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Life Timeline
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="gap-1.5 h-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-foreground-tertiary" />
            </div>
            <p className="text-foreground-secondary text-sm mb-4">아직 Life Timeline을 설정하지 않았습니다</p>
            <Button onClick={onSettingsClick} size="sm">
              설정하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // LifeStats가 있는 경우
  const progressPercent = Math.min(100, Math.max(0, lifeStats.percentage));

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Life Timeline
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="gap-1.5 h-8"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent>

      {/* 게이지바 */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
            {lifeStats.currentAge}세 / {lifeStats.targetAge}세
          </div>
          <div className="text-sm font-semibold text-primary">
            {progressPercent.toFixed(1)}%
          </div>
        </div>
        <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-violet to-violet-light transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* 날짜 표시 */}
        {lifeStats.birthDate && lifeStats.targetDeathDate && (
          <div className="flex justify-between items-center mt-3 text-xs text-foreground-tertiary">
            <span title="생년월일" className="flex items-center gap-1">
              🎂 {formatSimpleDate(lifeStats.birthDate)}
            </span>
            <span title="현재" className="flex items-center gap-1 font-semibold text-primary">
              📍 {formatSimpleDate(new Date())}
            </span>
            <span title="목표 수명" className="flex items-center gap-1">
              🏁 {formatSimpleDate(lifeStats.targetDeathDate)}
            </span>
          </div>
        )}
      </div>

      {/* 남은 일수 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-primary/10 rounded-xl p-4">
          <div className="text-foreground-secondary text-xs mb-2">남은 일수</div>
          <div className="text-primary font-bold text-lg">
            {lifeStats.daysLeft.toLocaleString()}일
          </div>
        </div>
        <div className="bg-violet/10 rounded-xl p-4">
          <div className="text-foreground-secondary text-xs mb-2">남은 시간</div>
          <div className="text-violet font-bold text-lg">
            {formatLifeTimeRemaining(lifeStats)}
          </div>
        </div>
      </div>

      {/* 인생목표 섹션 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            나의 인생목표
          </h3>
          {onAddLifeGoalClick && (
            <Button
              onClick={onAddLifeGoalClick}
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
            >
              <Plus className="w-4 h-4" />
              추가
            </Button>
          )}
        </div>

        {lifeGoalsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-surface rounded-xl h-20"></div>
            ))}
          </div>
        ) : lifeGoals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-foreground-tertiary" />
            </div>
            <p className="text-foreground-secondary text-sm mb-3">아직 인생목표가 없습니다</p>
            {onAddLifeGoalClick && (
              <Button
                onClick={onAddLifeGoalClick}
                variant="outline"
                size="sm"
              >
                첫 인생목표를 추가해보세요
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {lifeGoals.map((lifeGoal) => (
              <div
                key={lifeGoal.id}
                onClick={() => onLifeGoalClick?.(lifeGoal)}
                className="border border-border rounded-xl p-4 hover:bg-surface hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{lifeGoal.icon}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {lifeGoal.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {lifeGoal.progress}%
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-2.5 mb-2">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${lifeGoal.progress}%`,
                      backgroundColor: lifeGoal.color,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-foreground-tertiary">
                  {lifeGoal.stats.activeGoals}개 목표
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
}

// refresh 함수를 외부에서 호출할 수 있도록 export
export type LifeTimelineRef = {
  refresh: () => void;
};
