# 습관 시스템 & 반복 작업 설계 문서

> **작성일**: 2026-01-26
> **상태**: 설계 완료, 구현 대기
> **담당**: Claude Opus 4.5

---

## 1. 배경 및 문제점

### 1.1 현재 루틴 시스템의 문제

현재 "루틴" 시스템은 두 가지 다른 목적을 혼재하여 처리하고 있음:

| 문제 | 설명 |
|------|------|
| **이중 경로** | 루틴 체크 vs 작업 생성 → 어디서 뭘 해야 하는지 혼란 |
| **데이터 불일치** | `RoutineCheck`와 `Task` 완료가 별개로 관리 |
| **트래킹 부재** | `RoutineCheck`는 리포트/주간리뷰에 반영 안 됨 |
| **미사용 모델** | `RoutineResult` 스키마는 있지만 활용 안 됨 |

### 1.2 두 종류의 "반복"

분석 결과, "루틴"이라고 불리던 것에는 본질적으로 다른 두 가지가 혼재:

| | **생활 습관** | **목표 연동 반복 작업** |
|---|---|---|
| **예시** | 물 마시기, 운동, 명상 | 토플 영어공부, 포트폴리오 작업 |
| **목적** | 건강/웰빙 유지 | 목표 달성 |
| **트래킹** | ✓ 했다/안했다 | 시간, 진행률, 결과물 |
| **연동** | 독립적 | 목표 → 마일스톤 → 작업 |
| **핵심 지표** | 스트릭, 달성률 | 투자 시간, 목표 진행률 |
| **포커스 타이머** | 선택적 | 필수 |

---

## 2. 해결 방향

### 2.1 시스템 분리

- **생활 습관** → **습관 시스템 (Habit)**: 독립적 체크 + 스트릭 트래킹
- **목표 연동 반복** → **반복 작업 (Recurring Task)**: Task 시스템 확장

### 2.2 용어 정의

| 기존 | 신규 | 설명 |
|------|------|------|
| Routine | Habit | 일상적 습관 (물 마시기, 운동) |
| 루틴 → 작업 생성 | Recurring Task | 반복되는 작업 (매주 영어공부) |
| RoutineCheck | HabitCheck | 습관 완료 기록 |
| RoutineResult | (제거) | 미사용, 폐기 |

---

## 3. 습관 시스템 (Habit) 상세 설계

### 3.1 데이터 모델

```prisma
model Habit {
  id             String   @id @default(cuid())
  title          String
  description    String?
  icon           String?  // 이모지 또는 lucide 아이콘명
  color          String   @default("#3B82F6")

  // 반복 설정
  recurrenceType String   @default("daily") // "daily" | "weekly"
  recurrenceDays String?  // JSON: [1,2,3,4,5] (월~금), weekly일 때만 사용

  // 시간 설정 (포커스 타이머 연동용)
  defaultDuration Int?    // 기본 집중 시간 (분), null이면 체크만
  timeOfDay       String? // 권장 시간 "09:00"

  // 상태
  active         Boolean  @default(true)
  order          Int      @default(0)  // 정렬 순서

  // 관계
  userId         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  User           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  HabitCheck     HabitCheck[]
  FocusSession   FocusSession[]

  @@index([userId, active])
  @@index([userId, order])
}

model HabitCheck {
  id        String   @id @default(cuid())
  date      DateTime // YYYY-MM-DD 00:00:00 (날짜만, 시간은 00:00:00)
  completed Boolean  @default(true)
  note      String?  // 선택적 메모

  habitId   String
  userId    String
  createdAt DateTime @default(now())

  Habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  User      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([habitId, userId, date])
  @@index([userId, date])
  @@index([habitId, date])
}
```

### 3.2 FocusSession 수정

