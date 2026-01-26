import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

function parseMonth(month: string | null): { year: number; month: number } | null {
  if (!month) return null;
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return { year, month: monthNumber };
}

// GET /api/habits/[id]/checks?month=YYYY-MM - 월간 체크 기록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const parsed = parseMonth(monthParam);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Invalid month format' },
        { status: 400 }
      );
    }

    const startDate = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
    const endDate = new Date(Date.UTC(parsed.year, parsed.month, 0));

    const checks = await prisma.habitCheck.findMany({
      where: {
        habitId: id,
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      checks: checks.map((check) => check.date.toISOString()),
    });
  } catch (error) {
    console.error('Get habit checks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch habit checks' },
      { status: 500 }
    );
  }
}
