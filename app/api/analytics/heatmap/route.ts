import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '4'); // 기본 4주

    // N주 전부터 현재까지
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // 포커스 세션 가져오기
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
        completed: true, // 완료된 세션만
      },
      select: {
        startedAt: true,
        actualTime: true,
      },
    });

    // 히트맵 데이터 초기화: 요일(0-6) x 시간(0-23)
    const heatmapData: { [key: string]: number } = {};
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapData[`${day}-${hour}`] = 0;
      }
    }

    // 세션별로 집중 시간 집계
    focusSessions.forEach((session) => {
      const date = new Date(session.startedAt);
      const day = date.getDay(); // 0 (일요일) ~ 6 (토요일)
      const hour = date.getHours(); // 0 ~ 23
      const key = `${day}-${hour}`;
      heatmapData[key] += session.actualTime; // 분 단위
    });

    // 히트맵 배열로 변환
    const heatmap = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        heatmap.push({
          day, // 0 (일) ~ 6 (토)
          hour, // 0 ~ 23
          minutes: heatmapData[key],
          hours: Math.round((heatmapData[key] / 60) * 10) / 10,
        });
      }
    }

    // 요일별 총 집중 시간
    const dailyTotals = Array(7).fill(0);
    focusSessions.forEach((session) => {
      const day = new Date(session.startedAt).getDay();
      dailyTotals[day] += session.actualTime;
    });

    // 시간대별 총 집중 시간
    const hourlyTotals = Array(24).fill(0);
    focusSessions.forEach((session) => {
      const hour = new Date(session.startedAt).getHours();
      hourlyTotals[hour] += session.actualTime;
    });

    // 최고 생산성 시간대 찾기
    const maxHourIndex = hourlyTotals.indexOf(Math.max(...hourlyTotals));
    const maxDayIndex = dailyTotals.indexOf(Math.max(...dailyTotals));

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    return NextResponse.json({
      success: true,
      data: {
        heatmap,
        dailyTotals: dailyTotals.map((minutes, day) => ({
          day,
          dayName: dayNames[day],
          minutes,
          hours: Math.round((minutes / 60) * 10) / 10,
        })),
        hourlyTotals: hourlyTotals.map((minutes, hour) => ({
          hour,
          minutes,
          hours: Math.round((minutes / 60) * 10) / 10,
        })),
        insights: {
          bestHour: maxHourIndex,
          bestHourText: `${maxHourIndex}시`,
          bestDay: maxDayIndex,
          bestDayText: dayNames[maxDayIndex],
          totalSessions: focusSessions.length,
        },
      },
    });
  } catch (error) {
    console.error('Heatmap API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch heatmap data' },
      { status: 500 }
    );
  }
}
