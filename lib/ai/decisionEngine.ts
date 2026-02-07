// lib/ai/decisionEngine.ts

import { prisma } from '@/lib/prisma';

// ============ 타입 정의 ============

interface TaskForDecision {
  id: string;
  title: string;
  scheduledDate: Date | null;
  priority: string;
  weight: number;
  estimatedMinutes: number | null;
  goalId: string | null;
  Goal?: {
    id: string;
    title: string;
    lifeGoalId: string | null;
    LifeGoal?: {
      id: string;
      title: string;
    } | null;
  } | null;
}

interface DecisionReason {
  type: 'deadline' | 'longterm' | 'priority' | 'time_fitness';
  description: string;
  weight: number; // 0.0 ~ 1.0
}

interface DecisionResult {
  recommendedId: string;
  reasons: DecisionReason[];
  confidence: number;
  scores: {
    taskId: string;
    score: number;
    breakdown: {
      deadline: number;
      longterm: number;
      priority: number;
      timeFitness: number;
    };
  }[];
}

// ============ 상수 ============

const PRIORITY_WEIGHTS: Record<string, number> = {
  high: 1.5,
  mid: 1.0,
  low: 0.7,
};

const DEADLINE_SCORES: Record<string, number> = {
  overdue: 100, // 이미 지남
  today: 90, // D+0
  tomorrow: 80, // D+1
  soon: 50, // D+2 ~ D+3
  later: 20, // D+4 이상
  none: 10, // 마감 없음
};

// ============ 유틸리티 함수 ============

/**
 * D-day 계산
 */
function calculateDday(scheduledDate: Date | null): number | null {
  if (!scheduledDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(scheduledDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 마감 긴급도 점수 계산
 */
function getDeadlineScore(scheduledDate: Date | null): number {
  const dday = calculateDday(scheduledDate);

  if (dday === null) return DEADLINE_SCORES.none;
  if (dday < 0) return DEADLINE_SCORES.overdue;
  if (dday === 0) return DEADLINE_SCORES.today;
  if (dday === 1) return DEADLINE_SCORES.tomorrow;
  if (dday <= 3) return DEADLINE_SCORES.soon;
  return DEADLINE_SCORES.later;
}

/**
 * 마감 긴급도 설명 생성
 */
function getDeadlineDescription(scheduledDate: Date | null): string {
  const dday = calculateDday(scheduledDate);

  if (dday === null) return '마감 없음';
  if (dday < 0) return `마감 ${Math.abs(dday)}일 지남`;
  if (dday === 0) return '오늘 마감';
  if (dday === 1) return '내일 마감';
  return `D+${dday}`;
}

/**
 * 장기 목표 연결도 점수 계산
 */
function getLongtermScore(task: TaskForDecision): number {
  // LifeGoal 연결 + weight 높음: 100
  // Goal 연결: 60
  // 연결 없음: 20

  if (task.Goal?.LifeGoal) {
    // LifeGoal 연결됨 - weight 반영
    const weightBonus = Math.min(task.weight / 100, 1) * 40;
    return 60 + weightBonus;
  }

  if (task.Goal) {
    // Goal만 연결됨
    return 60;
  }

  // 연결 없음
  return 20;
}

/**
 * 장기 목표 연결 설명 생성
 */
function getLongtermDescription(task: TaskForDecision): string | null {
  if (task.Goal?.LifeGoal) {
    return `[${task.Goal.LifeGoal.title}] 달성을 위한 핵심 작업`;
  }

  if (task.Goal) {
    return `[${task.Goal.title}] 진행에 필요`;
  }

  return null;
}

/**
 * 우선순위 점수 계산
 */
function getPriorityScore(task: TaskForDecision): number {
  const priorityWeight = PRIORITY_WEIGHTS[task.priority] || 1.0;
  const taskWeight = task.weight || 1;

  // 정규화: 0-100 범위
  return priorityWeight * Math.min(taskWeight, 100);
}

/**
 * 시간대 적합성 점수 계산 (FocusSession 기반)
 */
async function getTimeFitnessScore(userId: string): Promise<number> {
  const now = new Date();
  const currentHour = now.getHours();

  // 현재 시간대 구간 결정
  let timeSlot: string;
  if (currentHour >= 6 && currentHour < 9) timeSlot = 'early_morning';
  else if (currentHour >= 9 && currentHour < 12) timeSlot = 'morning';
  else if (currentHour >= 12 && currentHour < 14) timeSlot = 'lunch';
  else if (currentHour >= 14 && currentHour < 18) timeSlot = 'afternoon';
  else if (currentHour >= 18 && currentHour < 21) timeSlot = 'evening';
  else timeSlot = 'night';

  // 최근 30일 해당 시간대 FocusSession 조회
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      startedAt: { gte: thirtyDaysAgo },
    },
    select: {
      startedAt: true,
      completed: true,
    },
  });

  // 현재 시간대 세션 필터링
  const relevantSessions = sessions.filter((s) => {
    const hour = new Date(s.startedAt).getHours();
    switch (timeSlot) {
      case 'early_morning':
        return hour >= 6 && hour < 9;
      case 'morning':
        return hour >= 9 && hour < 12;
      case 'lunch':
        return hour >= 12 && hour < 14;
      case 'afternoon':
        return hour >= 14 && hour < 18;
      case 'evening':
        return hour >= 18 && hour < 21;
      default:
        return hour >= 21 || hour < 6;
    }
  });

  if (relevantSessions.length === 0) {
    // 데이터 없으면 중립값
    return 50;
  }

  // 완료율 계산
  const completedCount = relevantSessions.filter((s) => s.completed).length;
  const completionRate = completedCount / relevantSessions.length;

  return Math.round(completionRate * 100);
}

