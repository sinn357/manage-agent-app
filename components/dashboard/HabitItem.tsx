'use client';

import { Play, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Habit } from '@/types/habit';

interface HabitItemProps {
  habit: Habit;
  onToggleCheck: (habitId: string, isChecked: boolean) => void;
  onStartFocus?: (habit: Habit, minutes: number | 'custom') => void;
  onEdit?: (habit: Habit) => void;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getRecurrenceLabel(type: string, days: string | null): string {
  if (type === 'daily') return '매일';
  if (type === 'weekly' && days) {
    try {
      const selected = JSON.parse(days).map((day: number) => DAY_LABELS[day]);
      return `매주 ${selected.join(', ')}`;
    } catch {
      return '매주';
    }
  }
  return type;
}

export default function HabitItem({ habit, onToggleCheck, onStartFocus, onEdit }: HabitItemProps) {
  return (
    <div
      className={`p-4 bg-surface rounded-xl border border-border hover:shadow-md transition-all ${
        habit.isCheckedToday ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleCheck(habit.id, Boolean(habit.isCheckedToday));
          }}
          className="flex-shrink-0 mt-0.5 transition-all"
          aria-label={`${habit.title} ${
            habit.isCheckedToday ? '완료 취소' : '완료 처리'
          }`}
        >
          {habit.isCheckedToday ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Circle className="w-5 h-5 text-border hover:text-primary transition-colors" />
          )}
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onEdit?.(habit)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{habit.icon || '✅'}</span>
            <h3 className="font-semibold text-foreground truncate">
              {habit.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-secondary">
            {habit.timeOfDay && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{habit.timeOfDay}</span>
              </div>
            )}
            {habit.defaultDuration && (
              <span>{habit.defaultDuration}분</span>
            )}
            <span>{getRecurrenceLabel(habit.recurrenceType, habit.recurrenceDays)}</span>
          </div>
          {habit.description && (
            <p className="text-sm text-foreground-secondary mt-2 line-clamp-2">
              {habit.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {habit.isCheckedToday && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onToggleCheck(habit.id, true);
              }}
            >
              해제
            </Button>
          )}
          {habit.defaultDuration && onStartFocus && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onStartFocus(habit, habit.defaultDuration || 'custom');
              }}
              className="gap-1"
            >
              <Play className="w-3.5 h-3.5" />
              집중
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
