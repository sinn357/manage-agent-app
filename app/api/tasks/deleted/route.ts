import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 소프트 삭제된 작업만 조회
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        deletedAt: { not: null }, // 삭제된 것만
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
      orderBy: {
        deletedAt: 'desc', // 최근 삭제 순
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Get deleted tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
