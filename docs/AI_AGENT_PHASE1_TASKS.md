# AI Agent Phase 1 - Codex 작업 명세서

> **목적**: Codex(X)가 독립적으로 구현할 수 있는 상세 태스크 목록
> **참조**: `docs/AI_AGENT_DESIGN.md` (설계 문서)
> **예상 작업량**: 5개 태스크

---

## 개요

### Phase 1 목표
"작업 A vs B 중 뭘 먼저?" 실시간 우선순위 제안 기능 구현

### 기술 스택 (기존)
- Next.js 16 (App Router)
- TypeScript
- Prisma + PostgreSQL (Neon)
- OpenAI API (gpt-4o-mini)

---

## Task 1: 스키마 확장

### 목표
AI 판단에 필요한 데이터 필드 추가

### 파일 위치
`prisma/schema.prisma`

### 작업 내용

#### 1.1 Task 모델에 필드 추가

```prisma
model Task {
  // 기존 필드 유지...

  // === 아래 필드 추가 ===
  estimatedMinutes  Int?      // 예상 소요 시간 (분)
}
```

**위치**: 기존 `weight` 필드 아래에 추가

#### 1.2 새 모델 추가: AIDecisionLog

```prisma
model AIDecisionLog {
  id              String   @id @default(cuid())

  // 비교 대상
  taskAId         String
  taskBId         String

  // AI 결정
  recommendedId   String   // 추천된 작업 ID
  reasons         String   // JSON: ["이유1", "이유2", ...]
  confidence      Float    // 0.0 ~ 1.0

  // 사용자 반응
  userChoice      String?  // 사용자 실제 선택 ID
  userOverride    Boolean  @default(false)
  userFeedback    String?  // 선택적 피드백

  // 관계
  userId          String
  User            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
}
```

**위치**: `WeeklyReview` 모델 아래에 추가

#### 1.3 User 모델에 관계 추가

```prisma
model User {
  // 기존 필드들...

  // === 아래 추가 ===
  AIDecisionLog  AIDecisionLog[]
}
```

### 완료 후 명령어

```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/manage-agent-app
npx prisma db push
npx prisma generate
```

### 검증 방법

```bash
npx prisma studio
# AIDecisionLog 테이블 존재 확인
# Task 테이블에 estimatedMinutes 컬럼 확인
```

### 완료 기준
- [ ] Task.estimatedMinutes 필드 추가됨
- [ ] AIDecisionLog 모델 생성됨
- [ ] User-AIDecisionLog 관계 설정됨
- [ ] `prisma db push` 성공
- [ ] `prisma generate` 성공

---

## Task 2: 판단 로직 구현

### 목표
DECIDE-0 규칙 기반 우선순위 판단 함수 구현

### 파일 생성
`lib/ai/decisionEngine.ts`

### 전체 코드

```typescript
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
  overdue: 100,    // 이미 지남
  today: 90,       // D+0
  tomorrow: 80,    // D+1
  soon: 50,        // D+2 ~ D+3
  later: 20,       // D+4 이상
  none: 10,        // 마감 없음
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
  const relevantSessions = sessions.filter(s => {
    const hour = new Date(s.startedAt).getHours();
    switch (timeSlot) {
      case 'early_morning': return hour >= 6 && hour < 9;
      case 'morning': return hour >= 9 && hour < 12;
      case 'lunch': return hour >= 12 && hour < 14;
      case 'afternoon': return hour >= 14 && hour < 18;
      case 'evening': return hour >= 18 && hour < 21;
      default: return hour >= 21 || hour < 6;
    }
  });

  if (relevantSessions.length === 0) {
    // 데이터 없으면 중립값
    return 50;
  }

  // 완료율 계산
  const completedCount = relevantSessions.filter(s => s.completed).length;
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

      const winnerScore = result.scores.find(s => s.taskId === result.recommendedId)?.score || 0;

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
```

### 완료 기준
- [ ] `lib/ai/decisionEngine.ts` 파일 생성됨
- [ ] 타입 에러 없음 (`npx tsc --noEmit`)
- [ ] 모든 함수 export 확인

---

## Task 3: API 엔드포인트 구현

### 목표
AI 추천 API 및 피드백 API 구현

### 파일 생성

#### 3.1 추천 API

**파일**: `app/api/ai/recommend-next/route.ts`

```typescript
// app/api/ai/recommend-next/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recommendNext, saveDecisionLog } from '@/lib/ai/decisionEngine';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await verifyAuth(request);
    if (!auth) {
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
    const result = await recommendNext(taskIds, auth.userId);

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
      .filter(s => s.taskId !== result.recommendedId)
      .map(s => s.taskId);

    const alternatives = await prisma.task.findMany({
      where: { id: { in: alternativeIds } },
    });

    // 결정 로그 저장
    const decisionLogId = await saveDecisionLog(
      taskIds[0],
      taskIds[1],
      result,
      auth.userId
    );

    // 응답
    return NextResponse.json({
      recommended: {
        taskId: result.recommendedId,
        task: recommendedTask,
      },
      reasons: result.reasons.map(r => ({
        type: r.type,
        description: r.description,
      })),
      alternatives: alternatives.map(alt => {
        const score = result.scores.find(s => s.taskId === alt.id);
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
```

