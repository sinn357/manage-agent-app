import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tasks/today - 오늘 작업 목록 조회
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
    const includeUnscheduled = searchParams.get('includeUnscheduled') === 'true';

    // 오늘 날짜 범위 계산 (UTC 기준으로 어제~모레까지 넓게 잡기)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(23, 59, 59, 999);

    console.log('Date range:', {
      yesterday: yesterday.toISOString(),
      dayAfterTomorrow: dayAfterTomorrow.toISOString(),
      nowISOString: now.toISOString()
    });

    // 필터 조건
    const where: {
      userId: string;
      deletedAt?: null;
      status?: { notIn: string[] };
      OR?: Array<{
        scheduledDate?: {
          gte?: Date;
          lte?: Date;
        } | null;
        status?: string;
      }>;
      scheduledDate?: {
        gte: Date;
        lte: Date;
      };
    } = {
      userId,
      deletedAt: null, // 소프트 삭제되지 않은 것만
      status: { notIn: ['archived_success', 'archived_failed'] }, // 아카이브된 작업 제외
    };

    if (includeUnscheduled) {
      // 어제~모레 사이 작업 + 날짜 없는 미완료 작업
      where.OR = [
        {
          scheduledDate: {
            gte: yesterday,
            lte: dayAfterTomorrow,
          },
        },
        {
          scheduledDate: null,
          status: 'todo',
        },
        {
          scheduledDate: null,
          status: 'in_progress',
        },
      ];
    } else {
      // 어제~모레 사이 작업만
      where.scheduledDate = {
        gte: yesterday,
        lte: dayAfterTomorrow,
      };
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
        { priority: 'desc' }, // high > mid > low
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    console.log('Today tasks fetched:', tasks.length);

    // 통계 계산
    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
    };

    return NextResponse.json({
      success: true,
      tasks,
      stats,
    });
  } catch (error) {
    console.error('Get today tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
