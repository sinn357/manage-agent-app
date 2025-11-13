import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/tasks/[id]/complete - 작업 완료 상태 토글
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

    // 작업 소유권 확인
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 상태 토글
    const newStatus = existingTask.status === 'completed' ? 'todo' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date() : null;

    // 작업 업데이트
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt,
      },
      include: {
        Goal: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        _count: {
          select: {
            focusSessions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Task ${newStatus === 'completed' ? 'completed' : 'reopened'}`,
      task: updatedTask,
    });
  } catch (error) {
    console.error('Toggle task complete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
