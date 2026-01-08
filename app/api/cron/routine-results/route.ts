import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addDays, getSeoulStartOfDay } from '@/lib/date';

type RoutineRow = {
  id: string;
  userId: string;
  recurrenceType: string;
  recurrenceDays: string | null;
  active: boolean;
  createdAt: Date;
};

function isRoutineScheduledForDate(routine: RoutineRow, targetDate: Date): boolean {
  if (!routine.active) return false;

  if (routine.recurrenceType === 'daily') {
    return true;
  }

  if (routine.recurrenceType === 'weekly') {
    if (!routine.recurrenceDays) return false;
    try {
      const days = JSON.parse(routine.recurrenceDays);
      const dayOfWeek = targetDate.getUTCDay(); // Seoul 기준 날짜와 일치
      return Array.isArray(days) && days.includes(dayOfWeek);
    } catch (error) {
      console.error('[Cron] Failed to parse recurrenceDays:', error);
      return false;
    }
  }

  if (routine.recurrenceType === 'monthly') {
    const dayOfMonth = targetDate.getUTCDate();
    const routineStart = getSeoulStartOfDay(routine.createdAt);
    const routineDay = routineStart.getUTCDate();
    return dayOfMonth === routineDay;
  }

  return false;
}

// POST /api/cron/routine-results - 루틴 성공/실패 결과 자동 기록
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const seoulToday = getSeoulStartOfDay();
    const targetDate = addDays(seoulToday, -1);

    console.log('[Cron] Routine results job target date', targetDate.toISOString());

    const routines = await prisma.routine.findMany({
      where: { active: true },
      select: {
        id: true,
        userId: true,
        recurrenceType: true,
        recurrenceDays: true,
        active: true,
        createdAt: true,
      },
    });

    let successCount = 0;
    let failedCount = 0;
    let processedCount = 0;

    for (const routine of routines as RoutineRow[]) {
      if (!isRoutineScheduledForDate(routine, targetDate)) {
        continue;
      }

      const check = await prisma.routineCheck.findUnique({
        where: {
          routineId_userId_date: {
            routineId: routine.id,
            userId: routine.userId,
            date: targetDate,
          },
        },
      });

      const status = check ? 'success' : 'failed';

      await prisma.routineResult.upsert({
        where: {
          routineId_userId_date: {
            routineId: routine.id,
            userId: routine.userId,
            date: targetDate,
          },
        },
        update: {
          status,
        },
        create: {
          routineId: routine.id,
          userId: routine.userId,
          date: targetDate,
          status,
        },
      });

      if (status === 'success') {
        successCount++;
      } else {
        failedCount++;
      }

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: 'Routine results job completed',
      results: {
        total: processedCount,
        success: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('[Cron] Routine results error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 테스트용 (개발 환경에서만)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    );
  }

  return POST(request);
}
