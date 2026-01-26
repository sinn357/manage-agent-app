import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getSeoulStartOfDay } from '@/lib/date';
import { getHabitsOverviewStats } from '@/lib/habitStats';

// GET /api/habits/stats - 전체 습관 요약 통계
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const habits = await prisma.habit.findMany({
      where: {
        userId,
        active: true,
      },
      include: {
        HabitCheck: {
          select: { date: true },
        },
        FocusSession: {
          select: { actualTime: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    const today = getSeoulStartOfDay();
    const overview = getHabitsOverviewStats({ habits, today });

    return NextResponse.json({
      success: true,
      overview,
    });
  } catch (error) {
    console.error('Get habits overview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch habits overview' },
      { status: 500 }
    );
  }
}