```prisma
model FocusSession {
  id          String    @id @default(cuid())
  duration    Int       // 설정 시간 (분)
  actualTime  Int       @default(0)  // 실제 시간 (분)
  startedAt   DateTime
  endedAt     DateTime?
  timeLeft    Int?      // 남은 시간 (초) - 복구용
  timerState  String?   // "running" | "paused" - 복구용
  completed   Boolean   @default(false)
  interrupted Boolean   @default(false)

  // 연동 (택1)
  taskId      String?   // 작업 연동
  habitId     String?   // 습관 연동 (신규)

  userId      String
  createdAt   DateTime  @default(now())
  lastUpdatedAt DateTime?

  Task        Task?     @relation(fields: [taskId], references: [id], onDelete: SetNull)
  Habit       Habit?    @relation(fields: [habitId], references: [id], onDelete: SetNull)
  User        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([habitId])
  @@index([userId, startedAt])
}
```

### 3.3 API 엔드포인트

#### 습관 CRUD

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/habits` | 습관 목록 + 오늘 체크 상태 |
| `POST` | `/api/habits` | 습관 생성 |
| `PATCH` | `/api/habits/[id]` | 습관 수정 |
| `DELETE` | `/api/habits/[id]` | 습관 삭제 |

#### 습관 체크

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/habits/[id]/check` | 오늘 체크 (완료 처리) |
| `DELETE` | `/api/habits/[id]/check` | 오늘 체크 취소 |
| `POST` | `/api/habits/[id]/check?date=2026-01-25` | 특정 날짜 체크 |

#### 습관 통계

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/habits/[id]/stats` | 개별 습관 통계 |
| `GET` | `/api/habits/stats` | 전체 습관 요약 통계 (리포트용) |

### 3.4 통계 인터페이스

```typescript
// 개별 습관 통계
interface HabitStats {
  habitId: string;
  habitTitle: string;

  // 스트릭
  currentStreak: number;      // 현재 연속 달성 일수
  longestStreak: number;      // 최장 연속 달성 일수

  // 달성률
  totalChecks: number;        // 총 체크 횟수
  totalExpected: number;      // 총 예상 횟수 (생성일 ~ 오늘)
  overallRate: number;        // 전체 달성률 (%)

  weeklyChecks: number;       // 이번 주 체크 횟수
  weeklyExpected: number;     // 이번 주 예상 횟수
  weeklyRate: number;         // 이번 주 달성률 (%)

  monthlyChecks: number;      // 이번 달 체크 횟수
  monthlyExpected: number;    // 이번 달 예상 횟수
  monthlyRate: number;        // 이번 달 달성률 (%)

  // 포커스 연동 (defaultDuration이 설정된 경우)
  totalFocusMinutes: number;  // 총 집중 시간
  avgFocusMinutes: number;    // 평균 집중 시간
  focusSessions: number;      // 포커스 세션 수
}

// 전체 습관 요약 (리포트용)
interface HabitsOverview {
  totalHabits: number;        // 활성 습관 수
  todayCompleted: number;     // 오늘 완료한 습관 수
  todayTotal: number;         // 오늘 해야 할 습관 수
  todayRate: number;          // 오늘 달성률 (%)

  weeklyRate: number;         // 이번 주 평균 달성률
  monthlyRate: number;        // 이번 달 평균 달성률

  topStreaks: {               // 상위 스트릭 습관들
    habitId: string;
    habitTitle: string;
    habitIcon: string;
    streak: number;
  }[];

  totalFocusMinutes: number;  // 습관 관련 총 집중 시간
}
```

### 3.5 UI 컴포넌트

#### 파일 구조

```
components/dashboard/
├── HabitsCompact.tsx           # 대시보드 콤팩트 뷰
├── HabitsDetailModal.tsx       # 상세 모달 (전체 목록 + 통계)
└── HabitItem.tsx               # 개별 습관 아이템 (체크 버튼 포함)

components/habits/
├── HabitForm.tsx               # 습관 생성/수정 폼
├── HabitStats.tsx              # 개별 습관 통계 뷰
└── HabitCalendar.tsx           # 월간 체크 캘린더 (GitHub 스타일)

