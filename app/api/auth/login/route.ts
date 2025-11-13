import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateUserToken, setAuthCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body; // identifier can be email or username

    // 입력 유효성 검사
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    // 이메일 또는 사용자명으로 사용자 찾기
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      // 브루트포스 공격 방지를 위한 의도적 지연
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      // 브루트포스 공격 방지를 위한 의도적 지연
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성 및 쿠키 설정
    const token = generateUserToken(user.id);
    await setAuthCookie(token);

    // 사용자 정보 반환 (비밀번호 제외)
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        name: userWithoutPassword.name,
        createdAt: userWithoutPassword.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
