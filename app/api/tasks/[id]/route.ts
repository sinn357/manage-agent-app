import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tasks/[id] - 작업 상세 조회
export async function GET(
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

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId,
        deletedAt: null, // 소프트 삭제되지 않은 것만
      },
      include: {
        Goal: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        FocusSession: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            FocusSession: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - 작업 수정
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
        deletedAt: null, // 소프트 삭제되지 않은 것만
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, scheduledDate, scheduledTime, scheduledEndTime, priority, status, goalId, order } = body;

    // 업데이트할 데이터 준비
    const updateData: {
      title?: string;
      description?: string | null;
      scheduledDate?: Date | null;
      scheduledTime?: string | null;
      scheduledEndTime?: string | null;
      priority?: string;
      status?: string;
      goalId?: string | null;
      order?: number;
      completedAt?: Date | null;
    } = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    }

    if (scheduledTime !== undefined) {
      updateData.scheduledTime = scheduledTime || null;
    }

    if (scheduledEndTime !== undefined) {
      updateData.scheduledEndTime = scheduledEndTime || null;
    }

    if (priority !== undefined) {
      if (!['high', 'mid', 'low'].includes(priority)) {
        return NextResponse.json(
          { success: false, error: 'Invalid priority value' },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }

    if (status !== undefined) {
      if (!['todo', 'in_progress', 'completed'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updateData.status = status;

      // 상태가 completed로 변경되면 completedAt 설정
      if (status === 'completed') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    if (goalId !== undefined) {
      // goalId 검증
      if (goalId !== null && goalId !== '') {
        const goal = await prisma.goal.findFirst({
          where: {
            id: goalId,
            userId,
          },
        });

        if (!goal) {
          return NextResponse.json(
            { success: false, error: 'Goal not found' },
            { status: 404 }
          );
        }
        updateData.goalId = goalId;
      } else {
        updateData.goalId = null;
      }
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    // 작업 업데이트
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
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
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - 작업 소프트 삭제
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

    // 작업 소유권 확인
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
        deletedAt: null, // 이미 삭제되지 않은 것만
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 소프트 삭제 (deletedAt 설정)
    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
