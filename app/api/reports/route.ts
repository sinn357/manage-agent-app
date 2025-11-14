import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'week'; // 'week' or 'month'

    const now = new Date();
    let startDate: Date;

    if (type === 'week') {
      // 이번 주 시작 (월요일)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 이번 달 시작
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // 작업 통계
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        Goal: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
    });

    const completedTasks = tasks.filter((task) => task.status === 'completed');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // 목표별 달성률
    const goalStats = await prisma.goal.findMany({
      where: {
        userId: user.id,
        status: 'active',
      },
      include: {
        Task: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const goalProgress = goalStats.map((goal) => {
      const total = goal.Task.length;
      const completed = goal.Task.filter((task) => task.status === 'completed').length;
      return {
        id: goal.id,
        title: goal.title,
        color: goal.color,
        total,
        completed,
        rate: total > 0 ? (completed / total) * 100 : 0,
      };
    });

    // 집중 세션 통계
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    // 일별 집중 시간 계산
    const dailyFocus: { [key: string]: number } = {};
    const days = type === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyFocus[dateKey] = 0;
    }

    focusSessions.forEach((session) => {
      const dateKey = session.startedAt.toISOString().split('T')[0];
      if (dailyFocus[dateKey] !== undefined) {
        dailyFocus[dateKey] += session.actualTime;
      }
    });

    const dailyFocusArray = Object.entries(dailyFocus).map(([date, minutes]) => ({
      date,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
    }));

    const totalFocusTime = focusSessions.reduce((sum, session) => sum + session.actualTime, 0);
    const completedSessions = focusSessions.filter((s) => s.completed).length;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          type,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks.length,
          inProgress: tasks.filter((t) => t.status === 'in-progress').length,
          todo: tasks.filter((t) => t.status === 'todo').length,
          completionRate: Math.round(completionRate * 10) / 10,
        },
        goals: goalProgress,
        focus: {
          totalMinutes: totalFocusTime,
          totalHours: Math.round((totalFocusTime / 60) * 10) / 10,
          sessionsCount: focusSessions.length,
          completedSessions,
          dailyFocus: dailyFocusArray,
        },
      },
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
