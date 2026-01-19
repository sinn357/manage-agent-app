import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 주의 시작일(월요일)과 종료일(일요일) 계산
function getWeekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정

  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

// 주간 통계 계산
async function calculateWeeklyStats(userId: string, weekStart: Date, weekEnd: Date) {
  // 작업 통계
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { scheduledDate: { gte: weekStart, lte: weekEnd } },
        { createdAt: { gte: weekStart, lte: weekEnd } },
      ],
    },
    include: {
      Goal: { select: { id: true, title: true, color: true } },
    },
  });

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  // 집중 시간
  const focusSessions = await prisma.focusSession.findMany({
    where: {
      userId,
      startedAt: { gte: weekStart, lte: weekEnd },
    },
  });

  const focusMinutes = focusSessions.reduce((sum, s) => sum + s.actualTime, 0);

  // 목표별 진척도
  const goalStats = await prisma.goal.findMany({
    where: { userId, status: 'active' },
    include: {
      Task: {
        where: {
          deletedAt: null,
          OR: [
            { scheduledDate: { gte: weekStart, lte: weekEnd } },
            { createdAt: { gte: weekStart, lte: weekEnd } },
          ],
        },
      },
    },
  });

  const goalProgress = goalStats.map((goal) => {
    const total = goal.Task.length;
    const completed = goal.Task.filter((t) => t.status === 'completed').length;
    return {
      id: goal.id,
      title: goal.title,
      color: goal.color,
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // 미완료 작업 목록
  const incompleteTasks = tasks
    .filter((t) => t.status !== 'completed')
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      goalTitle: t.Goal?.title || null,
      goalColor: t.Goal?.color || null,
    }));

  // 완료 작업 목록
  const completedTasksList = completedTasks.map((t) => ({
    id: t.id,
    title: t.title,
    completedAt: t.completedAt,
    goalTitle: t.Goal?.title || null,
    goalColor: t.Goal?.color || null,
  }));

  // 일별 완료 작업 수
  const dailyCompletion: { [key: string]: number } = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyCompletion[dateKey] = 0;
  }

  completedTasks.forEach((task) => {
    if (task.completedAt) {
      const dateKey = task.completedAt.toISOString().split('T')[0];
      if (dailyCompletion[dateKey] !== undefined) {
        dailyCompletion[dateKey]++;
      }
    }
  });

  return {
    completedTasks: completedTasks.length,
    totalTasks,
    completionRate: Math.round(completionRate * 10) / 10,
    focusMinutes,
    focusHours: Math.round((focusMinutes / 60) * 10) / 10,
    goalProgress,
    incompleteTasks,
    completedTasksList,
    dailyCompletion: Object.entries(dailyCompletion).map(([date, count]) => ({ date, count })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get('week'); // ISO date string (선택)
    const historyParam = searchParams.get('history'); // 'true'면 히스토리 조회

    // 히스토리 조회
    if (historyParam === 'true') {
      const reviews = await prisma.weeklyReview.findMany({
        where: { userId: user.id },
        orderBy: { weekStart: 'desc' },
        take: 12, // 최근 12주
      });

      return NextResponse.json({ success: true, data: { reviews } });
    }

    // 특정 주 또는 이번 주
    const targetDate = weekParam ? new Date(weekParam) : new Date();
    const { weekStart, weekEnd } = getWeekBounds(targetDate);

    // 기존 리뷰 조회
    const existingReview = await prisma.weeklyReview.findUnique({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart,
        },
      },
    });

    // 주간 통계 계산
    const stats = await calculateWeeklyStats(user.id, weekStart, weekEnd);

    return NextResponse.json({
      success: true,
      data: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        review: existingReview
          ? {
              ...existingReview,
              wins: existingReview.wins ? JSON.parse(existingReview.wins) : [],
              challenges: existingReview.challenges ? JSON.parse(existingReview.challenges) : [],
              nextWeekPlan: existingReview.nextWeekPlan
                ? JSON.parse(existingReview.nextWeekPlan)
                : [],
            }
          : null,
        stats,
      },
    });
  } catch (error) {
    console.error('Weekly reviews GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weekly review' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weekStart: weekStartStr, wins, challenges, insights, nextWeekPlan, mood } = body;

    const targetDate = weekStartStr ? new Date(weekStartStr) : new Date();
    const { weekStart, weekEnd } = getWeekBounds(targetDate);

    // 주간 통계 계산
    const stats = await calculateWeeklyStats(user.id, weekStart, weekEnd);

    // upsert로 생성 또는 업데이트
    const review = await prisma.weeklyReview.upsert({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart,
        },
      },
      update: {
        completedTasks: stats.completedTasks,
        totalTasks: stats.totalTasks,
        completionRate: stats.completionRate,
        focusMinutes: stats.focusMinutes,
        wins: wins ? JSON.stringify(wins) : null,
        challenges: challenges ? JSON.stringify(challenges) : null,
        insights: insights || null,
        nextWeekPlan: nextWeekPlan ? JSON.stringify(nextWeekPlan) : null,
        mood: mood || null,
      },
      create: {
        userId: user.id,
        weekStart,
        weekEnd,
        completedTasks: stats.completedTasks,
        totalTasks: stats.totalTasks,
        completionRate: stats.completionRate,
        focusMinutes: stats.focusMinutes,
        wins: wins ? JSON.stringify(wins) : null,
        challenges: challenges ? JSON.stringify(challenges) : null,
        insights: insights || null,
        nextWeekPlan: nextWeekPlan ? JSON.stringify(nextWeekPlan) : null,
        mood: mood || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...review,
        wins: review.wins ? JSON.parse(review.wins) : [],
        challenges: review.challenges ? JSON.parse(review.challenges) : [],
        nextWeekPlan: review.nextWeekPlan ? JSON.parse(review.nextWeekPlan) : [],
      },
    });
  } catch (error) {
    console.error('Weekly reviews POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save weekly review' },
      { status: 500 }
    );
  }
}
