'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Timer, Bell } from 'lucide-react';
import {
  notifyFocusComplete,
  notifyFocusAlmostComplete,
  getNotificationSettings,
} from '@/lib/notifications';

interface Task {
  id: string;
  title: string;
}

interface FocusTimerProps {
  tasks?: Task[];
  onSessionComplete?: () => void;
  taskTrigger?: { task: Task; minutes: number | 'custom' } | null;
  onTaskTriggerConsumed?: () => void;
}

type TimerState = 'idle' | 'running' | 'paused';

const QUICK_PRESETS = [5, 10, 25, 30, 45, 60];

export default function FocusTimer({ tasks = [], onSessionComplete, taskTrigger, onTaskTriggerConsumed }: FocusTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0); // 절대 시작 시간
  const targetEndTimeRef = useRef<number>(0); // 절대 종료 시간
  const elapsedRef = useRef<number>(0);
  const fiveMinuteNotifiedRef = useRef<boolean>(false);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef<number>(timeLeft);
  const timerStateRef = useRef<TimerState>(timerState);

  // ref를 항상 최신 state로 동기화
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

          // 세션이 있으면 복구
          setSessionId(session.id);
          setSelectedMinutes(session.duration);
          setSelectedTaskId(session.taskId || '');

          // 경과 시간 계산
          const lastUpdated = session.lastUpdatedAt ? new Date(session.lastUpdatedAt).getTime() : new Date(session.startedAt).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);

          // 남은 시간 계산
          const savedTimeLeft = session.timeLeft || (session.duration * 60);
          let actualTimeLeft = savedTimeLeft;

          if (session.timerState === 'running') {
            actualTimeLeft = Math.max(0, savedTimeLeft - elapsedSeconds);
          }

          setTimeLeft(actualTimeLeft);
          setTimerState((session.timerState as TimerState) || 'running');

          // startTimeRef와 elapsedRef 초기화
          if (session.timerState === 'running') {
            startTimeRef.current = Date.now();
            targetEndTimeRef.current = Date.now() + (actualTimeLeft * 1000); // 절대 종료 시간
            elapsedRef.current = (session.actualTime || 0) * 60; // DB에 저장된 actualTime(분)을 초로 변환
          } else {
            startTimeRef.current = 0;
            targetEndTimeRef.current = 0;
            elapsedRef.current = (session.actualTime || 0) * 60; // paused 상태에서도 복구
          }

          if (actualTimeLeft === 0) {
            // 타이머가 이미 끝난 경우
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

  // Task Trigger 감지 (작업 시작 버튼에서 호출)
  useEffect(() => {
    if (taskTrigger && timerState === 'idle') {
      const { task, minutes } = taskTrigger;

      // 작업 선택
      setSelectedTaskId(task.id);

      // 시간 설정
      if (minutes !== 'custom') {
        setSelectedMinutes(minutes);
        setTimeLeft(minutes * 60);
        setCustomMinutes('');
      }
      // 'custom'인 경우 작업만 선택하고 사용자가 직접 입력하도록 함

      // Trigger 소비
      onTaskTriggerConsumed?.();
    }
  }, [taskTrigger, timerState, onTaskTriggerConsumed]);

  // 타이머가 끝났을 때
  useEffect(() => {
    if (timeLeft === 0 && timerState === 'running') {
      handleComplete();
    }
  }, [timeLeft, timerState]);

  // Page Visibility API: 탭이 다시 보일 때 시간 재동기화
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerState === 'running' && targetEndTimeRef.current > 0) {
        // 탭이 다시 활성화될 때 정확한 시간 재계산
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));
        setTimeLeft(remaining);
        console.log('[FocusTimer] Visibility restored, synced time:', remaining);

        if (remaining === 0) {
          handleComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timerState]);

  // 타이머 틱 (절대 시간 기준, 100ms마다 체크)
  useEffect(() => {
    if (timerState === 'running') {
      let lastSecond = -1;

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));

        // 초가 바뀔 때만 상태 업데이트 (렌더링 최적화)
        if (remaining !== lastSecond) {
          lastSecond = remaining;
          setTimeLeft(remaining);

          // 5분 전 알림 (300초)
          if (remaining === 300 && !fiveMinuteNotifiedRef.current) {
            try {
              const settings = getNotificationSettings();
              if (settings.enabled && settings.focusReminder) {
                notifyFocusAlmostComplete(5);
                console.log('[FocusTimer] 5-minute reminder notification sent');
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
      }, 100); // 100ms마다 체크

      // 5초마다 DB에 저장
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [timerState]);

  // DB에 타이머 상태 저장
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

  const handleQuickPresetChange = (value: string) => {
    if (timerState === 'idle' && value) {
      const minutes = parseInt(value);
      setSelectedMinutes(minutes);
      setTimeLeft(minutes * 60);
      setCustomMinutes(minutes.toString());
    }
  };

  const handleCustomChange = (value: string) => {
    if (timerState === 'idle') {
      setCustomMinutes(value);
      const num = parseInt(value);
      if (!isNaN(num) && num > 0 && num <= 999) {
        setSelectedMinutes(num);
        setTimeLeft(num * 60);
      }
    }
  };

  const handleStart = async () => {
    try {
      // FocusSession 생성
      const response = await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: selectedMinutes,
          taskId: selectedTaskId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session.id);
        setTimerState('running');
        const now = Date.now();
        startTimeRef.current = now;
        targetEndTimeRef.current = now + (selectedMinutes * 60 * 1000); // 절대 종료 시간
        elapsedRef.current = 0;
        fiveMinuteNotifiedRef.current = false;

        // 작업 상태를 'in_progress'로 변경
        if (selectedTaskId) {
          try {
            await fetch(`/api/tasks/${selectedTaskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'in_progress' }),
            });
            console.log('[FocusTimer] Task status changed to in_progress');
          } catch (err) {
            console.error('[FocusTimer] Failed to update task status:', err);
          }
        }
      }
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  };

  const handlePause = async () => {
    if (timerState === 'running') {
      // 실제 경과 시간 계산
      const actualElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      elapsedRef.current += actualElapsed;
      setTimerState('paused');

      // DB에 paused 상태 및 중간 actualTime 저장
      if (sessionId) {
        await fetch(`/api/focus-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeLeft: timeLeftRef.current,
            timerState: 'paused',
            actualTime: Math.floor(elapsedRef.current / 60), // 분 단위로 중간 저장
          }),
        });
      }
    } else if (timerState === 'paused') {
      const now = Date.now();
      startTimeRef.current = now;
      targetEndTimeRef.current = now + (timeLeftRef.current * 1000); // 남은 시간으로 새 종료 시간 설정
      setTimerState('running');

      // DB에 running 상태 저장
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
      // 실제 진행 시간 계산 (설정 시간 - 남은 시간)
      const totalSeconds = selectedMinutes * 60;
      const actualTimeSeconds = totalSeconds - timeLeftRef.current;

      console.log('[FocusTimer] Stop - Total:', totalSeconds, 'Remaining:', timeLeftRef.current, 'Actual:', actualTimeSeconds);

      // 세션 중단으로 기록
      await fetch(`/api/focus-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualTime: Math.floor(actualTimeSeconds / 60), // minutes
          completed: false,
          interrupted: true,
        }),
      });
    }

    // 작업 상태를 'todo'로 복귀
    if (currentTaskId) {
      try {
        await fetch(`/api/tasks/${currentTaskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'todo' }),
        });
        console.log('[FocusTimer] Task status reverted to todo');
      } catch (err) {
        console.error('[FocusTimer] Failed to revert task status:', err);
      }
    }

    // 리셋
    setTimerState('idle');
    setTimeLeft(selectedMinutes * 60);
    setSessionId(null);
    elapsedRef.current = 0;

    // 히스토리 갱신
    onSessionComplete?.();
  };

  const handleComplete = async () => {
    const currentTaskId = selectedTaskId;

    if (sessionId) {
      // 세션 완료로 기록
      await fetch(`/api/focus-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualTime: selectedMinutes,
          completed: true,
          interrupted: false,
        }),
      });

      // 브라우저 알림 (설정 확인)
      try {
        const settings = getNotificationSettings();
        console.log('[FocusTimer] Notification settings:', settings);
        console.log('[FocusTimer] Notification permission:', typeof window !== 'undefined' ? Notification.permission : 'N/A');

        if (settings.enabled && settings.focusComplete) {
          notifyFocusComplete(selectedMinutes * 60);
          console.log('[FocusTimer] Focus complete notification sent');
        }
      } catch (error) {
        console.error('[FocusTimer] Notification error:', error);
      }
    }

    // 작업 상태를 'completed'로 변경
    if (currentTaskId) {
      try {
        await fetch(`/api/tasks/${currentTaskId}/complete`, {
          method: 'PATCH',
        });
        console.log('[FocusTimer] Task status changed to completed');
      } catch (err) {
        console.error('[FocusTimer] Failed to complete task:', err);
      }
    }

    // 리셋
    setTimerState('idle');
    setTimeLeft(selectedMinutes * 60);
    setSessionId(null);
    elapsedRef.current = 0;
    fiveMinuteNotifiedRef.current = false;

    // 히스토리 갱신
    onSessionComplete?.();
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100;

  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            포커스 타이머
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          포커스 타이머
        </CardTitle>
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
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
      </CardHeader>

      <CardContent>

      {/* 타이머 디스플레이 */}
      <div className="relative mb-6">
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

      {/* 시간 입력 (드롭다운 포함) */}
      {timerState === 'idle' && (
        <div className="mb-6">
          <label htmlFor="custom-minutes" className="block text-sm font-medium text-foreground mb-2">
            시간 설정 (분)
          </label>
          <div className="flex gap-3">
            <input
              id="custom-minutes"
              type="number"
              min="1"
              max="999"
              value={customMinutes}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="직접 입력"
            />
            <select
              value=""
              onChange={(e) => handleQuickPresetChange(e.target.value)}
              className="px-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">선택</option>
              {QUICK_PRESETS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes}분
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 작업 선택 */}
      {timerState === 'idle' && tasks.length > 0 && (
        <div className="mb-6">
          <label htmlFor="task-select" className="block text-sm font-medium text-foreground mb-2">
            작업 연결 (선택)
          </label>
          <select
            id="task-select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
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

      {/* 컨트롤 버튼 */}
      <div className="flex gap-3">
        {timerState === 'idle' && (
          <Button
            onClick={handleStart}
            className="flex-1"
            size="lg"
          >
            시작
          </Button>
        )}

        {timerState === 'running' && (
          <>
            <Button
              onClick={handlePause}
              className="flex-1"
              variant="warning"
              size="lg"
            >
              일시정지
            </Button>
            <Button
              onClick={handleStop}
              className="flex-1"
              variant="danger"
              size="lg"
            >
              중단
            </Button>
          </>
        )}

        {timerState === 'paused' && (
          <>
            <Button
              onClick={handlePause}
              className="flex-1"
              variant="success"
              size="lg"
            >
              재개
            </Button>
            <Button
              onClick={handleStop}
              className="flex-1"
              variant="danger"
              size="lg"
            >
              중단
            </Button>
          </>
        )}
      </div>

      {/* 상태 표시 */}
      {timerState !== 'idle' && (
        <div className="mt-4 text-center">
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
      </CardContent>
    </Card>
  );
}
