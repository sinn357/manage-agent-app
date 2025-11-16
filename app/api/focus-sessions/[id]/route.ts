import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/focus-sessions/[id] - 포커스 세션 업데이트 (완료/중단)
export async function PATCH(
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

    // 세션 소유권 확인
    const existingSession = await prisma.focusSession.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { actualTime, completed, interrupted, timeLeft, timerState } = body;

    // 세션 종료 시 endedAt 설정
    const shouldEnd = completed === true || interrupted === true;

    // 업데이트할 데이터 구성
    const updateData: any = {
      actualTime: actualTime !== undefined ? actualTime : existingSession.actualTime,
      completed: completed !== undefined ? completed : existingSession.completed,
      interrupted: interrupted !== undefined ? interrupted : existingSession.interrupted,
      endedAt: shouldEnd ? new Date() : existingSession.endedAt,
    };

    // 타이머 상태 업데이트 (진행 중인 세션만)
    if (!shouldEnd) {
      if (timeLeft !== undefined) {
        updateData.timeLeft = timeLeft;
      }
      if (timerState !== undefined) {
        updateData.timerState = timerState;
      }
      updateData.lastUpdatedAt = new Date();
    }

    // 세션 업데이트
    const updatedSession = await prisma.focusSession.update({
      where: { id },
      data: updateData,
      include: {
        Task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Focus session updated',
      session: updatedSession,
    });
  } catch (error) {
    console.error('Update focus session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/focus-sessions/[id] - 포커스 세션 삭제
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

    // 세션 소유권 확인
    const existingSession = await prisma.focusSession.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // 세션 삭제
    await prisma.focusSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Focus session deleted',
    });
  } catch (error) {
    console.error('Delete focus session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
