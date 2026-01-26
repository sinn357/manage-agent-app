"use client";

import { useEffect, useState } from 'react';

interface HabitStatsData {
  habitId: string;
  habitTitle: string;
  currentStreak: number;
  longestStreak: number;
  totalChecks: number;
  totalExpected: number;
  overallRate: number;
  weeklyRate: number;
  monthlyRate: number;
  totalFocusMinutes: number;
  avgFocusMinutes: number;
  focusSessions: number;
}

interface HabitStatsProps {
  habitId: string | null;
}

export default function HabitStats({ habitId }: HabitStatsProps) {
  const [stats, setStats] = useState<HabitStatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!habitId) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/habits/${habitId}/stats`);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
          throw new Error('Failed to fetch habit stats');
        }
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch habit stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [habitId]);

  if (!habitId) {
    return (
      <div className="text-sm text-foreground-secondary">
        습관을 선택하면 통계를 확인할 수 있어요.
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="text-sm text-foreground-secondary">
        통계를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 rounded-xl border border-border bg-surface">
        <p className="text-xs text-foreground-secondary">현재 스트릭</p>
        <p className="text-lg font-semibold">{stats.currentStreak}일</p>
      </div>
      <div className="p-3 rounded-xl border border-border bg-surface">
        <p className="text-xs text-foreground-secondary">최고 스트릭</p>
        <p className="text-lg font-semibold">{stats.longestStreak}일</p>
      </div>
      <div className="p-3 rounded-xl border border-border bg-surface">
        <p className="text-xs text-foreground-secondary">전체 달성률</p>
        <p className="text-lg font-semibold">{stats.overallRate}%</p>
      </div>
      <div className="p-3 rounded-xl border border-border bg-surface">
        <p className="text-xs text-foreground-secondary">이번 주 달성률</p>
        <p className="text-lg font-semibold">{stats.weeklyRate}%</p>
      </div>
      <div className="p-3 rounded-xl border border-border bg-surface">
        <p className="text-xs text-foreground-secondary">이번 달 달성률</p>
        <p className="text-lg font-semibold">{stats.monthlyRate}%</p>
      </div>
      <div className="p-3 rounded-xl border border-border bg-surface">
        <p className="text-xs text-foreground-secondary">포커스 시간</p>
        <p className="text-lg font-semibold">
          {stats.totalFocusMinutes}분 ({stats.focusSessions}회)
        </p>
      </div>
    </div>
  );
}