app/settings/
└── HabitsTab.tsx               # 설정 > 습관 관리 탭
```

#### HabitsCompact 레이아웃

```
┌─────────────────────────────────────┐
│ 🎯 오늘의 습관           3/5   [→] │
├─────────────────────────────────────┤
│ 💧 물 8잔           ✓              │
│ 🏃 운동 30분        ○  [▶ 30분]   │  ← defaultDuration 있으면 표시
│ 📖 독서             ○  [▶ 20분]   │
│ 🧘 명상             ✓              │
│ 📝 일기             ○              │  ← defaultDuration 없으면 버튼 없음
│                                     │
│ 🔥 최고 스트릭: 운동 7일            │
└─────────────────────────────────────┘
```

#### HabitsDetailModal 레이아웃

```
┌─────────────────────────────────────────────────┐
│ 🎯 습관 관리                          [+ 추가] │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 오늘: 3/5 (60%)  이번 주: 78%  이번 달: 82% │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 📋 습관 목록                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ 💧 물 8잔                                   │ │
│ │    매일 | 🔥 12일 스트릭 | 이번 달 95%     │ │
│ │    [체크 캘린더 미니뷰]                     │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 🏃 운동 30분                                │ │
│ │    평일 | 🔥 5일 스트릭 | 이번 달 80%      │ │
│ │    총 집중: 8시간 30분                      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│                              [설정에서 관리 →] │
└─────────────────────────────────────────────────┘
```

---

## 4. 반복 작업 (Recurring Task) 상세 설계

### 4.1 데이터 모델 수정

```prisma
model Task {
  id              String    @id @default(cuid())
  title           String
  description     String?
  scheduledDate   DateTime?
  scheduledTime   String?   // "09:00" 형식
  priority        String    @default("mid")
  status          String    @default("todo")
  order           Int       @default(0)
  completedAt     DateTime?
  archivedAt      DateTime?
  deletedAt       DateTime?

  // 반복 설정 (신규)
  isRecurring       Boolean   @default(false)
  recurrenceRule    String?   // 반복 규칙 (아래 형식 참조)
  recurrenceEndDate DateTime? // 반복 종료일 (null이면 무한)
  parentTaskId      String?   // 원본 반복 작업 ID (시리즈 추적용)

  // 관계
  userId          String
  goalId          String?

  // 기존 루틴 연동 (deprecated, 마이그레이션 후 제거)
  isFromRoutine   Boolean   @default(false)
  routineId       String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  User            User      @relation(...)
  Goal            Goal?     @relation(...)
  FocusSession    FocusSession[]

  @@index([userId, status])
  @@index([userId, scheduledDate])
  @@index([parentTaskId])
}
```

### 4.2 반복 규칙 형식

```typescript
// recurrenceRule 형식
type RecurrenceRule = string;

// 예시:
// "daily"              → 매일
// "weekdays"           → 평일 (월~금)
// "weekends"           → 주말 (토~일)
// "weekly:1,3,5"       → 매주 월,수,금 (0=일, 1=월, ..., 6=토)
// "monthly:15"         → 매월 15일
// "monthly:last"       → 매월 마지막 날

// 파싱 함수
interface ParsedRecurrence {
  type: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly';
  days?: number[];      // weekly인 경우: [1, 3, 5]
  dayOfMonth?: number | 'last';  // monthly인 경우
}

