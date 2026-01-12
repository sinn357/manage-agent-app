/**
 * 작업 시작 시간 알림 스케줄러
 * - scheduledTime 기반 알림
 * - localStorage 기반 스케줄 저장 (새로고침 대응)
 * - Page Visibility API (탭 복귀 시 재동기화)
 * - 미리 알림 (5분/10분/15분 전)
 */

import { toast } from 'sonner';
import { playNotificationSound, shouldPlaySound } from './notificationSound';

interface Task {
  id: string;
  title: string;
  scheduledDate?: Date | string | null;
  scheduledTime?: string | null;
  status: string;
}

interface ScheduledNotification {
  taskId: string;
  taskTitle: string;
  scheduledAt: number; // timestamp
  isPreReminder: boolean; // 미리 알림 여부
  reminderMinutes?: number; // 미리 알림 시간 (분)
}

export interface TaskNotificationSettings {
  enabled: boolean;
  preReminder: boolean;
  preReminderMinutes: number; // 5, 10, 15
  sound: boolean;
}

const SETTINGS_KEY = 'task-notification-settings';
const SCHEDULE_KEY = 'task-notification-schedule';

// 타이머 저장소 (메모리)
const scheduledTimers = new Map<string, NodeJS.Timeout>();

/**
 * 기본 설정
 */
function getDefaultSettings(): TaskNotificationSettings {
  return {
    enabled: true,
    preReminder: true,
    preReminderMinutes: 5,
    sound: true,
  };
}

/**
 * 설정 로드
 */
export function getTaskNotificationSettings(): TaskNotificationSettings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...getDefaultSettings(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('[TaskScheduler] Failed to load settings:', error);
  }

  return getDefaultSettings();
}

/**
 * 설정 저장
 */
export function saveTaskNotificationSettings(settings: TaskNotificationSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[TaskScheduler] Failed to save settings:', error);
  }
}

/**
 * iOS Safari 감지
 */
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const chrome = /CriOS|FxiOS|OPiOS|mercury/.test(ua);

  return iOS && webkit && !chrome;
}

/**
 * 시스템 알림 지원 여부
 */
function supportsSystemNotification(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && !isIOSSafari();
}

/**
 * 하이브리드 알림 표시 (작업 시작 시간용)
 */
function showTaskNotification(
  title: string,
  body: string,
  taskId: string,
  isPreReminder: boolean
) {
  const isTabActive = typeof document !== 'undefined' && document.visibilityState === 'visible';
  const settings = getTaskNotificationSettings();

  if (!settings.enabled) {
    console.log('[TaskScheduler] Notifications disabled in settings');
    return;
  }

  console.log('[TaskScheduler] showTaskNotification:', { title, isTabActive, isPreReminder });

  if (isTabActive) {
    // 탭 활성: 소리 + 토스트
    if (settings.sound && shouldPlaySound()) {
      playNotificationSound().catch((err) => {
        console.error('[TaskScheduler] Sound playback failed:', err);
      });
    }

    toast.info(title, {
      description: body,
      duration: 8000,
      icon: isPreReminder ? '⏰' : '🔔',
    });

    console.log('[TaskScheduler] Toast shown (tab active)');
  } else {
    // 탭 비활성: 시스템 알림 시도
    if (supportsSystemNotification() && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          tag: `task-${taskId}`,
          requireInteraction: !isPreReminder,
        });

        notification.onclick = () => {
          window.focus();
        };

        console.log('[TaskScheduler] System notification shown (tab inactive)');
      } catch (error) {
        console.error('[TaskScheduler] System notification failed:', error);
        // 실패 시 토스트로 대체
        toast.info(title, {
          description: body,
          duration: 8000,
        });
      }
    } else {
      // 시스템 알림 미지원: 토스트 대체
      toast.info(title, {
        description: body,
        duration: 8000,
      });
      console.log('[TaskScheduler] Toast fallback');
    }
  }
}

/**
 * 작업 시작 시간 알림 트리거
 */
