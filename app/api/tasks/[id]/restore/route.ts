import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    // 작업 소유권 및 삭제 상태 확인
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
        deletedAt: { not: null }, // 삭제된 것만 복구 가능
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found or not deleted' },
        { status: 404 }
      );
    }

    // deletedAt을 null로 설정하여 복구
    const restoredTask = await prisma.task.update({
      where: { id },
      data: {
        deletedAt: null,
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
            FocusSession: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task restored successfully',
      task: restoredTask,
    });
  } catch (error) {
    console.error('Restore task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
