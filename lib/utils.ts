import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * D-day 계산
 * @param targetDate - 목표 날짜
 * @returns D-day 객체 (daysLeft, isOverdue, display)
 */
export function calculateDDay(targetDate: Date | string | null): {
  daysLeft: number;
  isOverdue: boolean;
  display: string;
} {
  if (!targetDate) {
    return {
      daysLeft: 0,
      isOverdue: false,
      display: '',
    };
  }

  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      daysLeft: 0,
      isOverdue: false,
      display: 'D-Day',
    };
  } else if (diffDays > 0) {
    return {
      daysLeft: diffDays,
      isOverdue: false,
      display: `D-${diffDays}`,
    };
  } else {
    return {
      daysLeft: diffDays,
      isOverdue: true,
      display: `D+${Math.abs(diffDays)}`,
    };
  }
}

/**
 * 날짜 포맷팅
 * @param date - 포맷할 날짜
 * @param format - 포맷 (short, medium, long)
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(
  date: Date | string | null,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    // 2025.01.13
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  } else if (format === 'medium') {
    // 2025년 1월 13일
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } else {
    // 2025년 1월 13일 (월)
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }
}

/**
 * 상대 시간 표시 (몇 분 전, 몇 시간 전 등)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return formatDate(d, 'short');
  }
}

/**
 * 시간 포맷팅 (분 -> HH:MM)
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}분`;
  } else if (mins === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${mins}분`;
  }
}

/**
 * 진행률 색상 반환
 */
export function getProgressColor(progress: number): string {
  if (progress === 0) return 'bg-gray-200';
  if (progress < 30) return 'bg-red-500';
  if (progress < 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * 우선순위 색상 반환
 */
export function getPriorityColor(priority: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 'high':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      };
    case 'mid':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      };
    case 'low':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
      };
  }
}

/**
 * 우선순위 라벨 반환
 */
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return '높음';
    case 'mid':
      return '보통';
    case 'low':
      return '낮음';
    default:
      return '보통';
  }
}
