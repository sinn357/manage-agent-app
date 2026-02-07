// app/api/ai/decision-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { saveUserFeedback } from '@/lib/ai/decisionEngine';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 파싱
    const body = await request.json();
    const { decisionLogId, userChoice, feedback } = body;

    if (!decisionLogId || !userChoice) {
      return NextResponse.json(
        { error: 'decisionLogId와 userChoice가 필요합니다' },
        { status: 400 }
      );
    }

    // 피드백 저장
    await saveUserFeedback(decisionLogId, userChoice, feedback);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