/**
 * 시간대 적합성 설명 생성
 */
function getTimeFitnessDescription(score: number): string | null {
  if (score >= 70) {
    return '현재 시간대 집중도 높음 - 중요 작업 추천';
  }
  if (score <= 40) {
    return '현재 시간대 집중도 낮음 - 가벼운 작업 추천';
  }
  return null;
}

// ============ 메인 함수 ============

/**
 * 두 작업 비교 후 추천 결정
 */
export async function compareAndRecommend(
  taskA: TaskForDecision,
  taskB: TaskForDecision,
  userId: string
): Promise<DecisionResult> {
  // 1. 각 작업 점수 계산
  const timeFitnessScore = await getTimeFitnessScore(userId);

  const scoreA = {
    deadline: getDeadlineScore(taskA.scheduledDate),
    longterm: getLongtermScore(taskA),
    priority: getPriorityScore(taskA),
    timeFitness: timeFitnessScore,
  };

  const scoreB = {
    deadline: getDeadlineScore(taskB.scheduledDate),
    longterm: getLongtermScore(taskB),
    priority: getPriorityScore(taskB),
    timeFitness: timeFitnessScore,
  };

  // 2. 가중 합계 계산
  // 마감: 40%, 장기목표: 30%, 우선순위: 20%, 시간적합: 10%
  const weights = {
    deadline: 0.4,
    longterm: 0.3,
    priority: 0.2,
    timeFitness: 0.1,
  };

  const totalA =
    scoreA.deadline * weights.deadline +
    scoreA.longterm * weights.longterm +
    scoreA.priority * weights.priority +
    scoreA.timeFitness * weights.timeFitness;

  const totalB =
    scoreB.deadline * weights.deadline +
    scoreB.longterm * weights.longterm +
    scoreB.priority * weights.priority +
    scoreB.timeFitness * weights.timeFitness;

  // 3. 추천 결정
  const recommended = totalA >= totalB ? taskA : taskB;
  const other = totalA >= totalB ? taskB : taskA;
  const recommendedScores = totalA >= totalB ? scoreA : scoreB;

  // 4. 이유 생성
  const reasons: DecisionReason[] = [];

  // 마감 이유
  if (recommendedScores.deadline >= 80) {
    reasons.push({
      type: 'deadline',
      description: getDeadlineDescription(recommended.scheduledDate),
      weight: weights.deadline,
    });
  }

  // 장기 목표 이유
  const longtermDesc = getLongtermDescription(recommended);
  if (longtermDesc && recommendedScores.longterm >= 60) {
    reasons.push({
      type: 'longterm',
      description: longtermDesc,
      weight: weights.longterm,
    });
  }

  // 시간대 이유
  const timeFitnessDesc = getTimeFitnessDescription(timeFitnessScore);
  if (timeFitnessDesc) {
    reasons.push({
      type: 'time_fitness',
      description: timeFitnessDesc,
      weight: weights.timeFitness,
    });
  }

  // 이유가 없으면 기본 이유 추가
  if (reasons.length === 0) {
    reasons.push({
      type: 'priority',
      description: '우선순위 및 기여도 기준',
      weight: weights.priority,
    });
  }

  // 5. 신뢰도 계산 (점수 차이 기반)
  const scoreDiff = Math.abs(totalA - totalB);
  const maxPossibleDiff = 100; // 이론상 최대 차이
  const confidence = Math.min(0.5 + (scoreDiff / maxPossibleDiff) * 0.5, 1.0);

  return {
    recommendedId: recommended.id,
    reasons,
    confidence: Math.round(confidence * 100) / 100,
    scores: [
      { taskId: taskA.id, score: totalA, breakdown: scoreA },
      { taskId: taskB.id, score: totalB, breakdown: scoreB },
    ],
  };
}

