import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/life-goals/[id] - 인생목표 상세 조회
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

    const lifeGoal = await prisma.lifeGoal.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        Goal: {
          orderBy: { order: 'asc' },
          include: {
            Task: {
              select: {
                id: true,
                status: true,
              },
            },
            Milestone: {
              select: {
                id: true,
                completed: true,
              },
            },
          },
        },
        _count: {
          select: {
            Goal: true,
          },
        },
      },
    });

    if (!lifeGoal) {
      return NextResponse.json(
        { success: false, error: 'Life goal not found' },
        { status: 404 }
      );
    }

    // 진행률 계산
    const activeGoals = lifeGoal.Goal.filter((g) => g.status === 'active');
    let totalProgress = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    activeGoals.forEach((goal) => {
      const tasks = goal.Task.length;
      const completed = goal.Task.filter((t) => t.status === 'completed').length;
      const milestones = goal.Milestone.length;
      const completedMilestones = goal.Milestone.filter((m) => m.completed).length;

      totalTasks += tasks;
      completedTasks += completed;

      let goalProgress = 0;
      if (tasks > 0 && milestones > 0) {
        const taskProgress = (completed / tasks) * 100;
        const milestoneProgress = (completedMilestones / milestones) * 100;
        goalProgress = taskProgress * 0.7 + milestoneProgress * 0.3;
      } else if (tasks > 0) {
        goalProgress = (completed / tasks) * 100;
      } else if (milestones > 0) {
        goalProgress = (completedMilestones / milestones) * 100;
      }

      totalProgress += goalProgress;
    });

    const avgProgress = activeGoals.length > 0 ? totalProgress / activeGoals.length : 0;

    return NextResponse.json({
      success: true,
      lifeGoal: {
        ...lifeGoal,
        progress: Math.round(avgProgress),
        stats: {
          totalGoals: lifeGoal.Goal.length,
          activeGoals: activeGoals.length,
          totalTasks,
          completedTasks,
        },
      },
    });
  } catch (error) {
    console.error('Get life goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/life-goals/[id] - 인생목표 수정
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

    // 인생목표 소유권 확인
    const existingLifeGoal = await prisma.lifeGoal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingLifeGoal) {
      return NextResponse.json(
        { success: false, error: 'Life goal not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, category, icon, color, active, order } = body;

    // 업데이트할 데이터 준비
    const updateData: {
      title?: string;
      description?: string | null;
      category?: string;
      icon?: string;
      color?: string;
      active?: boolean;
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

    if (category !== undefined) {
      updateData.category = category;
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    // 인생목표 업데이트
    const updatedLifeGoal = await prisma.lifeGoal.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            Goal: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Life goal updated successfully',
      lifeGoal: updatedLifeGoal,
    });
  } catch (error) {
    console.error('Update life goal error:', error);

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

// DELETE /api/life-goals/[id] - 인생목표 삭제
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

    // 인생목표 소유권 확인
    const existingLifeGoal = await prisma.lifeGoal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingLifeGoal) {
      return NextResponse.json(
        { success: false, error: 'Life goal not found' },
        { status: 404 }
      );
    }

    // 연결된 목표들의 lifeGoalId를 null로 설정
    await prisma.goal.updateMany({
      where: { lifeGoalId: id },
      data: { lifeGoalId: null },
    });

    // 인생목표 삭제
    await prisma.lifeGoal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Life goal deleted successfully',
    });
  } catch (error) {
    console.error('Delete life goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
