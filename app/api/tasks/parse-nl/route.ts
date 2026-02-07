import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { parseNaturalLanguage } from '@/lib/nlParser';
import { NLParseResult } from '@/types/nlTask';

export async function POST(request: Request): Promise<NextResponse<NLParseResult>> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI 기능 설정이 필요합니다 (OPENAI_API_KEY)', code: 'CONFIG_ERROR' },
        { status: 503 }
      );
    }

    // 인증 확인
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다', code: 'INVALID_INPUT' },
        { status: 401 }
      );
    }

    let body: { input?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const { input } = body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      return NextResponse.json(
        { success: false, error: '입력이 비어있습니다', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const parsed = await parseNaturalLanguage(input);

    return NextResponse.json({
      success: true,
      parsed,
      rawInput: input,
    });
  } catch (error) {
    console.error('NL Parse error:', error);

    // OpenAI API 에러 처리
    if (error instanceof Error) {
      const status = (error as { status?: number }).status;
      if (status === 401) {
        return NextResponse.json(
          { success: false, error: 'AI 인증 설정을 확인해주세요', code: 'CONFIG_ERROR' },
          { status: 503 }
        );
      }

      if (error.message.includes('rate_limit') || error.message.includes('Rate limit')) {
        return NextResponse.json(
          { success: false, error: '잠시 후 다시 시도해주세요', code: 'RATE_LIMIT' },
          { status: 429 }
        );
      }

      if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { success: false, error: 'AI 기능을 일시적으로 사용할 수 없습니다', code: 'QUOTA_EXCEEDED' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '파싱에 실패했습니다', code: 'PARSE_ERROR' },
      { status: 500 }
    );
  }
}
