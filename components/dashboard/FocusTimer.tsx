'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
}

type TimerState = 'idle' | 'running' | 'paused';

const QUICK_PRESETS = [5, 10, 25, 30, 45, 60];

export default function FocusTimer({ tasks = [], onSessionComplete }: FocusTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
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
            elapsedRef.current = 0;
          } else {
            startTimeRef.current = 0;
            elapsedRef.current = 0;
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

  // 타이머가 끝났을 때
  useEffect(() => {
    if (timeLeft === 0 && timerState === 'running') {
      handleComplete();
    }
  }, [timeLeft, timerState]);

  // 타이머 틱
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;

          // 5분 전 알림 (300초)
          if (newTime === 300 && !fiveMinuteNotifiedRef.current) {
            const settings = getNotificationSettings();
            if (settings.enabled && settings.focusReminder) {
              notifyFocusAlmostComplete(5);
            }
            fiveMinuteNotifiedRef.current = true;
          }

          if (newTime <= 0) {
            return 0;
          }
          return newTime;
        });
      }, 1000);

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
        startTimeRef.current = Date.now();
        elapsedRef.current = 0;
        fiveMinuteNotifiedRef.current = false;
      }
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  };

  const handlePause = async () => {
    if (timerState === 'running') {
      elapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimerState('paused');

      // DB에 paused 상태 저장
      if (sessionId) {
        await fetch(`/api/focus-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeLeft: timeLeftRef.current,
            timerState: 'paused',
          }),
        });
      }
    } else if (timerState === 'paused') {
      startTimeRef.current = Date.now();
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
    if (sessionId) {
      // 경과 시간 계산 (초 단위)
      let actualTimeSeconds = elapsedRef.current;
      if (timerState === 'running' && startTimeRef.current > 0) {
        actualTimeSeconds += Math.floor((Date.now() - startTimeRef.current) / 1000);
      }

      // 비정상적으로 큰 값 방지 (최대 24시간)
      const maxSeconds = 24 * 60 * 60;
      if (actualTimeSeconds > maxSeconds) {
        actualTimeSeconds = 0;
      }

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

    // 리셋
    setTimerState('idle');
    setTimeLeft(selectedMinutes * 60);
    setSessionId(null);
    elapsedRef.current = 0;

    // 히스토리 갱신
    onSessionComplete?.();
  };

  const handleComplete = async () => {
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
      const settings = getNotificationSettings();
      if (settings.enabled && settings.focusComplete) {
        notifyFocusComplete(selectedMinutes * 60);
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
      <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">포커스 타이머</h2>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-900">포커스 타이머</h2>
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={requestNotificationPermission}
            className="text-xs text-violet-500 hover:text-violet-600"
          >
            알림 허용
          </Button>
        )}
      </div>

      {/* 타이머 디스플레이 */}
      <div className="relative mb-4">
        <div className="text-center mb-3">
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {formatTime(timeLeft)}
          </div>
          {timerState !== 'idle' && (
            <div className="text-xs text-gray-500">
              {selectedMinutes}분 중 {Math.floor((selectedMinutes * 60 - timeLeft) / 60)}분 경과
            </div>
          )}
        </div>

        {/* Progress bar */}
        {timerState !== 'idle' && (
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* 시간 입력 (드롭다운 포함) */}
      {timerState === 'idle' && (
        <div className="mb-4">
          <label htmlFor="custom-minutes" className="block text-xs font-medium text-gray-700 mb-1">
            시간 설정 (분)
          </label>
          <div className="flex gap-2">
            <input
              id="custom-minutes"
              type="number"
              min="1"
              max="999"
              value={customMinutes}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="직접 입력"
            />
            <select
              value=""
              onChange={(e) => handleQuickPresetChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
        <div className="mb-4">
          <label htmlFor="task-select" className="block text-xs font-medium text-gray-700 mb-1">
            작업 연결 (선택)
          </label>
          <select
            id="task-select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="flex gap-2">
        {timerState === 'idle' && (
          <Button
            onClick={handleStart}
            className="flex-1 py-3"
            size="sm"
          >
            시작
          </Button>
        )}

        {timerState === 'running' && (
          <>
            <Button
              onClick={handlePause}
              className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-sm"
              size="sm"
            >
              일시정지
            </Button>
            <Button
              onClick={handleStop}
              className="flex-1 py-3 text-sm"
              variant="destructive"
              size="sm"
            >
              중단
            </Button>
          </>
        )}

        {timerState === 'paused' && (
          <>
            <Button
              onClick={handlePause}
              className="flex-1 py-3 text-sm"
              size="sm"
            >
              재개
            </Button>
            <Button
              onClick={handleStop}
              className="flex-1 py-3 text-sm"
              variant="destructive"
              size="sm"
            >
              중단
            </Button>
          </>
        )}
      </div>

      {/* 상태 표시 */}
      {timerState !== 'idle' && (
        <div className="mt-3 text-center text-xs">
          <span
            className={cn(
              'inline-block px-2 py-1 rounded-full font-medium',
              timerState === 'running'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            )}
          >
            {timerState === 'running' ? '집중 중' : '일시정지됨'}
          </span>
        </div>
      )}
    </div>
  );
}
