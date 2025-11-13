import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/goals/[id] - 목표 상세 조회
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

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        Milestone: {
          orderBy: { order: 'asc' },
        },
        Task: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            Milestone: true,
            Task: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    // 진행률 계산
    const totalTasks = goal.Task.length;
    const completedTasks = goal.Task.filter((t) => t.status === 'completed').length;
    const totalMilestones = goal.Milestone.length;
    const completedMilestones = goal.Milestone.filter((m) => m.completed).length;

    let progress = 0;
    if (totalTasks > 0 && totalMilestones > 0) {
      const taskProgress = (completedTasks / totalTasks) * 100;
      const milestoneProgress = (completedMilestones / totalMilestones) * 100;
      progress = taskProgress * 0.7 + milestoneProgress * 0.3;
    } else if (totalTasks > 0) {
      progress = (completedTasks / totalTasks) * 100;
    } else if (totalMilestones > 0) {
      progress = (completedMilestones / totalMilestones) * 100;
    }

    return NextResponse.json({
      success: true,
      goal: {
        ...goal,
        progress: Math.round(progress),
        stats: {
          totalTasks,
          completedTasks,
          totalMilestones,
          completedMilestones,
        },
      },
    });
  } catch (error) {
    console.error('Get goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/[id] - 목표 수정
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

    // 목표 소유권 확인
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, targetDate, color, status, order } = body;

    // 업데이트할 데이터 준비
    const updateData: {
      title?: string;
      description?: string | null;
      targetDate?: Date | null;
      color?: string;
      status?: string;
      order?: number;
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

    if (targetDate !== undefined) {
      updateData.targetDate = targetDate ? new Date(targetDate) : null;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (status !== undefined) {
      if (!['active', 'completed', 'archived'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    // 목표 업데이트
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: updateData,
      include: {
        Milestone: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            Milestone: true,
            Task: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Goal updated successfully',
      goal: updatedGoal,
    });
  } catch (error) {
    console.error('Update goal error:', error);

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

// DELETE /api/goals/[id] - 목표 삭제
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

    // 목표 소유권 확인
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    // 목표 삭제 (cascade로 마일스톤도 함께 삭제, 작업은 goalId만 null로)
    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