function parseRecurrenceRule(rule: string): ParsedRecurrence {
  if (rule === 'daily') return { type: 'daily' };
  if (rule === 'weekdays') return { type: 'weekdays' };
  if (rule === 'weekends') return { type: 'weekends' };
  if (rule.startsWith('weekly:')) {
    const days = rule.split(':')[1].split(',').map(Number);
    return { type: 'weekly', days };
  }
  if (rule.startsWith('monthly:')) {
    const day = rule.split(':')[1];
    return { type: 'monthly', dayOfMonth: day === 'last' ? 'last' : Number(day) };
  }
  throw new Error(`Invalid recurrence rule: ${rule}`);
}
```

### 4.3 다음 날짜 계산

```typescript
function calculateNextDate(
  currentDate: Date,
  rule: string
): Date | null {
  const parsed = parseRecurrenceRule(rule);
  const next = new Date(currentDate);

  switch (parsed.type) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekdays':
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      break;

    case 'weekends':
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() !== 0 && next.getDay() !== 6);
      break;

    case 'weekly':
      // 다음 해당 요일 찾기
      const targetDays = parsed.days!.sort((a, b) => a - b);
      let found = false;
      for (let i = 1; i <= 7 && !found; i++) {
        next.setDate(next.getDate() + 1);
        if (targetDays.includes(next.getDay())) {
          found = true;
        }
      }
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (parsed.dayOfMonth === 'last') {
        next.setMonth(next.getMonth() + 1, 0); // 해당 월의 마지막 날
      } else {
        next.setDate(parsed.dayOfMonth as number);
      }
      break;
  }

  return next;
}
```

### 4.4 자동 생성 로직

```typescript
// 작업 완료 시 호출
async function handleTaskComplete(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!task || !task.isRecurring || !task.recurrenceRule) return;

  // 다음 날짜 계산
  const nextDate = calculateNextDate(
    task.scheduledDate || new Date(),
    task.recurrenceRule
  );

  // 종료일 체크
  if (task.recurrenceEndDate && nextDate > task.recurrenceEndDate) {
    return; // 반복 종료
  }

  // 이미 같은 날짜에 같은 시리즈 작업이 있는지 확인
  const existing = await prisma.task.findFirst({
    where: {
      parentTaskId: task.parentTaskId || task.id,
      scheduledDate: {
        gte: startOfDay(nextDate),
        lte: endOfDay(nextDate),
      },
    },
  });

  if (existing) return; // 이미 존재

  // 다음 작업 생성
  await prisma.task.create({
    data: {
      title: task.title,
      description: task.description,
      scheduledDate: nextDate,
      scheduledTime: task.scheduledTime,
      priority: task.priority,
      status: 'todo',
      isRecurring: true,
      recurrenceRule: task.recurrenceRule,
      recurrenceEndDate: task.recurrenceEndDate,
      parentTaskId: task.parentTaskId || task.id,
      userId: task.userId,
      goalId: task.goalId,
    },
  });
}
```

### 4.5 작업 생성 모달 UI

```
┌─────────────────────────────────────────────────┐
│ 새 작업 추가                                    │
├─────────────────────────────────────────────────┤
│ 제목                                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ 영어 공부                                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 설명 (선택)                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ 토플 준비 - 리딩 섹션                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 날짜              시간                          │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ 2026-01-27 📅│  │ 09:00     🕐│              │
│ └──────────────┘  └──────────────┘              │
│                                                 │
│ 목표 연결 (선택)                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🎯 토플 100점                            ▼ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 우선순위                                        │
│ ○ 높음    ● 보통    ○ 낮음                      │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ☑ 반복 작업으로 설정                        │ │
│ │                                             │ │
│ │ 반복 주기                                   │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ 매주                                  ▼ │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │                                             │ │
│ │ 반복 요일 (매주 선택 시)                    │ │
│ │ [일] [월] [화] [수] [목] [금] [토]          │ │
│ │       ✓         ✓         ✓                │ │
│ │                                             │ │
│ │ 종료일 (선택)                               │ │
│ │ ○ 없음 (계속 반복)                          │ │
│ │ ● 날짜 지정: [2026-06-30         📅]       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│                     [취소]        [저장]        │
└─────────────────────────────────────────────────┘
```

---

## 5. 통계/리포트 연동

### 5.1 리포트 페이지 수정

```typescript
// app/api/reports/route.ts 응답에 habits 추가

