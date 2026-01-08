import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: 모든 루틴 가져오기
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const routines = await prisma.routine.findMany({
      where: {
        userId: user.id,
        ...(activeOnly && { active: true }),
      },
      include: {
        RoutineCheck: {
          where: {
            date: today,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });

    const routinesWithCheck = routines.map(({ RoutineCheck, ...routine }) => ({
      ...routine,
      isCheckedToday: RoutineCheck.length > 0,
    }));

    return NextResponse.json({ success: true, routines: routinesWithCheck });
  } catch (error) {
    console.error('Get routines error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routines' },
      { status: 500 }
    );
  }
}

// POST: 새 루틴 생성
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
      recurrenceType,
      recurrenceDays,
      timeOfDay,
      duration,
      priority,
      active,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const routine = await prisma.routine.create({
      data: {
        title,
        description,
        recurrenceType: recurrenceType || 'daily',
        recurrenceDays: recurrenceDays ? JSON.stringify(recurrenceDays) : null,
        timeOfDay,
        duration,
        priority: priority || 'mid',
        active: active !== undefined ? active : true,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error('Create routine error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create routine' },
      { status: 500 }
    );
  }
}

// PATCH: 루틴 수정
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Routine ID is required' }, { status: 400 });
    }

    // 소유권 확인
    const existing = await prisma.routine.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Routine not found' }, { status: 404 });
    }

    // recurrenceDays가 배열이면 JSON 문자열로 변환
    if (updates.recurrenceDays && Array.isArray(updates.recurrenceDays)) {
      updates.recurrenceDays = JSON.stringify(updates.recurrenceDays);
    }

    const routine = await prisma.routine.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error('Update routine error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update routine' },
      { status: 500 }
    );
  }
}

// DELETE: 루틴 삭제
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Routine ID is required' }, { status: 400 });
    }

    // 소유권 확인
    const existing = await prisma.routine.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Routine not found' }, { status: 404 });
    }

    await prisma.routine.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete routine error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete routine' },
      { status: 500 }
    );
  }
}
