import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST: 루틴 기반 작업 자동 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, days = 7 } = body; // 기본 7일치 생성

    // 시작 날짜 설정 (기본값: 오늘)
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    // 활성화된 루틴 가져오기
    const routines = await prisma.routine.findMany({
      where: {
        userId: user.id,
        active: true,
      },
    });

    if (routines.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active routines found',
        tasksCreated: 0,
      });
    }

    const createdTasks = [];

    // 각 날짜별로 루틴 작업 생성
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dayOfWeek = currentDate.getDay(); // 0 (일) ~ 6 (토)

      for (const routine of routines) {
        let shouldCreate = false;

        if (routine.recurrenceType === 'daily') {
          shouldCreate = true;
        } else if (routine.recurrenceType === 'weekly') {
          // recurrenceDays가 JSON 배열 형태
          if (routine.recurrenceDays) {
            try {
              const days = JSON.parse(routine.recurrenceDays);
              shouldCreate = days.includes(dayOfWeek);
            } catch (e) {
              console.error('Failed to parse recurrenceDays:', e);
            }
          }
        } else if (routine.recurrenceType === 'monthly') {
          // 매월 같은 날짜
          shouldCreate = currentDate.getDate() === start.getDate();
        }

        if (shouldCreate) {
          // 이미 같은 날짜에 같은 제목의 작업이 있는지 확인
          const existingTask = await prisma.task.findFirst({
            where: {
              userId: user.id,
              title: routine.title,
              scheduledDate: {
                gte: new Date(currentDate.setHours(0, 0, 0, 0)),
                lte: new Date(currentDate.setHours(23, 59, 59, 999)),
              },
            },
          });

          if (!existingTask) {
            // 시간 설정
            let scheduledDateTime = new Date(currentDate);
            if (routine.timeOfDay) {
              const [hour, minute] = routine.timeOfDay.split(':');
              scheduledDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
            } else {
              scheduledDateTime.setHours(9, 0, 0, 0); // 기본값: 오전 9시
            }

            const task = await prisma.task.create({
              data: {
                title: routine.title,
                description: routine.description || `자동 생성된 루틴: ${routine.title}`,
                scheduledDate: scheduledDateTime,
                priority: routine.priority,
                status: 'todo',
                userId: user.id,
              },
            });

            createdTasks.push(task);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Generate tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}
