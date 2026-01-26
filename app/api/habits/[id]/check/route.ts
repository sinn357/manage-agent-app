import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getSeoulStartOfDay } from '@/lib/date';

function parseSeoulDate(dateParam: string | null): Date {
  if (!dateParam) return getSeoulStartOfDay();
  const parsed = new Date(`${dateParam}T00:00:00+09:00`);
  if (Number.isNaN(parsed.getTime())) {
    return getSeoulStartOfDay();
  }
  return getSeoulStartOfDay(parsed);
}

// POST /api/habits/[id]/check - 습관 완료 체크
export async function POST(
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
      select: { id: true },
    });

    if (!habit) {
      return NextResponse.json(
        { success: false, error: 'Habit not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetDate = parseSeoulDate(searchParams.get('date'));

    const existing = await prisma.habitCheck.findUnique({
      where: {
        habitId_userId_date: {
          habitId: id,
          userId,
          date: targetDate,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already checked for this date' },
        { status: 400 }
      );
    }

    const check = await prisma.habitCheck.create({
      data: {
        habitId: id,
        userId,
        date: targetDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Habit checked',
      check,
    });
  } catch (error) {
    console.error('Check habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/[id]/check - 습관 완료 체크 해제
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const targetDate = parseSeoulDate(searchParams.get('date'));

    const deleted = await prisma.habitCheck.deleteMany({
      where: {
        habitId: id,
        userId,
        date: targetDate,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Habit unchecked',
    });
  } catch (error) {
    console.error('Uncheck habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