interface ReportData {
  // 기존 데이터
  period: { start: Date; end: Date };
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
    byPriority: { high: number; mid: number; low: number };
    byGoal: { goalId: string; goalTitle: string; completed: number; total: number }[];
  };
  focus: {
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    avgSessionMinutes: number;
  };
  goals: {
    total: number;
    avgProgress: number;
    completed: number;
  };

  // 신규: 습관 데이터
  habits: {
    total: number;              // 활성 습관 수
    periodChecks: number;       // 기간 내 체크 수
    periodExpected: number;     // 기간 내 예상 체크 수
    periodRate: number;         // 기간 달성률 (%)

    byHabit: {
      habitId: string;
      habitTitle: string;
      habitIcon: string;
      checks: number;
      expected: number;
      rate: number;
      streak: number;
    }[];

    focusMinutes: number;       // 습관 관련 집중 시간
  };
}
```

### 5.2 주간 리뷰 수정

```prisma
model WeeklyReview {
  id              String   @id @default(cuid())
  weekStart       DateTime
  weekEnd         DateTime

  // 작업 통계 (기존)
  completedTasks  Int      @default(0)
  totalTasks      Int      @default(0)
  completionRate  Float    @default(0)

  // 포커스 통계 (기존)
  focusMinutes    Int      @default(0)

  // 습관 통계 (신규)
  habitChecks     Int      @default(0)   // 주간 습관 체크 수
  habitExpected   Int      @default(0)   // 주간 예상 체크 수
  habitRate       Float    @default(0)   // 습관 달성률 (%)

  // 회고 (기존)
  wins            String?  // JSON array
  challenges      String?  // JSON array
  insights        String?
  nextWeekPlan    String?  // JSON array
  mood            Int?     // 1-5

  userId          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  User            User     @relation(...)

  @@unique([userId, weekStart])
  @@index([userId, weekStart])
}
```

### 5.3 주간 리뷰 UI 수정

```
┌─────────────────────────────────────────────────┐
│ 📊 주간 리뷰 - 2026년 1월 4주차                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📈 이번 주 성과                                 │
│ ┌───────────┬───────────┬───────────┬─────────┐ │
│ │ 작업      │ 습관      │ 집중      │ 목표    │ │
│ │ 12/15     │ 28/35     │ 8h 30m    │ 3개     │ │
│ │ 80%       │ 80%       │           │ 진행중  │ │
│ └───────────┴───────────┴───────────┴─────────┘ │
│                                                 │
│ 🎯 습관 하이라이트                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🏃 운동: 5/5 완벽! 🔥 12일 스트릭           │ │
│ │ 💧 물: 7/7 완벽!                            │ │
│ │ 📖 독서: 3/5 (60%)                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ... (기존 회고 섹션)                            │
└─────────────────────────────────────────────────┘
```

---

## 6. 마이그레이션 계획

### Phase 1: 습관 시스템 구축 (우선순위 높음)

**예상 시간**: 6-8시간

1. **Prisma 스키마 수정**
   - `Habit` 모델 생성
   - `HabitCheck` 모델 생성
   - `FocusSession`에 `habitId` 추가
   - `prisma generate` & `prisma db push`

2. **습관 API 구현**
   - `/api/habits` (GET, POST)
   - `/api/habits/[id]` (PATCH, DELETE)
   - `/api/habits/[id]/check` (POST, DELETE)
   - `/api/habits/[id]/stats` (GET)
   - `/api/habits/stats` (GET)

3. **UI 컴포넌트 구현**
   - `HabitsCompact.tsx`
   - `HabitsDetailModal.tsx`
   - `HabitItem.tsx`

4. **대시보드 통합**
   - `TodayRoutines` → `HabitsCompact`로 교체
   - 포커스 타이머에 습관 연동 추가

### Phase 2: 기존 루틴 마이그레이션

**예상 시간**: 2-3시간

1. **데이터 마이그레이션 스크립트**
   ```typescript
   // scripts/migrate-routines-to-habits.ts
   async function migrateRoutinesToHabits() {
     const routines = await prisma.routine.findMany();

     for (const routine of routines) {
       // Habit 생성
       const habit = await prisma.habit.create({
         data: {
           title: routine.title,
           description: routine.description,
           recurrenceType: routine.recurrenceType,
           recurrenceDays: routine.recurrenceDays,
           defaultDuration: routine.duration,
           timeOfDay: routine.timeOfDay,
           active: routine.active,
           userId: routine.userId,
         },
       });

       // RoutineCheck → HabitCheck 마이그레이션
       const checks = await prisma.routineCheck.findMany({
         where: { routineId: routine.id },
       });

       for (const check of checks) {
         await prisma.habitCheck.create({
           data: {
             date: check.date,
             completed: true,
             habitId: habit.id,
             userId: check.userId,
           },
         });
       }
     }
   }
   ```

2. **기존 코드 정리**
   - `TodayRoutines.tsx` 제거
   - `/api/routines` 폐기 또는 redirect
   - 설정 페이지 루틴 탭 → 습관 탭으로 변경

### Phase 3: 반복 작업 구현

**예상 시간**: 4-6시간

1. **Prisma 스키마 수정**
   - `Task`에 반복 필드 추가
   - 마이그레이션

2. **반복 로직 구현**
   - `lib/recurrence.ts` (규칙 파싱, 다음 날짜 계산)
   - 작업 완료 시 다음 작업 자동 생성

3. **UI 수정**
   - `TaskModal`에 반복 설정 UI 추가
   - 작업 목록에서 반복 작업 표시 (아이콘)

4. **기존 루틴 → 작업 생성 제거**
   - `/api/routines/generate-tasks` 폐기

### Phase 4: 통계 연동

**예상 시간**: 3-4시간

1. **리포트 API 수정**
   - 습관 통계 추가

2. **주간 리뷰 수정**
   - 스키마 업데이트
   - API 수정
   - UI 수정

3. **대시보드 통계 업데이트**
   - 습관 달성률 표시

---

## 7. 파일 구조 변화

### 신규 파일

```
// 컴포넌트
components/dashboard/
├── HabitsCompact.tsx
├── HabitsDetailModal.tsx
└── HabitItem.tsx

