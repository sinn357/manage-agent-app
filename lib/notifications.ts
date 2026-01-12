/**
 * 브라우저 알림 유틸리티
 * Web Notifications API를 사용하여 브라우저 알림을 관리합니다.
 */

export type NotificationPermission = 'granted' | 'denied' | 'default';

/**
 * 알림 권한 상태 확인
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support notifications');
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
 * 알림 표시
 */
export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Notification] This browser does not support notifications');
    return null;
  }

  console.log('[Notification] Permission status:', Notification.permission);

  if (Notification.permission !== 'granted') {
    console.warn('[Notification] Permission not granted. Current status:', Notification.permission);
    return null;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/icon.png',
    badge: '/badge.png',
    ...options,
  };

  console.log('[Notification] Creating notification:', title, defaultOptions);
  const notification = new Notification(title, defaultOptions);

  // 알림 이벤트 리스너
  notification.onclick = () => {
    console.log('[Notification] Clicked:', title);
    window.focus();
  };

  notification.onerror = (error) => {
    console.error('[Notification] Error:', error);
  };

  return notification;
}

/**
 * 포커스 세션 완료 알림
 */
export function notifyFocusComplete(duration: number) {
  const minutes = Math.floor(duration / 60);
  showNotification('🎉 포커스 세션 완료!', {
    body: `${minutes}분 집중을 완료했습니다. 잘하셨어요!`,
    tag: 'focus-complete',
    requireInteraction: true,
  });
}

/**
 * 포커스 세션 곧 종료 알림
 */
export function notifyFocusAlmostComplete(remainingMinutes: number) {
  showNotification('⏰ 포커스 세션 곧 종료', {
    body: `${remainingMinutes}분 남았습니다.`,
    tag: 'focus-reminder',
  });
}

/**
 * 작업 마감일 임박 알림
 */
export function notifyTaskDueSoon(taskTitle: string, daysLeft: number) {
  showNotification('⚠️ 마감일 임박', {
    body: `"${taskTitle}" - ${daysLeft}일 남았습니다.`,
    tag: `task-due-${taskTitle}`,
  });
}

/**
 * 작업 마감일 지남 알림
 */
export function notifyTaskOverdue(taskTitle: string, daysOverdue: number) {
  showNotification('🚨 마감일 지남', {
    body: `"${taskTitle}" - ${daysOverdue}일 지났습니다.`,
    tag: `task-overdue-${taskTitle}`,
    requireInteraction: true,
  });
}

/**
 * 목표 마감일 임박 알림
 */
export function notifyGoalDueSoon(goalTitle: string, daysLeft: number) {
  showNotification('🎯 목표 마감일 임박', {
    body: `"${goalTitle}" - ${daysLeft}일 남았습니다.`,
    tag: `goal-due-${goalTitle}`,
  });
}

/**
 * 알림 설정 저장 (localStorage)
 */
export interface NotificationSettings {
  enabled: boolean;
  focusComplete: boolean;
  focusReminder: boolean;
  taskDue: boolean;
  goalDue: boolean;
  reminderDays: number; // 마감일 며칠 전에 알림
}

const SETTINGS_KEY = 'notification-settings';

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load notification settings:', error);
  }

  return getDefaultSettings();
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
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
  };
}