/**
 * 작업 목록에서 다음 작업 추천
 */
export async function recommendNext(
  taskIds: string[],
  userId: string
): Promise<DecisionResult | null> {
  if (taskIds.length < 2) {
    return null;
  }

  // 작업 조회 (Goal, LifeGoal 포함)
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: taskIds },
      userId,
      status: { in: ['todo', 'in_progress'] },
      deletedAt: null,
    },
    include: {
      Goal: {
        include: {
          LifeGoal: true,
        },
      },
    },
  });

  if (tasks.length < 2) {
    return null;
  }

  // 모든 쌍 비교 후 최고 점수 작업 선택
  let bestResult: DecisionResult | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const result = await compareAndRecommend(
        tasks[i] as TaskForDecision,
        tasks[j] as TaskForDecision,
        userId
      );

      const winnerScore =
        result.scores.find((s) => s.taskId === result.recommendedId)?.score ||
        0;

      if (winnerScore > bestScore) {
        bestScore = winnerScore;
        bestResult = result;
      }
    }
  }

  return bestResult;
}

/**
 * 결정 로그 저장
 */
export async function saveDecisionLog(
  taskAId: string,
  taskBId: string,
  result: DecisionResult,
  userId: string
): Promise<string> {
  const log = await prisma.aIDecisionLog.create({
    data: {
      taskAId,
      taskBId,
      recommendedId: result.recommendedId,
      reasons: JSON.stringify(result.reasons),
      confidence: result.confidence,
      userId,
    },
  });

  return log.id;
}

/**
 * 사용자 피드백 저장
 */
export async function saveUserFeedback(
  decisionLogId: string,
  userChoice: string,
  feedback?: string
): Promise<void> {
  const log = await prisma.aIDecisionLog.findUnique({
    where: { id: decisionLogId },
  });

  if (!log) {
    throw new Error('Decision log not found');
  }

  await prisma.aIDecisionLog.update({
    where: { id: decisionLogId },
    data: {
      userChoice,
      userOverride: userChoice !== log.recommendedId,
      userFeedback: feedback,
    },
  });
}
