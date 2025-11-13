import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const SALT_ROUNDS = 12;

/**
 * 비밀번호를 해시화합니다
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 입력된 비밀번호와 해시된 비밀번호를 비교합니다
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * JWT 시크릿키를 가져옵니다
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * 사용자 JWT 토큰을 생성합니다
 */
export function generateUserToken(userId: string): string {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: '7d', // 7일 유효
  });
}

/**
 * JWT payload 타입 정의
 */
interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * JWT 토큰을 검증하고 payload를 반환합니다
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * 현재 요청에서 사용자 ID를 가져옵니다
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) return null;

    const decoded = verifyToken(token.value);
    return decoded?.userId || null;
  } catch (error) {
    console.error('Get current user ID failed:', error);
    return null;
  }
}

/**
 * 현재 인증된 사용자 정보를 가져옵니다
 */
export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Get current user failed:', error);
    return null;
  }
}

/**
 * 사용자가 인증되어 있는지 확인합니다
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * 인증 토큰을 쿠키에 설정합니다
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true, // XSS 공격 방지
    secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
    sameSite: 'strict', // CSRF 공격 방지
    maxAge: 7 * 24 * 60 * 60, // 7일 (초 단위)
    path: '/',
  });
}

/**
 * 인증 토큰 쿠키를 삭제합니다
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
