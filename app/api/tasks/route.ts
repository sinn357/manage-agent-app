import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tasks - 작업 목록 조회
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
    const status = searchParams.get('status'); // todo, in_progress, completed
    const goalId = searchParams.get('goalId'); // 특정 목표의 작업만
    const priority = searchParams.get('priority'); // high, mid, low
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 필터 조건 구성
    const where: {
      userId: string;
      status?: string;
      goalId?: string | null;
      priority?: string;
    } = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (goalId) {
      if (goalId === 'none') {
        // 목표 없는 작업 (일회성)
        where.goalId = null;
      } else {
        where.goalId = goalId;
      }
    }

    if (priority) {
      where.priority = priority;
    }

    // 작업 조회
    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: [
        { status: 'asc' }, // todo > in_progress > completed
        { order: 'asc' }, // 수동 정렬 (드래그앤드롭)
        { createdAt: 'desc' }, // 같은 order 값일 때 최신순
      ],
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - 작업 생성
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
    const { title, description, scheduledDate, scheduledTime, scheduledEndTime, priority, goalId } = body;

    // 입력 유효성 검사
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // 우선순위 유효성 검사
    const validPriorities = ['high', 'mid', 'low'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : 'mid';

    // goalId 검증 (제공된 경우)
    if (goalId) {
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
    }

    // 마지막 order 값 가져오기
    const lastTask = await prisma.task.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = lastTask ? lastTask.order + 1 : 0;

    // 작업 생성
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTime: scheduledTime || null,
        scheduledEndTime: scheduledEndTime || null,
        priority: taskPriority,
        order: newOrder,
        userId,
        goalId: goalId || null,
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

    return NextResponse.json(
      {
        success: true,
        message: 'Task created successfully',
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task error:', error);

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