#### 3.2 피드백 API

**파일**: `app/api/ai/decision-feedback/route.ts`

```typescript
// app/api/ai/decision-feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { saveUserFeedback } from '@/lib/ai/decisionEngine';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const auth = await verifyAuth(request);
    if (!auth) {
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
```

### 완료 기준
- [ ] `app/api/ai/recommend-next/route.ts` 생성됨
- [ ] `app/api/ai/decision-feedback/route.ts` 생성됨
- [ ] 타입 에러 없음
- [ ] API 테스트 통과 (Postman 또는 curl)

### 테스트 방법

```bash
# 1. 로그인 후 쿠키 획득
# 2. 추천 API 테스트
curl -X POST http://localhost:3000/api/ai/recommend-next \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{"taskIds": ["TASK_ID_1", "TASK_ID_2"]}'

# 3. 피드백 API 테스트
curl -X POST http://localhost:3000/api/ai/decision-feedback \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{"decisionLogId": "LOG_ID", "userChoice": "TASK_ID_1"}'
```

---

## Task 4: UI 컴포넌트 구현

### 목표
대시보드에 AI 추천 위젯 추가

### 파일 생성

#### 4.1 추천 위젯 컴포넌트

**파일**: `components/ai/AIRecommendWidget.tsx`

```typescript
// components/ai/AIRecommendWidget.tsx

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  scheduledDate: string | null;
  priority: string;
  Goal?: {
    title: string;
    LifeGoal?: {
      title: string;
    } | null;
  } | null;
}

interface Reason {
  type: 'deadline' | 'longterm' | 'priority' | 'time_fitness';
  description: string;
}

interface RecommendResponse {
  recommended: {
    taskId: string;
    task: Task;
  };
  reasons: Reason[];
  alternatives: Array<{
    taskId: string;
    task: Task;
  }>;
  confidence: number;
  decisionLogId: string;
}

interface AIRecommendWidgetProps {
  taskIds: string[];
  onTaskSelect?: (taskId: string) => void;
}

export function AIRecommendWidget({ taskIds, onTaskSelect }: AIRecommendWidgetProps) {
  const queryClient = useQueryClient();
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string>('');

  // 추천 조회
  const { data, isLoading, error, refetch } = useQuery<RecommendResponse>({
    queryKey: ['ai-recommend', taskIds],
    queryFn: async () => {
      const res = await fetch('/api/ai/recommend-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
      if (!res.ok) throw new Error('추천 실패');
      return res.json();
    },
    enabled: taskIds.length >= 2,
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 피드백 저장
  const feedbackMutation = useMutation({
    mutationFn: async ({
      decisionLogId,
      userChoice,
      feedback
    }: {
      decisionLogId: string;
      userChoice: string;
      feedback?: string;
    }) => {
      const res = await fetch('/api/ai/decision-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionLogId, userChoice, feedback }),
      });
      if (!res.ok) throw new Error('피드백 저장 실패');
      return res.json();
    },
    onSuccess: () => {
      setShowFeedback(false);
      queryClient.invalidateQueries({ queryKey: ['ai-recommend'] });
    },
  });

  // 작업 선택 핸들러
  const handleSelectTask = (taskId: string, isRecommended: boolean) => {
    if (data?.decisionLogId) {
      if (!isRecommended) {
        // AI 추천과 다른 선택 → 피드백 요청
        setShowFeedback(true);
      } else {
        // AI 추천 수락
        feedbackMutation.mutate({
          decisionLogId: data.decisionLogId,
          userChoice: taskId,
        });
      }
    }
    onTaskSelect?.(taskId);
  };

  // 피드백 제출
  const handleFeedbackSubmit = (chosenTaskId: string) => {
    if (data?.decisionLogId) {
      feedbackMutation.mutate({
        decisionLogId: data.decisionLogId,
        userChoice: chosenTaskId,
        feedback: selectedFeedback || undefined,
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  // 에러 상태
  if (error || !data) {
    return null; // 조용히 숨김
  }

  // 피드백 모달
  if (showFeedback) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          다른 작업을 선택하셨네요. 이유가 있으신가요?
        </p>
        <div className="space-y-2 mb-3">
          {[
            { value: 'urgent', label: '급한 요청이 왔어요' },
            { value: 'condition', label: '지금 컨디션에 맞아요' },
            { value: 'mood', label: '기분이 그래요' },
            { value: 'other', label: '기타' },
          ].map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="feedback"
                value={option.value}
                checked={selectedFeedback === option.value}
                onChange={(e) => setSelectedFeedback(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFeedback(false)}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            건너뛰기
          </button>
          <button
            onClick={() => {
              const chosenId = data.alternatives[0]?.taskId;
              if (chosenId) handleFeedbackSubmit(chosenId);
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  // 추천 표시
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          다음 작업 추천
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
          신뢰도 {Math.round(data.confidence * 100)}%
        </span>
      </div>

      {/* 추천 작업 */}
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
          {data.recommended.task.title}
        </h3>

        {/* 이유 */}
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
          {data.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{reason.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => handleSelectTask(data.recommended.taskId, true)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          시작하기
        </button>
        <button
          onClick={() => handleSelectTask(data.alternatives[0]?.taskId || '', false)}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          다른 작업
        </button>
      </div>
    </div>
  );
}
```

