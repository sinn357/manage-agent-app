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
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // task, goal, routine, all

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        results: {
          tasks: [],
          goals: [],
          routines: [],
        },
      });
    }

    const searchQuery = query.trim();

    // 검색할 타입 결정
    const shouldSearchTasks = !type || type === 'all' || type === 'task';
    const shouldSearchGoals = !type || type === 'all' || type === 'goal';
    const shouldSearchRoutines = !type || type === 'all' || type === 'routine';

    // 병렬 검색 실행
    const [tasks, goals, routines] = await Promise.all([
      shouldSearchTasks
        ? prisma.task.findMany({
            where: {
              userId: user.id,
              deletedAt: null, // 삭제되지 않은 작업만
              OR: [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
              ],
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
            orderBy: [
              { status: 'asc' }, // todo, in_progress가 먼저
              { createdAt: 'desc' },
            ],
            take: 20, // 최대 20개
          })
        : [],
      shouldSearchGoals
        ? prisma.goal.findMany({
            where: {
              userId: user.id,
              OR: [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
            include: {
              _count: {
                select: {
                  Task: true,
                },
              },
            },
            orderBy: [
              { status: 'asc' }, // active가 먼저
              { createdAt: 'desc' },
            ],
            take: 20,
          })
        : [],
      shouldSearchRoutines
        ? prisma.routine.findMany({
            where: {
              userId: user.id,
              OR: [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
            orderBy: [
              { active: 'desc' }, // active가 먼저
              { createdAt: 'desc' },
            ],
            take: 20,
          })
        : [],
    ]);

    return NextResponse.json({
      success: true,
      results: {
        tasks,
        goals,
        routines,
      },
      query: searchQuery,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search' },
      { status: 500 }
    );
  }
}
