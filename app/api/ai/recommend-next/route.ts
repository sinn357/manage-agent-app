// app/api/ai/recommend-next/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recommendNext, saveDecisionLog } from '@/lib/ai/decisionEngine';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 파싱
    const body = await request.json();
    const { taskIds } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length < 2) {
      return NextResponse.json(
        { error: '최소 2개 이상의 작업 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 추천 계산
    const result = await recommendNext(taskIds, userId);

    if (!result) {
      return NextResponse.json(
        { error: '추천할 작업을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 추천된 작업 상세 조회
    const recommendedTask = await prisma.task.findUnique({
      where: { id: result.recommendedId },
      include: {
        Goal: {
          include: {
            LifeGoal: true,
          },
        },
      },
    });

    // 대안 작업들 조회
    const alternativeIds = result.scores
      .filter((s) => s.taskId !== result.recommendedId)
      .map((s) => s.taskId);

    const alternatives = await prisma.task.findMany({
      where: { id: { in: alternativeIds } },
    });

    // 결정 로그 저장
    const decisionLogId = await saveDecisionLog(
      taskIds[0],
      taskIds[1],
      result,
      userId
    );

    // 응답
    return NextResponse.json({
      recommended: {
        taskId: result.recommendedId,
        task: recommendedTask,
      },
      reasons: result.reasons.map((r) => ({
        type: r.type,
        description: r.description,
      })),
      alternatives: alternatives.map((alt) => {
        const score = result.scores.find((s) => s.taskId === alt.id);
        return {
          taskId: alt.id,
          task: alt,
          score: score?.score || 0,
        };
      }),
      confidence: result.confidence,
      decisionLogId,
    });
  } catch (error) {
    console.error('AI recommend error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
