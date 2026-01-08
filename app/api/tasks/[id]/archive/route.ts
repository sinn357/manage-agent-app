import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ARCHIVE_STATUSES = ['archived_success', 'archived_failed'] as const;
type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];

// PATCH /api/tasks/[id]/archive - 작업을 수동 아카이브
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

    const body = await request.json();
    const status = body?.status as ArchiveStatus | undefined;

    if (!status || !ARCHIVE_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid archive status' },
        { status: 400 }
      );
    }

    const task = await prisma.task.findFirst({
      where: { id, userId },
      select: { status: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Only completed tasks can be archived' },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
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
      message: 'Task archived successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Archive task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
