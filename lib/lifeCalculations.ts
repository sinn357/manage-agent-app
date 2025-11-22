/**
 * Life Timeline 계산 유틸리티
 */

export interface LifeStats {
  currentAge: number;
  targetAge: number;
  daysLived: number;
  daysLeft: number;
  totalDays: number;
  percentage: number;
  yearsLeft: number;
  monthsLeft: number;
  birthDate?: Date | string;
  targetDeathDate?: Date | string;
}

export interface GoalTimeRemaining {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  percentage: number; // 0-100, 목표까지의 진행률
}

/**
 * 생년월일로부터 현재 나이 계산
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 생년월일로부터 살아온 일수 계산
 */
export function calculateDaysLived(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 목표 수명까지 남은 일수 계산
 */
export function calculateDaysLeft(birthDate: Date, targetLifespan: number): number {
  const birth = new Date(birthDate);
  const targetDate = new Date(birth);
  targetDate.setFullYear(birth.getFullYear() + targetLifespan);

  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * 전체 수명 통계 계산
 */
export function calculateLifeStats(birthDate: Date, targetLifespan: number): LifeStats {
  const currentAge = calculateAge(birthDate);
  const daysLived = calculateDaysLived(birthDate);
  const daysLeft = calculateDaysLeft(birthDate, targetLifespan);
  const totalDays = targetLifespan * 365; // 대략적인 총 일수
  const percentage = Math.min(100, Math.max(0, (daysLived / totalDays) * 100));

  const yearsLeft = Math.floor(daysLeft / 365);
  const monthsLeft = Math.floor((daysLeft % 365) / 30);

  // 목표 사망 날짜 계산
  const birth = new Date(birthDate);
  const targetDeathDate = new Date(birth);
  targetDeathDate.setFullYear(birth.getFullYear() + targetLifespan);

  return {
    currentAge,
    targetAge: targetLifespan,
    daysLived,
    daysLeft,
    totalDays,
    percentage,
    yearsLeft,
    monthsLeft,
    birthDate: new Date(birthDate),
    targetDeathDate,
  };
}

/**
 * 목표 기한까지 남은 시간 계산
 */
export function calculateGoalTimeRemaining(targetDate: Date, startDate?: Date): GoalTimeRemaining {
  const now = new Date();
  const target = new Date(targetDate);
  const start = startDate ? new Date(startDate) : null;

  const diffTime = target.getTime() - now.getTime();
  const isOverdue = diffTime < 0;

  const totalSeconds = Math.abs(Math.floor(diffTime / 1000));
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  // 진행률 계산 (시작일이 있는 경우)
  let percentage = 0;
  if (start) {
    const totalDuration = target.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  } else {
    // 시작일이 없으면 현재부터 목표까지만 계산 (항상 0%)
    percentage = 0;
  }

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isOverdue,
    percentage,
  };
}

/**
 * 남은 시간을 사람이 읽기 쉬운 형태로 포맷
 */
export function formatTimeRemaining(timeRemaining: GoalTimeRemaining): string {
  if (timeRemaining.isOverdue) {
    return '기한 초과';
  }

  const { days, hours, minutes } = timeRemaining;

  if (days > 0) {
    if (hours > 0) {
      return `${days}일 ${hours}시간`;
    }
    return `${days}일`;
  }

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${hours}시간`;
  }

  if (minutes > 0) {
    return `${minutes}분`;
  }

  return `${timeRemaining.seconds}초`;
}

/**
 * 수명 남은 시간을 사람이 읽기 쉬운 형태로 포맷
 */
export function formatLifeTimeRemaining(stats: LifeStats): string {
  if (stats.yearsLeft > 0) {
    if (stats.monthsLeft > 0) {
      return `${stats.yearsLeft}년 ${stats.monthsLeft}개월`;
    }
    return `${stats.yearsLeft}년`;
  }

  if (stats.monthsLeft > 0) {
    return `${stats.monthsLeft}개월`;
  }

  return `${stats.daysLeft}일`;
}

/**
 * 날짜를 간단한 형태로 포맷 (YYYY.MM.DD)
 */
export function formatSimpleDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
