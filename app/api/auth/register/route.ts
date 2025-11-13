import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateUserToken, setAuthCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, name } = body;

    // 입력 유효성 검사
    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 사용자명 검증 (3-20자, 영문/숫자/언더스코어만)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username must be 3-20 characters (letters, numbers, underscore only)',
        },
        { status: 400 }
      );
    }

    // 비밀번호 강도 검증 (최소 8자)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // 사용자명 중복 확인
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      );
    }

    // 비밀번호 해시화
    const passwordHash = await hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    // JWT 토큰 생성 및 쿠키 설정
    const token = generateUserToken(user.id);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

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
