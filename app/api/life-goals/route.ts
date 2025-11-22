import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/life-goals - 인생목표 목록 조회
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
    const active = searchParams.get('active') !== 'false'; // 기본값 true
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 인생목표 조회 (하위 목표 포함)
    const lifeGoals = await prisma.lifeGoal.findMany({
      where: {
        userId,
        active,
      },
      include: {
        Goal: {
          select: {
            id: true,
            status: true,
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
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    // 진행률 계산
    const lifeGoalsWithProgress = lifeGoals.map((lifeGoal) => {
      const activeGoals = lifeGoal.Goal.filter((g) => g.status === 'active');

      if (activeGoals.length === 0) {
        return {
          ...lifeGoal,
          progress: 0,
          stats: {
            totalGoals: lifeGoal.Goal.length,
            activeGoals: 0,
            totalTasks: 0,
            completedTasks: 0,
          },
        };
      }

      // 모든 활성 목표의 진행률 평균
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

      return {
        ...lifeGoal,
        progress: Math.round(avgProgress),
        stats: {
          totalGoals: lifeGoal.Goal.length,
          activeGoals: activeGoals.length,
          totalTasks,
          completedTasks,
        },
      };
    });

    return NextResponse.json({
      success: true,
      lifeGoals: lifeGoalsWithProgress,
    });
  } catch (error) {
    console.error('Get life goals error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/life-goals - 인생목표 생성
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
    const { title, description, category, icon, color } = body;

    // 입력 유효성 검사
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // 기본값 설정
    const lifeGoalCategory = category || 'custom';
    const lifeGoalIcon = icon || '🌟';
    const lifeGoalColor = color || '#8B5CF6';

    // 마지막 order 값 가져오기
    const lastLifeGoal = await prisma.lifeGoal.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = lastLifeGoal ? lastLifeGoal.order + 1 : 0;

    // 인생목표 생성
    const lifeGoal = await prisma.lifeGoal.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: lifeGoalCategory,
        icon: lifeGoalIcon,
        color: lifeGoalColor,
        order: newOrder,
        userId,
      },
      include: {
        _count: {
          select: {
            Goal: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Life goal created successfully',
        lifeGoal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create life goal error:', error);

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
