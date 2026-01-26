'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Timer, Bell, Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  notifyFocusComplete,
  getNotificationSettings,
} from '@/lib/notifications';

interface Task {
  id: string;
  title: string;
}

interface Habit {
  id: string;
  title: string;
  icon?: string | null;
}

interface TimerStateData {
  timerState: 'idle' | 'running' | 'paused';
  selectedMinutes: number;
  timeLeft: number;
  selectedTaskId: string;
  selectedHabitId: string;
  sessionId: string | null;
}

interface FocusTimerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: Habit[];
  onSessionComplete?: () => void;
  currentState: TimerStateData;
  onStateChange: (newState: Partial<TimerStateData & {
    startTime?: number;
    targetEndTime?: number;
    elapsed?: number;
    fiveMinuteNotified?: boolean;
  }>) => void;
}

const QUICK_PRESETS = [5, 10, 25, 30, 45, 60, 90];

export default function FocusTimerDetailModal({
  isOpen,
  onClose,
  tasks,
  onSessionComplete,
  currentState,
  onStateChange,
}: FocusTimerDetailModalProps) {
  const { timerState, selectedMinutes, timeLeft, selectedTaskId, selectedHabitId, sessionId } = currentState;
  const [customMinutes, setCustomMinutes] = useState(selectedMinutes.toString());
  const [localSelectedTaskId, setLocalSelectedTaskId] = useState(selectedTaskId);
  const [localSelectedHabitId, setLocalSelectedHabitId] = useState(selectedHabitId);

  // selectedTaskId가 변경되면 로컬 상태 동기화
  useEffect(() => {
    setLocalSelectedTaskId(selectedTaskId);
  }, [selectedTaskId]);

  useEffect(() => {
    setLocalSelectedHabitId(selectedHabitId);
  }, [selectedHabitId]);

  useEffect(() => {
    setCustomMinutes(selectedMinutes.toString());
  }, [selectedMinutes]);

  const handleCustomChange = (value: string) => {
    if (timerState === 'idle') {
      setCustomMinutes(value);
      const num = parseInt(value);
      if (!isNaN(num) && num > 0 && num <= 999) {
        onStateChange({ selectedMinutes: num, timeLeft: num * 60 });
      }
    }
  };

  const handlePresetSelect = (mins: number) => {
    if (timerState === 'idle') {
      setCustomMinutes(mins.toString());
      onStateChange({ selectedMinutes: mins, timeLeft: mins * 60 });
    }
  };

  const handleStart = async () => {
    try {
      const response = await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: selectedMinutes,
          taskId: localSelectedTaskId || null,
          habitId: localSelectedHabitId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const now = Date.now();
        onStateChange({
          sessionId: data.session.id,
          timerState: 'running',
          selectedTaskId: localSelectedTaskId,
          selectedHabitId: localSelectedHabitId,
          startTime: now,
          targetEndTime: now + selectedMinutes * 60 * 1000,
          elapsed: 0,
          fiveMinuteNotified: false,
        });

        // 작업 상태를 'in_progress'로 변경
        if (localSelectedTaskId) {
          try {
            await fetch(`/api/tasks/${localSelectedTaskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'in_progress' }),
            });
          } catch (err) {
            console.error('[FocusTimer] Failed to update task status:', err);
          }
        }

        onClose();
      }
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  };

  const handlePause = async () => {
    if (timerState === 'running') {
      onStateChange({ timerState: 'paused' });

      if (sessionId) {
        await fetch(`/api/focus-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeLeft,
            timerState: 'paused',
          }),
        });
      }
    } else if (timerState === 'paused') {
      const now = Date.now();
      onStateChange({
        timerState: 'running',
        startTime: now,
        targetEndTime: now + timeLeft * 1000,
      });

      if (sessionId) {
        await fetch(`/api/focus-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeLeft,
            timerState: 'running',
          }),
        });
      }
    }
  };

  const handleStop = async () => {
    if (sessionId) {
      const totalSeconds = selectedMinutes * 60;
      const actualTimeSeconds = totalSeconds - timeLeft;

      await fetch(`/api/focus-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualTime: Math.floor(actualTimeSeconds / 60),
          completed: false,
          interrupted: true,
        }),
      });
    }

    if (selectedTaskId) {
      try {
        await fetch(`/api/tasks/${selectedTaskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'todo' }),
        });
      } catch (err) {
        console.error('[FocusTimer] Failed to revert task status:', err);
      }
    }

    onStateChange({
      timerState: 'idle',
      timeLeft: selectedMinutes * 60,
      sessionId: null,
      elapsed: 0,
      selectedHabitId: '',
    });
    onSessionComplete?.();
  };

  const handleComplete = async () => {
    if (sessionId) {
      await fetch(`/api/focus-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualTime: selectedMinutes,
          completed: true,
          interrupted: false,
        }),
      });

      try {
        const settings = getNotificationSettings();
        if (settings.enabled && settings.focusComplete) {
          notifyFocusComplete(selectedMinutes * 60);
        }
      } catch (error) {
        console.error('[FocusTimer] Notification error:', error);
      }
    }

    if (selectedTaskId) {
      try {
        await fetch(`/api/tasks/${selectedTaskId}/complete`, { method: 'PATCH' });
      } catch (err) {
        console.error('[FocusTimer] Failed to complete task:', err);
      }
    }

    onStateChange({
      timerState: 'idle',
      timeLeft: selectedMinutes * 60,
      sessionId: null,
      elapsed: 0,
      fiveMinuteNotified: false,
      selectedHabitId: '',
    });
    onSessionComplete?.();
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              포커스 타이머
            </DialogTitle>
            {typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'default' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={requestNotificationPermission}
                  className="gap-1.5 h-8"
                >
                  <Bell className="w-4 h-4" />
                  알림 허용
                </Button>
              )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 타이머 디스플레이 */}
          <div className="relative">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent mb-2">
                {formatTime(timeLeft)}
              </div>
              {timerState !== 'idle' && (
                <div className="text-sm text-foreground-secondary">
                  {selectedMinutes}분 중 {Math.floor((selectedMinutes * 60 - timeLeft) / 60)}분 경과
                </div>
              )}
            </div>

            {/* Progress bar */}
            {timerState !== 'idle' && (
              <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-violet transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* 시간 설정 (idle일 때만) */}
          {timerState === 'idle' && (
            <>
              {/* 프리셋 버튼 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  빠른 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PRESETS.map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handlePresetSelect(mins)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        selectedMinutes === mins
                          ? 'bg-primary text-white'
                          : 'bg-surface text-foreground-secondary hover:bg-surface/80'
                      )}
                    >
                      {mins}분
                    </button>
                  ))}
                </div>
              </div>

              {/* 커스텀 입력 */}
              <div>
                <label htmlFor="custom-minutes-modal" className="block text-sm font-medium text-foreground mb-2">
                  직접 입력 (분)
                </label>
                <input
                  id="custom-minutes-modal"
                  type="number"
                  min="1"
                  max="999"
                  value={customMinutes}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="원하는 시간 입력"
                />
              </div>

              {/* 작업 선택 */}
              {tasks.length > 0 && (
              <div>
                <label htmlFor="task-select-modal" className="block text-sm font-medium text-foreground mb-2">
                  작업 연결 (선택)
                </label>
                <select
                  id="task-select-modal"
                  value={localSelectedTaskId}
                  onChange={(e) => {
                    setLocalSelectedTaskId(e.target.value);
                    if (e.target.value) {
                      setLocalSelectedHabitId('');
                    }
                  }}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">작업 없음</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {habits.length > 0 && (
                <div>
                  <label htmlFor="habit-select-modal" className="block text-sm font-medium text-foreground mb-2">
                    습관 연결 (선택)
                  </label>
                  <select
                    id="habit-select-modal"
                    value={localSelectedHabitId}
                    onChange={(e) => {
                      setLocalSelectedHabitId(e.target.value);
                      if (e.target.value) {
                        setLocalSelectedTaskId('');
                      }
                    }}
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">습관 없음</option>
                    {habits.map((habit) => (
                      <option key={habit.id} value={habit.id}>
                        {habit.icon || '✅'} {habit.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* 컨트롤 버튼 */}
          <div className="flex gap-3">
            {timerState === 'idle' && (
              <Button onClick={handleStart} className="flex-1" size="lg">
                <Play className="w-4 h-4 mr-2" />
                시작
              </Button>
            )}

            {timerState === 'running' && (
              <>
                <Button onClick={handlePause} className="flex-1" variant="warning" size="lg">
                  <Pause className="w-4 h-4 mr-2" />
                  일시정지
                </Button>
                <Button onClick={handleStop} className="flex-1" variant="danger" size="lg">
                  <Square className="w-4 h-4 mr-2" />
                  중단
                </Button>
              </>
            )}

            {timerState === 'paused' && (
              <>
                <Button onClick={handlePause} className="flex-1" variant="success" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  재개
                </Button>
                <Button onClick={handleStop} className="flex-1" variant="danger" size="lg">
                  <Square className="w-4 h-4 mr-2" />
                  중단
                </Button>
              </>
            )}
          </div>

          {/* 상태 표시 */}
          {timerState !== 'idle' && (
            <div className="text-center">
              <span
                className={cn(
                  'inline-block px-4 py-2 rounded-xl text-sm font-semibold',
                  timerState === 'running'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                )}
              >
                {timerState === 'running' ? '집중 중' : '일시정지됨'}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