function triggerTaskStartNotification(taskTitle: string, taskId: string) {
  showTaskNotification(
    '🔔 작업 시작 시간',
    `"${taskTitle}" 작업을 시작할 시간입니다.`,
    taskId,
    false
  );

  // 스케줄에서 제거
  removeFromSchedule(taskId, false);
}

/**
 * 미리 알림 트리거
 */
function triggerPreReminder(taskTitle: string, taskId: string, minutes: number) {
  showTaskNotification(
    '⏰ 작업 시작 예정',
    `"${taskTitle}" 작업이 ${minutes}분 후 시작됩니다.`,
    taskId,
    true
  );

  // 스케줄에서 제거
  removeFromSchedule(taskId, true);
}

/**
 * 스케줄 저장 (localStorage)
 */
function saveSchedule(schedule: ScheduledNotification[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  } catch (error) {
    console.error('[TaskScheduler] Failed to save schedule:', error);
  }
}

/**
 * 스케줄 로드 (localStorage)
 */
function loadSchedule(): ScheduledNotification[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(SCHEDULE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[TaskScheduler] Failed to load schedule:', error);
  }

  return [];
}

/**
 * 스케줄에서 제거
 */
function removeFromSchedule(taskId: string, isPreReminder: boolean) {
  const schedule = loadSchedule();
  const filtered = schedule.filter(
    (item) => !(item.taskId === taskId && item.isPreReminder === isPreReminder)
  );
  saveSchedule(filtered);
}

/**
 * 스케줄에 추가
 */
function addToSchedule(notification: ScheduledNotification) {
  const schedule = loadSchedule();

  // 중복 제거
  const filtered = schedule.filter(
    (item) => !(item.taskId === notification.taskId && item.isPreReminder === notification.isPreReminder)
  );

  filtered.push(notification);
  saveSchedule(filtered);
}

/**
 * 작업의 알림 스케줄링
 */
export function scheduleTaskNotification(task: Task): void {
  const settings = getTaskNotificationSettings();

  if (!settings.enabled) {
    console.log('[TaskScheduler] Notifications disabled');
    return;
  }

  if (!task.scheduledDate || !task.scheduledTime) {
    console.log('[TaskScheduler] Task has no scheduled time:', task.id);
    return;
  }

  if (task.status === 'completed' || task.status === 'archived_success' || task.status === 'archived_failed') {
    console.log('[TaskScheduler] Task is completed or archived:', task.id);
    return;
  }

  try {
    // 날짜 + 시간 조합
    const dateStr = typeof task.scheduledDate === 'string'
      ? task.scheduledDate.split('T')[0]
      : task.scheduledDate.toISOString().split('T')[0];

    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(dateStr);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const now = Date.now();
    const scheduledTime = scheduledDateTime.getTime();
    const delay = scheduledTime - now;

    // 이미 지난 시간
    if (delay < 0) {
      console.log('[TaskScheduler] Task time already passed:', task.title);
      return;
    }

    console.log('[TaskScheduler] Scheduling notification:', {
      task: task.title,
      scheduledTime: scheduledDateTime.toISOString(),
      delayMinutes: Math.round(delay / 60000),
    });

    // 1. 작업 시작 시간 알림
    const mainTimerId = `${task.id}-main`;
    const mainTimer = setTimeout(() => {
      triggerTaskStartNotification(task.title, task.id);
      scheduledTimers.delete(mainTimerId);
    }, delay);
    scheduledTimers.set(mainTimerId, mainTimer);

    // 스케줄에 저장
    addToSchedule({
      taskId: task.id,
      taskTitle: task.title,
      scheduledAt: scheduledTime,
      isPreReminder: false,
    });

    // 2. 미리 알림 (설정된 경우)
    if (settings.preReminder) {
      const preReminderTime = scheduledTime - settings.preReminderMinutes * 60 * 1000;
      const preDelay = preReminderTime - now;

      if (preDelay > 0) {
        const preTimerId = `${task.id}-pre`;
        const preTimer = setTimeout(() => {
          triggerPreReminder(task.title, task.id, settings.preReminderMinutes);
          scheduledTimers.delete(preTimerId);
        }, preDelay);
        scheduledTimers.set(preTimerId, preTimer);

        // 스케줄에 저장
        addToSchedule({
          taskId: task.id,
          taskTitle: task.title,
          scheduledAt: preReminderTime,
          isPreReminder: true,
          reminderMinutes: settings.preReminderMinutes,
        });

        console.log('[TaskScheduler] Pre-reminder scheduled:', {
          task: task.title,
          minutes: settings.preReminderMinutes,
        });
      }
    }
  } catch (error) {
    console.error('[TaskScheduler] Failed to schedule notification:', error);
  }
}

