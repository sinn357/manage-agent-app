import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    // 작업 소유권 및 삭제 상태 확인
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
        deletedAt: { not: null }, // 이미 소프트 삭제된 것만 영구 삭제 가능
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found or not deleted' },
        { status: 404 }
      );
    }

    // DB에서 완전히 제거 (CASCADE로 관련 FocusSession도 삭제됨)
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Task permanently deleted',
    });
  } catch (error) {
    console.error('Permanent delete task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
