import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateLifeStats } from '@/lib/lifeCalculations';

/**
 * GET /api/user/profile
 * 현재 사용자 프로필 + LifeStats 조회
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        birthDate: true,
        targetLifespan: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // LifeStats 계산 (birthDate와 targetLifespan이 있는 경우에만)
    let lifeStats = null;
    if (user.birthDate && user.targetLifespan) {
      const stats = calculateLifeStats(user.birthDate, user.targetLifespan);
      // Date 객체를 ISO 문자열로 변환하여 JSON 직렬화 문제 방지
      lifeStats = {
        ...stats,
        birthDate: stats.birthDate instanceof Date ? stats.birthDate.toISOString() : stats.birthDate,
        targetDeathDate: stats.targetDeathDate instanceof Date ? stats.targetDeathDate.toISOString() : stats.targetDeathDate,
      };
    }

    return NextResponse.json({
      success: true,
      user,
      lifeStats,
    });
  } catch (error) {
    console.error('Get user profile error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * 사용자 프로필 업데이트 (birthDate, targetLifespan, name)
 */
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { birthDate, targetLifespan, name } = body;

    // 입력 검증
    const updates: {
      birthDate?: Date;
      targetLifespan?: number;
      name?: string;
    } = {};

    if (birthDate !== undefined) {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid birth date' },
          { status: 400 }
        );
      }
      // 미래 날짜 체크
      if (date > new Date()) {
        return NextResponse.json(
          { success: false, error: 'Birth date cannot be in the future' },
          { status: 400 }
        );
      }
      updates.birthDate = date;
    }

    if (targetLifespan !== undefined) {
      const lifespan = parseInt(targetLifespan);
      if (isNaN(lifespan) || lifespan < 1 || lifespan > 150) {
        return NextResponse.json(
          { success: false, error: 'Target lifespan must be between 1 and 150' },
          { status: 400 }
        );
      }
      updates.targetLifespan = lifespan;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Invalid name' },
          { status: 400 }
        );
      }
      const trimmedName = name.trim();
      if (trimmedName) {
        updates.name = trimmedName;
      }
    }

    // 업데이트할 필드가 없으면 에러
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updates,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        birthDate: true,
        targetLifespan: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // LifeStats 계산
    let lifeStats = null;
    if (updatedUser.birthDate && updatedUser.targetLifespan) {
      const stats = calculateLifeStats(updatedUser.birthDate, updatedUser.targetLifespan);
      // Date 객체를 ISO 문자열로 변환하여 JSON 직렬화 문제 방지
      lifeStats = {
        ...stats,
        birthDate: stats.birthDate instanceof Date ? stats.birthDate.toISOString() : stats.birthDate,
        targetDeathDate: stats.targetDeathDate instanceof Date ? stats.targetDeathDate.toISOString() : stats.targetDeathDate,
      };
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      lifeStats,
    });
  } catch (error) {
    console.error('Update user profile error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