/**
 * 특정 작업의 알림 취소
 */
export function cancelTaskNotification(taskId: string): void {
  // 메모리에서 타이머 취소
  const mainTimerId = `${taskId}-main`;
  const preTimerId = `${taskId}-pre`;

  if (scheduledTimers.has(mainTimerId)) {
    clearTimeout(scheduledTimers.get(mainTimerId));
    scheduledTimers.delete(mainTimerId);
  }

  if (scheduledTimers.has(preTimerId)) {
    clearTimeout(scheduledTimers.get(preTimerId));
    scheduledTimers.delete(preTimerId);
  }

  // 스케줄에서 제거
  const schedule = loadSchedule();
  const filtered = schedule.filter((item) => item.taskId !== taskId);
  saveSchedule(filtered);

  console.log('[TaskScheduler] Notification cancelled:', taskId);
}

/**
 * 모든 알림 취소
 */
export function cancelAllTaskNotifications(): void {
  // 메모리에서 모든 타이머 취소
  scheduledTimers.forEach((timer) => clearTimeout(timer));
  scheduledTimers.clear();

  // 스케줄 초기화
  saveSchedule([]);

  console.log('[TaskScheduler] All notifications cancelled');
}

/**
 * 여러 작업의 알림 일괄 스케줄링
 */
export function scheduleMultipleTaskNotifications(tasks: Task[]): void {
  cancelAllTaskNotifications();

  tasks.forEach((task) => {
    scheduleTaskNotification(task);
  });

  console.log('[TaskScheduler] Scheduled notifications for', tasks.length, 'tasks');
}

/**
 * 저장된 스케줄 복원 (페이지 로드 시)
 */
export function restoreSchedule(tasks: Task[]): void {
  const schedule = loadSchedule();
  const now = Date.now();

  console.log('[TaskScheduler] Restoring schedule:', schedule.length, 'items');

  schedule.forEach((item) => {
    // 이미 지난 알림은 제거
    if (item.scheduledAt < now) {
      console.log('[TaskScheduler] Removing expired notification:', item.taskTitle);
      removeFromSchedule(item.taskId, item.isPreReminder);
      return;
    }

    // 작업 찾기
    const task = tasks.find((t) => t.id === item.taskId);
    if (!task) {
      console.log('[TaskScheduler] Task not found, removing from schedule:', item.taskId);
      removeFromSchedule(item.taskId, item.isPreReminder);
      return;
    }

    // 알림 재스케줄링
    const delay = item.scheduledAt - now;

    if (item.isPreReminder) {
      const preTimerId = `${item.taskId}-pre`;
      const preTimer = setTimeout(() => {
        triggerPreReminder(item.taskTitle, item.taskId, item.reminderMinutes || 5);
        scheduledTimers.delete(preTimerId);
      }, delay);
      scheduledTimers.set(preTimerId, preTimer);

      console.log('[TaskScheduler] Pre-reminder restored:', item.taskTitle);
    } else {
      const mainTimerId = `${item.taskId}-main`;
      const mainTimer = setTimeout(() => {
        triggerTaskStartNotification(item.taskTitle, item.taskId);
        scheduledTimers.delete(mainTimerId);
      }, delay);
      scheduledTimers.set(mainTimerId, mainTimer);

      console.log('[TaskScheduler] Main notification restored:', item.taskTitle);
    }
  });
}

/**
 * Page Visibility API 설정 (탭 복귀 시 재동기화)
 */
export function setupVisibilityListener(tasks: Task[]): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('[TaskScheduler] Tab became visible, restoring schedule');
      restoreSchedule(tasks);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
