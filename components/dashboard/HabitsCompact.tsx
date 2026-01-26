'use client';

import { useEffect, useMemo, useState } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HabitItem from './HabitItem';
import HabitsDetailModal from './HabitsDetailModal';
import type { Habit } from '@/types/habit';

interface HabitsOverview {
  totalHabits: number;
  todayCompleted: number;
  todayTotal: number;
  todayRate: number;
  weeklyRate: number;
  monthlyRate: number;
  topStreaks: { habitId: string; habitTitle: string; habitIcon: string; streak: number }[];
  totalFocusMinutes: number;
}

interface HabitsCompactProps {
  onStartFocus?: (habit: Habit, minutes: number | 'custom') => void;
}

function getSeoulDayIndex(): number {
  const seoul = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  );
  return seoul.getDay();
}

function isDueToday(habit: Habit): boolean {
  if (habit.recurrenceType !== 'weekly') return true;
  if (!habit.recurrenceDays) return true;
  try {
    const days = JSON.parse(habit.recurrenceDays);
    if (!Array.isArray(days)) return true;
    return days.includes(getSeoulDayIndex());
  } catch {
    return true;
  }
}

export default function HabitsCompact({ onStartFocus }: HabitsCompactProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [overview, setOverview] = useState<HabitsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchHabits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/habits?active=true');
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        throw new Error(`Failed to fetch habits (${response.status})`);
      }
      if (!contentType.includes('application/json')) {
        throw new Error('Non-JSON response received');
      }
      const data = await response.json();
      if (data.success) {
        setHabits(data.habits || []);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/habits/stats');
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Failed to fetch habits overview');
      }
      const data = await response.json();
      if (data.success) {
        setOverview(data.overview);
      }
    } catch (error) {
      console.error('Failed to fetch habits overview:', error);
    }
  };

  const refreshAll = () => {
    fetchHabits();
    fetchOverview();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const todayHabits = useMemo(
    () => habits.filter((habit) => habit.active && isDueToday(habit)),
    [habits]
  );

  const completedCount = todayHabits.filter((habit) => habit.isCheckedToday).length;

  const handleToggleCheck = async (habitId: string, isChecked: boolean) => {
    try {
      const method = isChecked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/habits/${habitId}/check`, { method });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        throw new Error(`Failed to toggle habit (${response.status})`);
      }
      if (!contentType.includes('application/json')) {
        throw new Error('Non-JSON response received');
      }

      const data = await response.json();
      if (data.success) {
        refreshAll();
      } else {
        console.error('Failed to toggle habit check:', data.error);
      }
    } catch (error) {
      console.error('Toggle habit check error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold gradient-text flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            오늘의 습관
          </h2>
        </div>
        <div className="text-center py-8 text-foreground-secondary">
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            <h2 className="text-lg font-bold gradient-text">오늘의 습관</h2>
            <span className="text-sm text-foreground-secondary">
              {completedCount}/{todayHabits.length}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsDetailOpen(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">관리</span>
          </Button>
        </div>

        {todayHabits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-foreground-secondary mb-4">
              오늘 진행할 습관이 없습니다
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(true)}>
              습관 추가하기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayHabits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                onToggleCheck={handleToggleCheck}
                onStartFocus={onStartFocus}
              />
            ))}
          </div>
        )}

        {overview?.topStreaks?.length ? (
          <div className="mt-4 text-xs text-foreground-secondary">
            최고 스트릭: {overview.topStreaks.map((item) => `${item.habitIcon} ${item.habitTitle} ${item.streak}일`).join(', ')}
          </div>
        ) : null}
      </div>

      <HabitsDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        habits={habits}
        overview={overview}
        onRefresh={refreshAll}
        onStartFocus={onStartFocus}
        onToggleCheck={handleToggleCheck}
      />
    </>
  );
}
