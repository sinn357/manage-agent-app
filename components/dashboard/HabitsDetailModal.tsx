"use client";

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import HabitItem from './HabitItem';

interface Habit {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string;
  recurrenceType: string;
  recurrenceDays: string | null;
  timeOfDay: string | null;
  defaultDuration: number | null;
  active: boolean;
  isCheckedToday?: boolean;
}

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

interface HabitsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  overview: HabitsOverview | null;
  onRefresh: () => void;
  onStartFocus?: (habit: Habit, minutes: number | 'custom') => void;
  onToggleCheck: (habitId: string, isChecked: boolean) => void;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function parseRecurrenceDays(value: string | null): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((day) => Number.isInteger(day));
    }
  } catch {
    return [];
  }
  return [];
}

export default function HabitsDetailModal({
  isOpen,
  onClose,
  habits,
  overview,
  onRefresh,
  onStartFocus,
  onToggleCheck,
}: HabitsDetailModalProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    recurrenceType: 'daily',
    recurrenceDays: [] as number[],
    timeOfDay: '',
    defaultDuration: '',
    active: true,
  });

  const activeHabits = useMemo(() => habits.filter((habit) => habit.active), [habits]);

  const openCreateForm = () => {
    setEditingHabit(null);
    setFormState({
      title: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      recurrenceType: 'daily',
      recurrenceDays: [],
      timeOfDay: '',
      defaultDuration: '',
      active: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (habit: Habit) => {
    setEditingHabit(habit);
    setFormState({
      title: habit.title,
      description: habit.description || '',
      icon: habit.icon || '',
      color: habit.color || '#3B82F6',
      recurrenceType: habit.recurrenceType || 'daily',
      recurrenceDays: parseRecurrenceDays(habit.recurrenceDays),
      timeOfDay: habit.timeOfDay || '',
      defaultDuration: habit.defaultDuration ? String(habit.defaultDuration) : '',
      active: habit.active,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.title.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim() || null,
        icon: formState.icon.trim() || null,
        color: formState.color,
        recurrenceType: formState.recurrenceType,
        recurrenceDays:
          formState.recurrenceType === 'weekly' ? formState.recurrenceDays : null,
        timeOfDay: formState.timeOfDay || null,
        defaultDuration: formState.defaultDuration
          ? Number(formState.defaultDuration)
          : null,
        active: formState.active,
      };

      const response = await fetch(
        editingHabit ? `/api/habits/${editingHabit.id}` : '/api/habits',
        {
          method: editingHabit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Failed to save habit');
      }

      const data = await response.json();
      if (data.success) {
        setIsFormOpen(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Save habit error:', error);
    } finally {
      setIsSubmitting(false);
    }
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
        onRefresh();
      }
    } catch (error) {
      console.error('Delete habit error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">습관 관리</DialogTitle>
            <Button size="sm" onClick={openCreateForm}>
              + 추가
            </Button>
          </div>
        </DialogHeader>

        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-border bg-surface">
              <p className="text-xs text-foreground-secondary">오늘</p>
              <p className="text-lg font-semibold">
                {overview.todayCompleted}/{overview.todayTotal} ({overview.todayRate}%)
              </p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface">
              <p className="text-xs text-foreground-secondary">이번 주</p>
              <p className="text-lg font-semibold">{overview.weeklyRate}%</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface">
              <p className="text-xs text-foreground-secondary">이번 달</p>
              <p className="text-lg font-semibold">{overview.monthlyRate}%</p>
            </div>
          </div>
        )}

        {overview?.topStreaks?.length ? (
          <div className="text-sm text-foreground-secondary">
            최고 스트릭: {overview.topStreaks.map((item) => `${item.habitIcon} ${item.habitTitle} ${item.streak}일`).join(', ')}
          </div>
        ) : null}

        <div className="space-y-3">
          {activeHabits.length === 0 ? (
            <div className="text-center py-8 text-foreground-secondary">
              등록된 습관이 없습니다.
            </div>
          ) : (
            activeHabits.map((habit) => (
              <div key={habit.id} className="relative">
                <HabitItem
                  habit={habit}
                  onToggleCheck={onToggleCheck}
                  onStartFocus={onStartFocus}
                  onEdit={openEditForm}
                />
                <div className="absolute right-4 top-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditForm(habit)}
                    className="text-xs"
                  >
                    편집
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(habit.id)}
                    className="text-xs text-danger"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {isFormOpen && (
          <div className="border border-border rounded-xl p-4 space-y-4 bg-surface/50">
            <div className="text-sm font-semibold">
              {editingHabit ? '습관 수정' : '새 습관 만들기'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">이름</label>
                <input
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                  placeholder="물 마시기"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">아이콘</label>
                <input
                  value={formState.icon}
                  onChange={(event) => setFormState((prev) => ({ ...prev, icon: event.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                  placeholder="💧"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">색상</label>
                <input
                  type="color"
                  value={formState.color}
                  onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
                  className="w-full h-10 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">권장 시간</label>
                <input
                  type="time"
                  value={formState.timeOfDay}
                  onChange={(event) => setFormState((prev) => ({ ...prev, timeOfDay: event.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">기본 집중 시간 (분)</label>
                <input
                  type="number"
                  min="1"
                  value={formState.defaultDuration}
                  onChange={(event) => setFormState((prev) => ({ ...prev, defaultDuration: event.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">반복</label>
                <select
                  value={formState.recurrenceType}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, recurrenceType: event.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                </select>
              </div>
            </div>

            {formState.recurrenceType === 'weekly' && (
              <div>
                <label className="block text-xs text-foreground-secondary mb-2">반복 요일</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, index) => {
                    const selected = formState.recurrenceDays.includes(index);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            recurrenceDays: selected
                              ? prev.recurrenceDays.filter((day) => day !== index)
                              : [...prev.recurrenceDays, index].sort(),
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          selected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background text-foreground-secondary border-border'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-foreground-secondary mb-1">설명</label>
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none"
                rows={3}
                placeholder="습관에 대한 설명"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formState.active}
                onChange={(event) => setFormState((prev) => ({ ...prev, active: event.target.checked }))}
              />
              활성화
            </label>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
                취소
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
