import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/focus-sessions - 포커스 세션 생성
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
    const { duration, taskId } = body;

    if (!duration || duration < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid duration' },
        { status: 400 }
      );
    }

    // taskId가 제공된 경우 작업 소유권 확인
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId,
        },
      });

      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
    }

    // 세션 생성
    const session = await prisma.focusSession.create({
      data: {
        duration,
        actualTime: 0,
        startedAt: new Date(),
        completed: false,
        interrupted: false,
        userId,
        taskId: taskId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Focus session created',
      session,
    });
  } catch (error) {
    console.error('Create focus session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/focus-sessions - 포커스 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: {
      userId: string;
      taskId?: string;
    } = {
      userId,
    };

    if (taskId) {
      where.taskId = taskId;
    }

    const sessions = await prisma.focusSession.findMany({
      where,
      include: {
        Task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // 통계 계산
    const stats = {
      total: sessions.length,
      completed: sessions.filter((s) => s.completed).length,
      interrupted: sessions.filter((s) => s.interrupted).length,
      totalMinutes: sessions.reduce((sum, s) => sum + s.actualTime, 0),
    };

    return NextResponse.json({
      success: true,
      sessions,
      stats,
    });
  } catch (error) {
    console.error('Get focus sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
