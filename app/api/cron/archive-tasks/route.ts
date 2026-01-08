import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/cron/archive-tasks - 24시간 지난 완료 작업을 자동 아카이브
export async function POST(request: NextRequest) {
  try {
    // Vercel Cron 인증 (production only)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log('[Cron] Starting archive task job at', now.toISOString());
    console.log('[Cron] Archiving tasks completed before', twentyFourHoursAgo.toISOString());

    // 24시간 전에 완료된 작업 찾기
    const completedTasks = await prisma.task.findMany({
      where: {
        status: 'completed',
        completedAt: { lte: twentyFourHoursAgo },
        deletedAt: null, // 삭제된 것은 제외
      },
      select: {
        id: true,
        completedAt: true,
        scheduledDate: true,
        title: true,
      },
    });

    console.log('[Cron] Found', completedTasks.length, 'tasks to archive');

    let successCount = 0;
    let failedCount = 0;

    // 각 작업을 아카이브
    for (const task of completedTasks) {
      // 기한 내 완료 vs 기한 외 완료 판단
      let isOnTime = false;

      if (!task.scheduledDate) {
        // 기한이 없으면 성공으로 간주
        isOnTime = true;
      } else {
        // completedAt이 scheduledDate 이전 또는 당일이면 성공
        const completedDate = new Date(task.completedAt!);
        const scheduledDate = new Date(task.scheduledDate);

        // 날짜만 비교 (시간 무시)
        completedDate.setHours(0, 0, 0, 0);
        scheduledDate.setHours(0, 0, 0, 0);

        isOnTime = completedDate <= scheduledDate;
      }

      const newStatus = isOnTime ? 'archived_success' : 'archived_failed';

      await prisma.task.update({
        where: { id: task.id },
        data: { status: newStatus },
      });

      if (isOnTime) {
        successCount++;
      } else {
        failedCount++;
      }

      console.log(`[Cron] Archived task "${task.title}" as ${newStatus}`);
    }

    console.log('[Cron] Archive job completed:', {
      total: completedTasks.length,
      success: successCount,
      failed: failedCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Archive job completed',
      archived: {
        total: completedTasks.length,
        success: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('[Cron] Archive task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 테스트용 (개발 환경에서만)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    );
  }

  // POST와 동일한 로직 (테스트용)
  return POST(request);
}
