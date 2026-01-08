import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/routines/[id]/check - 루틴 완료 체크
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

    const routine = await prisma.routine.findFirst({
      where: {
        id,
        userId,
      },
      select: { id: true },
    });

    if (!routine) {
      return NextResponse.json(
        { success: false, error: 'Routine not found' },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.routineCheck.findUnique({
      where: {
        routineId_userId_date: {
          routineId: id,
          userId,
          date: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already checked today' },
        { status: 400 }
      );
    }

    const check = await prisma.routineCheck.create({
      data: {
        routineId: id,
        userId,
        date: today,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Routine checked',
      check,
    });
  } catch (error) {
    console.error('Check routine error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/routines/[id]/check - 루틴 완료 체크 해제
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deleted = await prisma.routineCheck.deleteMany({
      where: {
        routineId: id,
        userId,
        date: today,
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
      message: 'Routine unchecked',
    });
  } catch (error) {
    console.error('Uncheck routine error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
