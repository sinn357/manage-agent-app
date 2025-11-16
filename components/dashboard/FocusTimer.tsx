'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
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

const PRESETS = [
  { label: '25분', minutes: 25 },
  { label: '50분', minutes: 50 },
  { label: '90분', minutes: 90 },
];

export default function FocusTimer({ tasks = [], onSessionComplete }: FocusTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const fiveMinuteNotifiedRef = useRef<boolean>(false);

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
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);

  const handlePresetClick = (minutes: number) => {
    if (timerState === 'idle') {
      setSelectedMinutes(minutes);
      setTimeLeft(minutes * 60);
      setCustomMinutes('');
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

  const handlePause = () => {
    if (timerState === 'running') {
      elapsedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimerState('paused');
    } else if (timerState === 'paused') {
      startTimeRef.current = Date.now();
      setTimerState('running');
    }
  };

  const handleStop = async () => {
    if (sessionId) {
      const actualTime = elapsedRef.current + (timerState === 'running'
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0);

      // 세션 중단으로 기록
      await fetch(`/api/focus-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualTime: Math.floor(actualTime / 60), // minutes
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">포커스 타이머</h2>
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
          <button
            onClick={requestNotificationPermission}
            className="text-xs text-violet-500 hover:text-violet-600"
          >
            알림 허용
          </button>
        )}
      </div>

      {/* 타이머 디스플레이 */}
      <div className="relative mb-6">
        <div className="text-center mb-4">
          <div className="text-6xl font-bold text-gray-900 mb-2">
            {formatTime(timeLeft)}
          </div>
          {timerState !== 'idle' && (
            <div className="text-sm text-gray-500">
              {selectedMinutes}분 중 {Math.floor((selectedMinutes * 60 - timeLeft) / 60)}분 경과
            </div>
          )}
        </div>

        {/* Progress bar */}
        {timerState !== 'idle' && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* 프리셋 & 커스텀 */}
      {timerState === 'idle' && (
        <div className="mb-6">
          <div className="flex gap-2 mb-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => handlePresetClick(preset.minutes)}
                className={cn(
                  'flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors',
                  selectedMinutes === preset.minutes && !customMinutes
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="custom-minutes" className="block text-sm font-medium text-gray-700 mb-1">
              커스텀 (분)
            </label>
            <input
              id="custom-minutes"
              type="number"
              min="1"
              max="999"
              value={customMinutes}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="직접 입력 (1-999분)"
            />
          </div>
        </div>
      )}

      {/* 작업 선택 */}
      {timerState === 'idle' && tasks.length > 0 && (
        <div className="mb-6">
          <label htmlFor="task-select" className="block text-sm font-medium text-gray-700 mb-1">
            작업 연결 (선택)
          </label>
          <select
            id="task-select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">작업 없음 (일반 포커스)</option>
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
          <button
            onClick={handleStart}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
          >
            시작
          </button>
        )}

        {timerState === 'running' && (
          <>
            <button
              onClick={handlePause}
              className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md transition-colors"
            >
              일시정지
            </button>
            <button
              onClick={handleStop}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
            >
              중단
            </button>
          </>
        )}

        {timerState === 'paused' && (
          <>
            <button
              onClick={handlePause}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
            >
              재개
            </button>
            <button
              onClick={handleStop}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
            >
              중단
            </button>
          </>
        )}
      </div>

      {/* 상태 표시 */}
      {timerState !== 'idle' && (
        <div className="mt-4 text-center text-sm">
          <span
            className={cn(
              'inline-block px-3 py-1 rounded-full font-medium',
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
