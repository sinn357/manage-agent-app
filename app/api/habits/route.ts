import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getSeoulStartOfDay } from '@/lib/date';

// GET: 습관 목록 + 오늘 체크 상태
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const today = getSeoulStartOfDay();

    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        ...(activeOnly && { active: true }),
      },
      include: {
        HabitCheck: {
          where: { date: today },
          select: { id: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    const habitsWithCheck = habits.map(({ HabitCheck, ...habit }) => ({
      ...habit,
      isCheckedToday: HabitCheck.length > 0,
    }));

    return NextResponse.json({ success: true, habits: habitsWithCheck });
  } catch (error) {
    console.error('Get habits error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

// POST: 새 습관 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      icon,
      color,
      recurrenceType,
      recurrenceDays,
      defaultDuration,
      timeOfDay,
      active,
      order,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        icon,
        color: color || undefined,
        recurrenceType: recurrenceType || 'daily',
        recurrenceDays: recurrenceDays ? JSON.stringify(recurrenceDays) : null,
        defaultDuration: defaultDuration ? Number(defaultDuration) : null,
        timeOfDay,
        active: active !== undefined ? active : true,
        order: Number.isInteger(order) ? order : 0,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, habit });
  } catch (error) {
    console.error('Create habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}
