import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tasks/archived - 아카이브된 작업 목록 조회
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
    const type = searchParams.get('type') || 'all'; // all, success, failed
    const limit = parseInt(searchParams.get('limit') || '100');

    // 아카이브 필터
    let statusFilter: string[] = [];
    if (type === 'success') {
      statusFilter = ['archived_success'];
    } else if (type === 'failed') {
      statusFilter = ['archived_failed'];
    } else {
      statusFilter = ['archived_success', 'archived_failed'];
    }

    // 아카이브된 작업 조회
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: statusFilter },
        deletedAt: null,
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
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    // 통계 계산
    const allArchived = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['archived_success', 'archived_failed'] },
        deletedAt: null,
      },
      select: {
        status: true,
        completedAt: true,
        scheduledDate: true,
      },
    });

    const stats = {
      total: allArchived.length,
      success: allArchived.filter((t) => t.status === 'archived_success').length,
      failed: allArchived.filter((t) => t.status === 'archived_failed').length,
      successRate: allArchived.length > 0
        ? Math.round((allArchived.filter((t) => t.status === 'archived_success').length / allArchived.length) * 100)
        : 0,
    };

    return NextResponse.json({
      success: true,
      tasks,
      stats,
    });
  } catch (error) {
    console.error('Get archived tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
