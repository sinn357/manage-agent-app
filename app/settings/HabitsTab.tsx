"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import HabitForm from '@/components/habits/HabitForm';
import HabitStats from '@/components/habits/HabitStats';
import HabitCalendar from '@/components/habits/HabitCalendar';
import type { Habit } from '@/types/habit';

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [checkedDates, setCheckedDates] = useState<string[]>([]);

  const selectedHabit = useMemo(
    () => habits.find((habit) => habit.id === selectedHabitId) || null,
    [habits, selectedHabitId]
  );

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Failed to fetch habits');
      }
      const data = await response.json();
      if (data.success) {
        setHabits(data.habits || []);
        if (!selectedHabitId && data.habits?.length) {
          setSelectedHabitId(data.habits[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    }
  };

  const fetchChecks = async (habitId: string, month: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/checks?month=${month}`);
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Failed to fetch habit checks');
      }
      const data = await response.json();
      if (data.success) {
        setCheckedDates(data.checks || []);
      }
    } catch (error) {
      console.error('Failed to fetch habit checks:', error);
      setCheckedDates([]);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    if (selectedHabitId) {
      fetchChecks(selectedHabitId, monthKey);
    }
  }, [selectedHabitId, monthKey]);

  const handleNewHabit = () => {
    setEditingHabit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleDelete = async (habitId: string) => {
    if (!window.confirm('이 습관을 삭제할까요?')) return;
    try {
      const response = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Failed to delete habit');
      }
      const data = await response.json();
      if (data.success) {
        if (selectedHabitId === habitId) {
          setSelectedHabitId(null);
        }
        fetchHabits();
      }
    } catch (error) {
      console.error('Delete habit error:', error);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingHabit(null);
    fetchHabits();
  };

  const handleMonthChange = (delta: number) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const nextKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMonthKey(nextKey);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="glass-card rounded-xl shadow-lg border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold gradient-text">습관 목록</h2>
          <Button size="sm" onClick={handleNewHabit}>
            + 추가
          </Button>
        </div>

        {habits.length === 0 ? (
          <div className="text-sm text-foreground-secondary">등록된 습관이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => (
              <button
                key={habit.id}
                onClick={() => setSelectedHabitId(habit.id)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                  habit.id === selectedHabitId
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{habit.icon || '✅'}</span>
                    <span className="text-sm font-medium">{habit.title}</span>
                  </div>
                  <span className="text-xs text-foreground-secondary">
                    {habit.active ? '활성' : '비활성'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedHabit && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleEdit(selectedHabit)}>
              편집
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(selectedHabit.id)}>
              삭제
            </Button>
          </div>
        )}

        {isFormOpen && (
          <HabitForm
            habit={editingHabit}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card rounded-xl shadow-lg border border-border p-6">
          <h2 className="text-lg font-bold gradient-text mb-4">습관 통계</h2>
          <HabitStats habitId={selectedHabitId} />
        </div>

        <div className="glass-card rounded-xl shadow-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold gradient-text">습관 캘린더</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleMonthChange(-1)}>
                이전
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleMonthChange(1)}>
                다음
              </Button>
            </div>
          </div>
          <HabitCalendar monthKey={monthKey} checkedDates={checkedDates} />
        </div>
      </div>
    </div>
  );
}
