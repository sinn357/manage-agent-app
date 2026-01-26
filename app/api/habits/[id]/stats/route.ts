import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getSeoulStartOfDay } from '@/lib/date';
import { calculateHabitRates, calculateStreaks } from '@/lib/habitStats';

// GET /api/habits/[id]/stats - 개별 습관 통계
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        HabitCheck: {
          select: { date: true },
        },
        FocusSession: {
          select: { actualTime: true },
        },
      },
    });

    if (!habit) {
      return NextResponse.json(
        { success: false, error: 'Habit not found' },
        { status: 404 }
      );
    }

    const today = getSeoulStartOfDay();
    const recurrence = {
      recurrenceType: habit.recurrenceType,
      recurrenceDays: habit.recurrenceDays,
    };

    const streaks = calculateStreaks(habit.HabitCheck, recurrence, habit.createdAt, today);
    const rates = calculateHabitRates(habit.HabitCheck, recurrence, habit.createdAt, today);

    const totalFocusMinutes = habit.FocusSession.reduce(
      (sum, session) => sum + (session.actualTime || 0),
      0
    );
    const focusSessions = habit.FocusSession.length;
    const avgFocusMinutes = focusSessions > 0 ? Math.round(totalFocusMinutes / focusSessions) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        habitId: habit.id,
        habitTitle: habit.title,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        totalChecks: rates.totalChecks,
        totalExpected: rates.totalExpected,
        overallRate: rates.overallRate,
        weeklyChecks: rates.weeklyChecks,
        weeklyExpected: rates.weeklyExpected,
        weeklyRate: rates.weeklyRate,
        monthlyChecks: rates.monthlyChecks,
        monthlyExpected: rates.monthlyExpected,
        monthlyRate: rates.monthlyRate,
        totalFocusMinutes,
        avgFocusMinutes,
        focusSessions,
      },
    });
  } catch (error) {
    console.error('Get habit stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch habit stats' },
      { status: 500 }
    );
  }
}