components/habits/
├── HabitForm.tsx
├── HabitStats.tsx
└── HabitCalendar.tsx

// API
app/api/habits/
├── route.ts
├── stats/route.ts
└── [id]/
    ├── route.ts
    ├── check/route.ts
    └── stats/route.ts

// 유틸리티
lib/
├── recurrence.ts           # 반복 규칙 처리
└── habitStats.ts           # 습관 통계 계산
```

### 제거/수정 파일

```
// 제거 (마이그레이션 완료 후)
components/dashboard/TodayRoutines.tsx
app/api/routines/generate-tasks/route.ts

// 수정
app/api/routines/route.ts              → 폐기 또는 /api/habits로 redirect
app/api/focus-sessions/route.ts        → habitId 지원 추가
app/api/reports/route.ts               → 습관 통계 추가
app/api/weekly-reviews/route.ts        → 습관 데이터 추가
app/dashboard/page.tsx                 → HabitsCompact 사용
app/settings/page.tsx                  → 습관 탭으로 변경
prisma/schema.prisma                   → Habit, HabitCheck 추가
```

---

## 8. 테스트 체크리스트

### Phase 1 테스트

- [ ] 습관 생성/수정/삭제
- [ ] 습관 체크/체크 취소
- [ ] 스트릭 계산 정확성
- [ ] 달성률 계산 정확성
- [ ] 포커스 타이머 습관 연동
- [ ] HabitsCompact UI
- [ ] HabitsDetailModal UI

### Phase 2 테스트

- [ ] 기존 루틴 → 습관 마이그레이션
- [ ] 기존 RoutineCheck → HabitCheck 마이그레이션
- [ ] 데이터 무결성 확인

### Phase 3 테스트

- [ ] 반복 작업 생성
- [ ] 반복 규칙 파싱
- [ ] 다음 날짜 계산 (daily, weekly, monthly)
- [ ] 작업 완료 시 자동 생성
- [ ] 종료일 동작

### Phase 4 테스트

- [ ] 리포트에 습관 통계 표시
- [ ] 주간 리뷰에 습관 데이터 표시
- [ ] 통계 수치 정확성

---

## 9. 향후 확장 가능성

### 습관 시스템

- **리마인더**: 특정 시간에 알림
- **보상 시스템**: 스트릭 달성 시 뱃지
- **소셜 공유**: 스트릭 공유
- **습관 그룹**: 카테고리별 분류

### 반복 작업

- **복잡한 반복 규칙**: 격주, 분기별
- **예외 날짜**: 특정 날짜 건너뛰기
- **시리즈 일괄 수정**: 모든 미래 작업 수정

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-01-26
**다음 단계**: Phase 1 구현 시작
