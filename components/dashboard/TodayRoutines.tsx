'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Settings, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Routine {
  id: string;
  title: string;
  description: string | null;
  recurrenceType: string;
  recurrenceDays: string | null;
  timeOfDay: string | null;
  duration: number | null;
  priority: string;
  active: boolean;
  isCheckedToday?: boolean;
}

export default function TodayRoutines() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/routines');
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        throw new Error(`Failed to fetch routines (${response.status})`);
      }
      if (!contentType.includes('application/json')) {
        throw new Error('Non-JSON response received');
      }
      const data = await response.json();
      if (data.success) {
        // 활성화된 루틴만 필터링
        const activeRoutines = data.routines
          .filter((r: Routine) => r.active)
          .map((r: Routine) => ({
            ...r,
            isCheckedToday: Boolean(r.isCheckedToday),
          }));
        setRoutines(activeRoutines);
      }
    } catch (error) {
      console.error('Failed to fetch routines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = async (routineId: string, isChecked: boolean) => {
    try {
      const method = isChecked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/routines/${routineId}/check`, { method });
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        throw new Error(`Failed to toggle routine (${response.status})`);
      }
      if (!contentType.includes('application/json')) {
        throw new Error('Non-JSON response received');
      }

      const data = await response.json();
      if (data.success) {
        fetchRoutines();
      } else {
        console.error('Failed to toggle routine check:', data.error);
      }
    } catch (error) {
      console.error('Toggle routine check error:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-danger/10 border-danger/20 text-danger';
      case 'mid':
        return 'bg-info/10 border-info/20 text-info';
      case 'low':
        return 'bg-success/10 border-success/20 text-success';
      default:
        return 'bg-surface border-border text-foreground-secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'mid':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return priority;
    }
  };

  const getRecurrenceLabel = (type: string, days: string | null) => {
    if (type === 'daily') return '매일';
    if (type === 'weekly' && days) {
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const selectedDays = JSON.parse(days).map((d: number) => dayNames[d]);
      return `매주 ${selectedDays.join(', ')}`;
    }
    if (type === 'monthly') return '매월';
    return type;
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold gradient-text flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            오늘의 루틴
          </h2>
        </div>
        <div className="text-center py-8 text-foreground-secondary">
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold gradient-text flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          오늘의 루틴
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/settings?tab=routines')}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">관리</span>
        </Button>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground-secondary mb-4">
            등록된 루틴이 없습니다
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/settings?tab=routines')}
          >
            루틴 추가하기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className={`p-4 bg-surface rounded-xl border border-border hover:shadow-md transition-all ${
                routine.isCheckedToday ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCheck(routine.id, Boolean(routine.isCheckedToday));
                  }}
                  className="flex-shrink-0 mt-0.5 transition-all"
                  aria-label={`${routine.title} ${
                    routine.isCheckedToday ? '완료 취소' : '완료 처리'
                  }`}
                >
                  {routine.isCheckedToday ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-border hover:text-primary transition-colors" />
                  )}
                </button>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push('/settings?tab=routines')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {routine.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                        routine.priority
                      )}`}
                    >
                      {getPriorityLabel(routine.priority)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                    {routine.timeOfDay && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{routine.timeOfDay}</span>
                      </div>
                    )}
                    {routine.duration && (
                      <span>{routine.duration}분</span>
                    )}
                    <span>
                      {getRecurrenceLabel(
                        routine.recurrenceType,
                        routine.recurrenceDays
                      )}
                    </span>
                  </div>
                  {routine.description && (
                    <p className="text-sm text-foreground-secondary mt-2 line-clamp-2">
                      {routine.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
