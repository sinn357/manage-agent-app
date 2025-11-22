import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/goals - 목표 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 목표 조회 (마일스톤, 작업 개수 + LifeGoal 포함)
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status,
      },
      include: {
        Milestone: {
          orderBy: { order: 'asc' },
        },
        Task: {
          select: {
            id: true,
            status: true,
          },
        },
        LifeGoal: {
          select: {
            id: true,
            title: true,
            icon: true,
            color: true,
          },
        },
        _count: {
          select: {
            Milestone: true,
            Task: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    // 진행률 계산
    const goalsWithProgress = goals.map((goal) => {
      const totalTasks = goal.Task.length;
      const completedTasks = goal.Task.filter((t) => t.status === 'completed').length;
      const totalMilestones = goal.Milestone.length;
      const completedMilestones = goal.Milestone.filter((m) => m.completed).length;

      let progress = 0;
      if (totalTasks > 0 && totalMilestones > 0) {
        // 둘 다 있으면 가중 평균 (Task 70%, Milestone 30%)
        const taskProgress = (completedTasks / totalTasks) * 100;
        const milestoneProgress = (completedMilestones / totalMilestones) * 100;
        progress = taskProgress * 0.7 + milestoneProgress * 0.3;
      } else if (totalTasks > 0) {
        progress = (completedTasks / totalTasks) * 100;
      } else if (totalMilestones > 0) {
        progress = (completedMilestones / totalMilestones) * 100;
      }

      return {
        ...goal,
        progress: Math.round(progress),
        stats: {
          totalTasks,
          completedTasks,
          totalMilestones,
          completedMilestones,
        },
      };
    });

    return NextResponse.json({
      success: true,
      goals: goalsWithProgress,
    });
  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/goals - 목표 생성
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, targetDate, color } = body;

    // 입력 유효성 검사
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // 색상 기본값
    const goalColor = color || '#3B82F6';

    // 마지막 order 값 가져오기
    const lastGoal = await prisma.goal.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = lastGoal ? lastGoal.order + 1 : 0;

    // 목표 생성
    const goal = await prisma.goal.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        color: goalColor,
        order: newOrder,
        userId,
      },
      include: {
        Milestone: true,
        _count: {
          select: {
            Milestone: true,
            Task: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Goal created successfully',
        goal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create goal error:', error);

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
