import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH /api/tasks/[id]/unarchive - 아카이브 복구
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;

    // 작업 확인
    const task = await prisma.task.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 아카이브 상태가 아니면 에러
    if (!task.status.startsWith('archived_')) {
      return NextResponse.json(
        { success: false, error: 'Task is not archived' },
        { status: 400 }
      );
    }

    // completed 상태로 복구
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: 'completed' },
      include: {
        Goal: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task unarchived successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Unarchive task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
