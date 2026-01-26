'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, Square, ArrowRight } from 'lucide-react';
import FocusTimerDetailModal from './FocusTimerDetailModal';
import {
  notifyFocusComplete,
  notifyFocusAlmostComplete,
  getNotificationSettings,
} from '@/lib/notifications';

interface Task {
  id: string;
  title: string;
}

interface FocusTimerCompactProps {
  tasks?: Task[];
  onSessionComplete?: () => void;
  taskTrigger?: { task: Task; minutes: number | 'custom' } | null;
  onTaskTriggerConsumed?: () => void;
}

type TimerState = 'idle' | 'running' | 'paused';

const QUICK_PRESETS = [25, 50];

export default function FocusTimerCompact({
  tasks = [],
  onSessionComplete,
  taskTrigger,
  onTaskTriggerConsumed,
}: FocusTimerCompactProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetEndTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const fiveMinuteNotifiedRef = useRef<boolean>(false);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef<number>(timeLeft);
  const timerStateRef = useRef<TimerState>(timerState);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    timerStateRef.current = timerState;
  }, [timeLeft, timerState]);

  // 컴포넌트 마운트 시 active 세션 복구
  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        const response = await fetch('/api/focus-sessions?active=true&limit=1');
        const data = await response.json();

        if (data.success && data.sessions.length > 0) {
          const session = data.sessions[0];
          setSessionId(session.id);
          setSelectedMinutes(session.duration);
          setSelectedTaskId(session.taskId || '');

          const lastUpdated = session.lastUpdatedAt
            ? new Date(session.lastUpdatedAt).getTime()
            : new Date(session.startedAt).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
          const savedTimeLeft = session.timeLeft || session.duration * 60;
          let actualTimeLeft = savedTimeLeft;

          if (session.timerState === 'running') {
            actualTimeLeft = Math.max(0, savedTimeLeft - elapsedSeconds);
          }

          setTimeLeft(actualTimeLeft);
          setTimerState((session.timerState as TimerState) || 'running');

          if (session.timerState === 'running') {
            startTimeRef.current = Date.now();
            targetEndTimeRef.current = Date.now() + actualTimeLeft * 1000;
            elapsedRef.current = (session.actualTime || 0) * 60;
          } else {
            startTimeRef.current = 0;
            targetEndTimeRef.current = 0;
            elapsedRef.current = (session.actualTime || 0) * 60;
          }

          if (actualTimeLeft === 0) {
            handleComplete();
          }
        }
      } catch (error) {
        console.error('Failed to load active session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActiveSession();
  }, []);

  // Task Trigger 감지
  useEffect(() => {
    if (taskTrigger && timerState === 'idle') {
      const { task, minutes } = taskTrigger;
      setSelectedTaskId(task.id);
      if (minutes !== 'custom') {
        setSelectedMinutes(minutes);
        setTimeLeft(minutes * 60);
      }
      // 상세 모달 열기 (custom인 경우 또는 바로 시작하고 싶을 때)
      setIsDetailOpen(true);
      onTaskTriggerConsumed?.();
    }
  }, [taskTrigger, timerState, onTaskTriggerConsumed]);

  // 타이머 완료 감지
  useEffect(() => {
    if (timeLeft === 0 && timerState === 'running') {
      handleComplete();
    }
  }, [timeLeft, timerState]);

  // Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        timerState === 'running' &&
        targetEndTimeRef.current > 0
      ) {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          handleComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState]);

  // 타이머 틱
  useEffect(() => {
    if (timerState === 'running') {
      let lastSecond = -1;

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));

        if (remaining !== lastSecond) {
          lastSecond = remaining;
          setTimeLeft(remaining);

          if (remaining === 300 && !fiveMinuteNotifiedRef.current) {
            try {
              const settings = getNotificationSettings();
              if (settings.enabled && settings.focusReminder) {
                notifyFocusAlmostComplete(5);
              }
              fiveMinuteNotifiedRef.current = true;
            } catch (error) {
              console.error('[FocusTimer] Reminder notification error:', error);
            }
          }

          if (remaining === 0) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
          }
        }
      }, 100);

      saveIntervalRef.current = setInterval(() => {
        saveTimerState();
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [timerState]);

  const saveTimerState = async () => {
    if (!sessionId) return;
    try {
      await fetch(`/api/focus-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeLeft: timeLeftRef.current,
          timerState: timerStateRef.current,
        }),
      });
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  };

  const handleQuickStart = async (minutes: number) => {
    try {
      const response = await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: minutes, taskId: null }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session.id);
        setSelectedMinutes(minutes);
        setTimeLeft(minutes * 60);
        setTimerState('running');
        const now = Date.now();
        startTimeRef.current = now;
        targetEndTimeRef.current = now + minutes * 60 * 1000;
        elapsedRef.current = 0;
        fiveMinuteNotifiedRef.current = false;
      }
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  };

  const handlePause = async () => {
    if (timerState === 'running') {
      const actualElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      elapsedRef.current += actualElapsed;
      setTimerState('paused');

      if (sessionId) {
        await fetch(`/api/focus-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeLeft: timeLeftRef.current,
            timerState: 'paused',
            actualTime: Math.floor(elapsedRef.current / 60),
          }),
        });
      }
    } else if (timerState === 'paused') {
      const now = Date.now();
      startTimeRef.current = now;
      targetEndTimeRef.current = now + timeLeftRef.current * 1000;
      setTimerState('running');

      if (sessionId) {
        await fetch(`/api/focus-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeLeft: timeLeftRef.current,
            timerState: 'running',
          }),
        });
      }
    }
  };

  const handleStop = async () => {
    const currentTaskId = selectedTaskId;

    if (sessionId) {
      const totalSeconds = selectedMinutes * 60;
      const actualTimeSeconds = totalSeconds - timeLeftRef.current;

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

    if (currentTaskId) {
      try {
        await fetch(`/api/tasks/${currentTaskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'todo' }),
        });
      } catch (err) {
        console.error('[FocusTimer] Failed to revert task status:', err);
      }
    }

    setTimerState('idle');
    setTimeLeft(selectedMinutes * 60);
    setSessionId(null);
    elapsedRef.current = 0;
    onSessionComplete?.();
  };

  const handleComplete = async () => {
    const currentTaskId = selectedTaskId;

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

    if (currentTaskId) {
      try {
        await fetch(`/api/tasks/${currentTaskId}/complete`, { method: 'PATCH' });
      } catch (err) {
        console.error('[FocusTimer] Failed to complete task:', err);
      }
    }

    setTimerState('idle');
    setTimeLeft(selectedMinutes * 60);
    setSessionId(null);
    elapsedRef.current = 0;
    fiveMinuteNotifiedRef.current = false;
    onSessionComplete?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100;

  // 현재 선택된 작업 찾기
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 border border-border">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-surface rounded w-24"></div>
            <div className="h-6 w-6 bg-surface rounded"></div>
          </div>
          <div className="h-12 bg-surface rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">포커스</span>
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

        {timerState === 'idle' ? (
          /* Idle: 빠른 시작 버튼 */
          <div className="space-y-2">
            <div className="flex gap-2">
              {QUICK_PRESETS.map((mins) => (
                <Button
                  key={mins}
                  onClick={() => handleQuickStart(mins)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {mins}분
                </Button>
              ))}
            </div>
            <button
              onClick={() => setIsDetailOpen(true)}
              className="text-xs text-primary hover:underline w-full text-center"
            >
              커스텀 시간 설정 →
            </button>
          </div>
        ) : (
          /* Running/Paused: 타이머 표시 */
          <div className="space-y-3">
            {/* 타이머 디스플레이 */}
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-foreground-secondary mt-1">
                {selectedMinutes}분 중 {Math.floor((selectedMinutes * 60 - timeLeft) / 60)}분 경과
              </div>
            </div>

            {/* 연결된 작업 */}
            {selectedTask && (
              <div className="text-xs text-foreground-secondary truncate text-center px-2 py-1 bg-surface rounded-lg">
                📌 {selectedTask.title}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 제어 버튼 */}
            <div className="flex gap-2">
              <Button
                onClick={handlePause}
                variant={timerState === 'running' ? 'warning' : 'success'}
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                {timerState === 'running' ? (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    일시정지
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    재개
                  </>
                )}
              </Button>
              <Button
                onClick={handleStop}
                variant="danger"
                size="sm"
                className="h-8 text-xs px-3"
              >
                <Square className="w-3 h-3" />
              </Button>
            </div>

            {/* 상태 뱃지 */}
            <div className="text-center">
              <span
                className={cn(
                  'inline-block px-3 py-1 rounded-lg text-xs font-semibold',
                  timerState === 'running'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                )}
              >
                {timerState === 'running' ? '집중 중' : '일시정지됨'}
              </span>
            </div>
          </div>
        )}
      </div>

      <FocusTimerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        tasks={tasks}
        onSessionComplete={onSessionComplete}
        // 현재 상태 전달
        currentState={{
          timerState,
          selectedMinutes,
          timeLeft,
          selectedTaskId,
          sessionId,
        }}
        onStateChange={(newState) => {
          if (newState.timerState !== undefined) setTimerState(newState.timerState);
          if (newState.selectedMinutes !== undefined) setSelectedMinutes(newState.selectedMinutes);
          if (newState.timeLeft !== undefined) setTimeLeft(newState.timeLeft);
          if (newState.selectedTaskId !== undefined) setSelectedTaskId(newState.selectedTaskId);
          if (newState.sessionId !== undefined) setSessionId(newState.sessionId);
          if (newState.startTime !== undefined) startTimeRef.current = newState.startTime;
          if (newState.targetEndTime !== undefined) targetEndTimeRef.current = newState.targetEndTime;
          if (newState.elapsed !== undefined) elapsedRef.current = newState.elapsed;
          if (newState.fiveMinuteNotified !== undefined)
            fiveMinuteNotifiedRef.current = newState.fiveMinuteNotified;
        }}
      />
    </>
  );
}
