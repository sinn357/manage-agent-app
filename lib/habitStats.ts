import { addDays, getSeoulStartOfDay } from '@/lib/date';

type HabitRecurrence = {
  recurrenceType: string;
  recurrenceDays: string | null;
};

type HabitCheckRow = {
  date: Date;
};

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseRecurrenceDays(recurrenceDays: string | null): number[] {
  if (!recurrenceDays) return [0, 1, 2, 3, 4, 5, 6];
  try {
    const parsed = JSON.parse(recurrenceDays);
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
    }
  } catch (error) {
    console.warn('[HabitStats] Failed to parse recurrenceDays:', error);
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

function isExpectedOnDate(date: Date, recurrence: HabitRecurrence): boolean {
  if (recurrence.recurrenceType === 'weekly') {
    const days = parseRecurrenceDays(recurrence.recurrenceDays);
    return days.includes(date.getUTCDay());
  }
  return true;
}

function countExpectedBetween(
  start: Date,
  end: Date,
  recurrence: HabitRecurrence
): number {
  if (start > end) return 0;
  if (recurrence.recurrenceType === 'daily') {
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  }

  let count = 0;
  let cursor = start;
  while (cursor <= end) {
    if (isExpectedOnDate(cursor, recurrence)) {
      count += 1;
    }
    cursor = addDays(cursor, 1);
  }
  return count;
}

function getWeekStart(date: Date): Date {
  const day = date.getUTCDay(); // 0 = Sun
  const offset = (day + 6) % 7; // Monday start
  return addDays(date, -offset);
}

function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function buildCheckSet(checks: HabitCheckRow[]): Set<string> {
  const set = new Set<string>();
  checks.forEach((check) => {
    set.add(toDateKey(getSeoulStartOfDay(check.date)));
  });
  return set;
}

export function calculateStreaks(
  checks: HabitCheckRow[],
  recurrence: HabitRecurrence,
  createdAt: Date,
  today: Date
): { current: number; longest: number } {
  const checkSet = buildCheckSet(checks);
  const startDate = getSeoulStartOfDay(createdAt);
  let current = 0;
  let cursor = today;

  while (cursor >= startDate) {
    if (!isExpectedOnDate(cursor, recurrence)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (checkSet.has(toDateKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }

  let longest = 0;
  let streak = 0;
  let iter = startDate;
  while (iter <= today) {
    if (isExpectedOnDate(iter, recurrence)) {
      if (checkSet.has(toDateKey(iter))) {
        streak += 1;
        longest = Math.max(longest, streak);
      } else {
        streak = 0;
      }
    }
    iter = addDays(iter, 1);
  }

  return { current, longest };
}

export function calculateHabitRates(
  checks: HabitCheckRow[],
  recurrence: HabitRecurrence,
  createdAt: Date,
  today: Date
): {
  totalChecks: number;
  totalExpected: number;
  overallRate: number;
  weeklyChecks: number;
  weeklyExpected: number;
  weeklyRate: number;
  monthlyChecks: number;
  monthlyExpected: number;
  monthlyRate: number;
} {
  const startDate = getSeoulStartOfDay(createdAt);
  const checkDates = checks.map((check) => getSeoulStartOfDay(check.date));
  const totalChecks = checks.length;
  const totalExpected = countExpectedBetween(startDate, today, recurrence);
  const overallRate = totalExpected > 0 ? Math.round((totalChecks / totalExpected) * 100) : 0;

  const weekStart = getWeekStart(today);
  const monthStart = getMonthStart(today);

  const weeklyChecks = checkDates.filter((date) => date >= weekStart && date <= today).length;
  const weeklyExpected = countExpectedBetween(weekStart, today, recurrence);
  const weeklyRate = weeklyExpected > 0 ? Math.round((weeklyChecks / weeklyExpected) * 100) : 0;

  const monthlyChecks = checkDates.filter((date) => date >= monthStart && date <= today).length;
  const monthlyExpected = countExpectedBetween(monthStart, today, recurrence);
  const monthlyRate = monthlyExpected > 0 ? Math.round((monthlyChecks / monthlyExpected) * 100) : 0;

  return {
    totalChecks,
    totalExpected,
    overallRate,
    weeklyChecks,
    weeklyExpected,
    weeklyRate,
    monthlyChecks,
    monthlyExpected,
    monthlyRate,
  };
}

export function getHabitsOverviewStats({
  habits,
  today,
}: {
  habits: Array<{
    id: string;
    title: string;
    icon: string | null;
    recurrenceType: string;
    recurrenceDays: string | null;
    createdAt: Date;
    HabitCheck: HabitCheckRow[];
    FocusSession: { actualTime: number }[];
  }>;
  today: Date;
}): {
  totalHabits: number;
  todayCompleted: number;
  todayTotal: number;
  todayRate: number;
  weeklyRate: number;
  monthlyRate: number;
  topStreaks: { habitId: string; habitTitle: string; habitIcon: string; streak: number }[];
  totalFocusMinutes: number;
} {
  let todayTotal = 0;
  let todayCompleted = 0;
  let weeklyChecks = 0;
  let weeklyExpected = 0;
  let monthlyChecks = 0;
  let monthlyExpected = 0;
  let totalFocusMinutes = 0;
  const streaks: { habitId: string; habitTitle: string; habitIcon: string; streak: number }[] = [];

  habits.forEach((habit) => {
    const recurrence = {
      recurrenceType: habit.recurrenceType,
      recurrenceDays: habit.recurrenceDays,
    };

    if (isExpectedOnDate(today, recurrence)) {
      todayTotal += 1;
      const checkSet = buildCheckSet(habit.HabitCheck);
      if (checkSet.has(toDateKey(today))) {
        todayCompleted += 1;
      }
    }

    const rates = calculateHabitRates(habit.HabitCheck, recurrence, habit.createdAt, today);
    weeklyChecks += rates.weeklyChecks;
    weeklyExpected += rates.weeklyExpected;
    monthlyChecks += rates.monthlyChecks;
    monthlyExpected += rates.monthlyExpected;

    const streak = calculateStreaks(habit.HabitCheck, recurrence, habit.createdAt, today).current;
    streaks.push({
      habitId: habit.id,
      habitTitle: habit.title,
      habitIcon: habit.icon || '✅',
      streak,
    });

    totalFocusMinutes += habit.FocusSession.reduce((sum, session) => sum + (session.actualTime || 0), 0);
  });

  const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const weeklyRate = weeklyExpected > 0 ? Math.round((weeklyChecks / weeklyExpected) * 100) : 0;
  const monthlyRate = monthlyExpected > 0 ? Math.round((monthlyChecks / monthlyExpected) * 100) : 0;

  const topStreaks = streaks
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  return {
    totalHabits: habits.length,
    todayCompleted,
    todayTotal,
    todayRate,
    weeklyRate,
    monthlyRate,
    topStreaks,
    totalFocusMinutes,
  };
}
