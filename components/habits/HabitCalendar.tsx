"use client";

import { useMemo } from 'react';

interface HabitCalendarProps {
  monthKey: string; // YYYY-MM
  checkedDates: string[];
}

function toKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HabitCalendar({ monthKey, checkedDates }: HabitCalendarProps) {
  const [year, month] = monthKey.split('-').map((value) => Number(value));

  const { days, startOffset } = useMemo(() => {
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const offset = firstDay.getUTCDay();
    return {
      days: Array.from({ length: daysInMonth }, (_, index) => index + 1),
      startOffset: offset,
    };
  }, [year, month]);

  const checkedSet = useMemo(() => {
    const set = new Set<string>();
    checkedDates.forEach((dateString) => {
      const date = new Date(dateString);
      if (!Number.isNaN(date.getTime())) {
        set.add(toKey(date));
      }
    });
    return set;
  }, [checkedDates]);

  return (
    <div className="border border-border rounded-xl p-4 bg-surface/50">
      <div className="text-sm font-semibold mb-3">{monthKey} 체크 기록</div>
      <div className="grid grid-cols-7 gap-2 text-xs text-foreground-secondary mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
          <div key={label} className="text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startOffset }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {days.map((day) => {
          const dateKey = toKey(new Date(Date.UTC(year, month - 1, day)));
          const checked = checkedSet.has(dateKey);
          return (
            <div
              key={dateKey}
              className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium border ${
                checked
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-foreground-secondary border-border'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
