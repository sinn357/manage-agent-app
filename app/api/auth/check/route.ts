import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    return NextResponse.json({
      success: true,
      isAuthenticated: authenticated,
      message: authenticated ? 'User is authenticated' : 'User not authenticated',
    });
  } catch (error) {
    console.error('Auth check error:', error);

    return NextResponse.json(
      {
        success: false,
        isAuthenticated: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
