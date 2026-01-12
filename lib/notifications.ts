/**
 * 하이브리드 알림 시스템
 * - 탭 활성: 소리 + 토스트 알림
 * - 탭 비활성: 시스템 알림 (지원하는 경우)
 * - iOS Safari: 토스트 알림 대체
 */

import { toast } from 'sonner';
import { playNotificationSound, shouldPlaySound } from './notificationSound';

export type NotificationPermission = 'granted' | 'denied' | 'default';

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
 * 알림 권한 상태 확인
 */
export function getNotificationPermission(): NotificationPermission {
  if (!supportsSystemNotification()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsSystemNotification()) {
    console.warn('[Notification] System notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  }

  return 'denied';
}

/**
 * 하이브리드 알림 표시
 */
function showHybridNotification(
  title: string,
  body: string,
  options?: {
    icon?: string;
    requireInteraction?: boolean;
    tag?: string;
    toastDuration?: number;
  }
) {
  const isTabActive = typeof document !== 'undefined' && document.visibilityState === 'visible';

  if (isTabActive) {
    // 탭 활성: 소리 + 토스트
    if (shouldPlaySound()) {
      playNotificationSound();
    }

    toast.success(title, {
      description: body,
      duration: options?.toastDuration || 5000,
      icon: options?.icon,
    });

    console.log('[Notification] Toast shown (tab active)');
  } else {
    // 탭 비활성: 시스템 알림 시도
    if (supportsSystemNotification() && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          tag: options?.tag,
          requireInteraction: options?.requireInteraction,
        });

        notification.onclick = () => {
          window.focus();
        };

        console.log('[Notification] System notification shown (tab inactive)');
      } catch (error) {
        console.error('[Notification] System notification failed:', error);
        // 실패 시 토스트로 대체 (사용자가 나중에 탭 활성화하면 보임)
        toast.success(title, {
          description: body,
          duration: options?.toastDuration || 5000,
        });
      }
    } else {
      // 시스템 알림 미지원: 토스트 대체
      toast.success(title, {
        description: body,
        duration: options?.toastDuration || 5000,
      });
      console.log('[Notification] Toast fallback (system not supported)');
    }
  }
}

/**
 * 포커스 세션 완료 알림
 */
export function notifyFocusComplete(duration: number) {
  const minutes = Math.floor(duration / 60);
  showHybridNotification(
    '🎉 포커스 세션 완료!',
    `${minutes}분 집중을 완료했습니다. 잘하셨어요!`,
    {
      tag: 'focus-complete',
      requireInteraction: true,
      toastDuration: 8000,
    }
  );
}

/**
 * 포커스 세션 곧 종료 알림
 */
export function notifyFocusAlmostComplete(remainingMinutes: number) {
  showHybridNotification(
    '⏰ 포커스 세션 곧 종료',
    `${remainingMinutes}분 남았습니다.`,
    {
      tag: 'focus-reminder',
      toastDuration: 5000,
    }
  );
}

/**
 * 작업 마감일 임박 알림
 */
export function notifyTaskDueSoon(taskTitle: string, daysLeft: number) {
  showHybridNotification(
    '⚠️ 마감일 임박',
    `"${taskTitle}" - ${daysLeft}일 남았습니다.`,
    {
      tag: `task-due-${taskTitle}`,
    }
  );
}

/**
 * 작업 마감일 지남 알림
 */
export function notifyTaskOverdue(taskTitle: string, daysOverdue: number) {
  showHybridNotification(
    '🚨 마감일 지남',
    `"${taskTitle}" - ${daysOverdue}일 지났습니다.`,
    {
      tag: `task-overdue-${taskTitle}`,
      requireInteraction: true,
      toastDuration: 8000,
    }
  );
}

/**
 * 목표 마감일 임박 알림
 */
export function notifyGoalDueSoon(goalTitle: string, daysLeft: number) {
  showHybridNotification(
    '🎯 목표 마감일 임박',
    `"${goalTitle}" - ${daysLeft}일 남았습니다.`,
    {
      tag: `goal-due-${goalTitle}`,
    }
  );
}

/**
 * 알림 설정
 */
export interface NotificationSettings {
  enabled: boolean;
  focusComplete: boolean;
  focusReminder: boolean;
  taskDue: boolean;
  goalDue: boolean;
  reminderDays: number;
  sound: boolean; // 소리 설정 추가
}

const SETTINGS_KEY = 'notification-settings';

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...getDefaultSettings(), ...JSON.parse(stored) }; // 기본값 병합
    }
  } catch (error) {
    console.error('[Notification] Failed to load settings:', error);
  }

  return getDefaultSettings();
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[Notification] Failed to save settings:', error);
  }
}

function getDefaultSettings(): NotificationSettings {
  return {
    enabled: true,
    focusComplete: true,
    focusReminder: true,
    taskDue: true,
    goalDue: true,
    reminderDays: 3,
    sound: true, // 기본: 소리 켜짐
  };
}