#### 4.2 대시보드에 위젯 추가

**파일**: `app/dashboard/page.tsx`

**수정 위치**: 기존 대시보드 컴포넌트 내부

**추가할 import**:
```typescript
import { AIRecommendWidget } from '@/components/ai/AIRecommendWidget';
```

**추가할 위치**: 오늘 할 일 섹션 상단에 추가

```tsx
{/* AI 추천 위젯 - 오늘 할 일이 2개 이상일 때만 표시 */}
{todayTasks && todayTasks.length >= 2 && (
  <AIRecommendWidget
    taskIds={todayTasks.map(t => t.id)}
    onTaskSelect={(taskId) => {
      // 선택된 작업으로 스크롤 또는 포커스 타이머 연결
      console.log('Selected task:', taskId);
    }}
  />
)}
```

### 완료 기준
- [ ] `components/ai/AIRecommendWidget.tsx` 생성됨
- [ ] 대시보드에 위젯 import 및 렌더링 추가됨
- [ ] 위젯이 조건부로 표시됨 (작업 2개 이상)
- [ ] 시작하기/다른 작업 버튼 동작함
- [ ] 피드백 모달 동작함

---

## Task 5: 통합 테스트 및 마무리

### 목표
전체 흐름 테스트 및 버그 수정

### 체크리스트

#### 5.1 빌드 테스트
```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/manage-agent-app
npm run build
```
- [ ] 빌드 성공
- [ ] 타입 에러 없음

#### 5.2 기능 테스트

| 테스트 항목 | 예상 결과 | 통과 |
|------------|----------|------|
| 작업 2개 이상일 때 위젯 표시 | 위젯 보임 | [ ] |
| 작업 1개일 때 위젯 숨김 | 위젯 안 보임 | [ ] |
| 추천 이유 표시 | 1~3개 이유 표시 | [ ] |
| 시작하기 클릭 | 피드백 저장됨 | [ ] |
| 다른 작업 클릭 | 피드백 모달 표시 | [ ] |
| 피드백 저장 | DB에 기록됨 | [ ] |

#### 5.3 DB 확인
```bash
npx prisma studio
```
- [ ] AIDecisionLog 테이블에 기록 저장 확인
- [ ] userOverride 필드 정상 기록 확인

### 버그 수정 가이드

**흔한 문제 1**: `prisma.aIDecisionLog` 접근 오류
- 해결: `npx prisma generate` 재실행

**흔한 문제 2**: 타입 에러 `Goal` 관계
- 해결: Task 쿼리에 `include: { Goal: { include: { LifeGoal: true } } }` 확인

**흔한 문제 3**: 인증 오류
- 해결: `verifyAuth` 함수가 `userId` 반환하는지 확인

---

## 파일 구조 요약

```
manage-agent-app/
├── prisma/
│   └── schema.prisma          # Task 1: 스키마 확장
│
├── lib/
│   └── ai/
│       └── decisionEngine.ts  # Task 2: 판단 로직
│
├── app/
│   └── api/
│       └── ai/
│           ├── recommend-next/
│           │   └── route.ts   # Task 3.1: 추천 API
│           └── decision-feedback/
│               └── route.ts   # Task 3.2: 피드백 API
│
├── components/
│   └── ai/
│       └── AIRecommendWidget.tsx  # Task 4: UI 컴포넌트
│
└── app/
    └── dashboard/
        └── page.tsx           # Task 4: 위젯 통합
```

---

## 실행 순서

```
1. Task 1: 스키마 확장
   ↓
2. Task 2: 판단 로직 구현
   ↓
3. Task 3: API 구현
   ↓
4. Task 4: UI 구현
   ↓
5. Task 5: 통합 테스트
```

**주의**: 각 Task는 이전 Task가 완료되어야 진행 가능

---

## 완료 보고 형식

각 Task 완료 시:

```markdown
✅ Task N 완료

**작업 내용**:
- [수행한 작업 1]
- [수행한 작업 2]

**생성/수정된 파일**:
- path/to/file1.ts
- path/to/file2.ts

**테스트 결과**:
- [테스트 항목]: 통과/실패

**이슈**:
- (있으면 기록)
```

---

**문서 작성**: Claude (Arch)
**실행**: Codex (X)
**최종 검토**: 사용자
