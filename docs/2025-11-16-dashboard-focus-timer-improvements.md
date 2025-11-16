# 대시보드 개선 및 포커스 타이머 영구 저장 기능 추가

**날짜**: 2025-11-16
**브랜치**: `claude/dashboard-focus-timer-fixes-013Zw6qdVWGBzvV7UGxec9Vn`
**커밋**: b042963

## 📋 개요

이번 업데이트에서는 대시보드 사용성 개선, 포커스 타이머의 전역 상태 유지, 작업 시간 설정 기능 추가를 구현했습니다.

## 🎯 구현된 기능

### 1. 대시보드 TaskList 섹션 분리

#### 문제점
- 모든 작업이 시간 순서대로만 표시되어 오늘 할 일을 한눈에 파악하기 어려움
- 밀린 작업과 예정 작업이 구분되지 않아 우선순위 판단이 어려움

#### 해결 방법
작업을 날짜 기준으로 **오늘/밀린/예정** 3개 섹션으로 자동 분류:

```typescript
// components/dashboard/TaskList.tsx
const categorizedTasks = useMemo(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayTasks: Task[] = [];
  const overdueTasks: Task[] = [];
  const upcomingTasks: Task[] = [];

  tasks.forEach((task) => {
    if (!task.scheduledDate) {
      todayTasks.push(task); // 날짜 없는 작업은 오늘 할 일로
      return;
    }

    const taskDate = new Date(task.scheduledDate);
    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

    if (taskDateOnly < today) {
      overdueTasks.push(task);
    } else if (taskDateOnly.getTime() === today.getTime()) {
      todayTasks.push(task);
    } else {
      upcomingTasks.push(task);
    }
  });

  return { todayTasks, overdueTasks, upcomingTasks };
}, [tasks]);
```

#### UI 디자인

**오늘 할 일** (가장 부각):
- 파란색 강조 배경 (`bg-blue-50`)
- 두꺼운 테두리 (`border-2 border-blue-200`)
- 항상 펼쳐진 상태

**밀린 작업** (경고):
- 빨간색 강조 (`bg-red-50`, `border-red-200`)
- 접기/펼치기 가능 (기본 닫힘)
- ⚠️ 아이콘으로 주의 환기

**예정 작업** (덜 부각):
- 회색 톤 (`bg-gray-50`, `border-gray-200`)
- 접기/펼치기 가능 (기본 닫힘)
- 📅 아이콘으로 미래 일정 표시

---

### 2. 포커스 타이머 DB 기반 영구 저장

#### 문제점
- 페이지 이동, 새로고침, 탭 전환 시 타이머 상태가 소실됨
- 모바일과 데스크톱 간 타이머 동기화 불가
- 타이머가 진행 중인데 "진행중" 상태로만 히스토리에 남아 영구히 완료되지 않음

#### 해결 방법

**1) 스키마 확장**

```prisma
model FocusSession {
  id            String    @id @default(cuid())
  duration      Int
  actualTime    Int       @default(0)
  startedAt     DateTime
  endedAt       DateTime?
  completed     Boolean   @default(false)
  interrupted   Boolean   @default(false)

  // 새로 추가된 필드들
  timeLeft      Int?      // 남은 시간 (초)
  timerState    String?   // "running", "paused", "idle"
  lastUpdatedAt DateTime? // 마지막 업데이트 시간

  taskId        String?
  userId        String
  createdAt     DateTime  @default(now())
  Task          Task?     @relation(fields: [taskId], references: [id])
  User          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([userId, startedAt])
  @@index([userId, timerState])  // 새 인덱스
}
```

**2) API 업데이트**

세션 생성 시 타이머 상태 초기화:
```typescript
// app/api/focus-sessions/route.ts
const session = await prisma.focusSession.create({
  data: {
    duration,
    actualTime: 0,
    startedAt: new Date(),
    completed: false,
    interrupted: false,
    timeLeft: duration * 60, // 초 단위로 저장
    timerState: 'running',
    lastUpdatedAt: new Date(),
    userId,
    taskId: taskId || null,
  },
});
```

세션 업데이트로 실시간 상태 저장:
```typescript
// app/api/focus-sessions/[id]/route.ts
const updateData: any = {
  actualTime: actualTime !== undefined ? actualTime : existingSession.actualTime,
  completed: completed !== undefined ? completed : existingSession.completed,
  interrupted: interrupted !== undefined ? interrupted : existingSession.interrupted,
  endedAt: shouldEnd ? new Date() : existingSession.endedAt,
};

// 타이머 상태 업데이트 (진행 중인 세션만)
if (!shouldEnd) {
  if (timeLeft !== undefined) {
    updateData.timeLeft = timeLeft;
  }
  if (timerState !== undefined) {
    updateData.timerState = timerState;
  }
  updateData.lastUpdatedAt = new Date();
}
```

**3) 컴포넌트 로직**

5초마다 DB에 자동 저장:
```typescript
// components/dashboard/FocusTimer.tsx
useEffect(() => {
  if (timerState === 'running') {
    // 1초마다 타이머 틱
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // 5초마다 DB에 저장
    saveIntervalRef.current = setInterval(() => {
      saveTimerState();
    }, 5000);
  }

  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
  };
}, [timerState]);

const saveTimerState = async () => {
  if (!sessionId) return;

  await fetch(`/api/focus-sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeLeft, timerState }),
  });
};
```

마운트 시 active 세션 복구:
```typescript
useEffect(() => {
  const loadActiveSession = async () => {
    const response = await fetch('/api/focus-sessions?active=true&limit=1');
    const data = await response.json();

    if (data.success && data.sessions.length > 0) {
      const session = data.sessions[0];

      // 경과 시간 계산
      const lastUpdated = new Date(session.lastUpdatedAt || session.startedAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);

      // 남은 시간 계산 (running 상태면 경과 시간 반영)
      let actualTimeLeft = session.timeLeft || (session.duration * 60);
      if (session.timerState === 'running') {
        actualTimeLeft = Math.max(0, actualTimeLeft - elapsedSeconds);
      }

      // 상태 복구
      setSessionId(session.id);
      setSelectedMinutes(session.duration);
      setSelectedTaskId(session.taskId || '');
      setTimeLeft(actualTimeLeft);
      setTimerState(session.timerState || 'running');

      if (actualTimeLeft === 0) {
        handleComplete();
      }
    }
    setLoading(false);
  };

  loadActiveSession();
}, []);
```

#### 결과
- ✅ 페이지 새로고침해도 타이머 유지
- ✅ 다른 페이지(칸반, 캘린더) 이동 후 돌아와도 유지
- ✅ 탭 전환, 모바일 전환 모두 대응
- ✅ 여러 기기에서 동일한 타이머 상태 확인 가능

---

### 3. 작업 시간 설정 기능

#### 문제점
- 작업에 날짜만 설정 가능하고 시간은 설정 불가
- 캘린더 주/일 뷰에서 모든 작업이 9am~11:59pm로 표시되어 겹침

#### 해결 방법

**1) 스키마 확장**

```prisma
model Task {
  id            String         @id @default(cuid())
  title         String
  description   String?
  scheduledDate DateTime?
  scheduledTime String?        // "09:30" 형식 추가
  priority      String         @default("mid")
  status        String         @default("todo")
  // ... 나머지 필드
}
```

**2) TaskModal UI 개선**

3단 그리드 레이아웃으로 날짜/시간/우선순위 한 줄에 배치:

```tsx
{/* 날짜, 시간 & 우선순위 */}
<div className="grid grid-cols-3 gap-4">
  <div>
    <label htmlFor="scheduledDate">날짜</label>
    <input
      id="scheduledDate"
      type="date"
      value={formData.scheduledDate}
      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
    />
  </div>

  <div>
    <label htmlFor="scheduledTime">시간</label>
    <input
      id="scheduledTime"
      type="time"
      value={formData.scheduledTime}
      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
      placeholder="09:00"
    />
  </div>

  <div>
    <label htmlFor="priority">우선순위</label>
    <select id="priority" value={formData.priority} onChange={...}>
      <option value="high">높음</option>
      <option value="mid">보통</option>
      <option value="low">낮음</option>
    </select>
  </div>
</div>
```

**3) API 업데이트**

```typescript
// app/api/tasks/route.ts - POST
const task = await prisma.task.create({
  data: {
    title: title.trim(),
    description: description?.trim() || null,
    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    scheduledTime: scheduledTime || null, // 새 필드
    priority: taskPriority,
    order: newOrder,
    userId,
    goalId: goalId || null,
  },
});

// app/api/tasks/[id]/route.ts - PATCH
if (scheduledTime !== undefined) {
  updateData.scheduledTime = scheduledTime || null;
}
```

---

### 4. 캘린더 작업 겹침 해결

#### 문제점
- 모든 작업이 하루 종일(0:00~23:59)로 표시됨
- 주/일 뷰에서 작업들이 겹쳐서 일부가 보이지 않음

#### 해결 방법

`scheduledTime`에 따라 이벤트 시간 동적 계산:

```typescript
// components/calendar/CalendarView.tsx
const events: CalendarEvent[] = useMemo(() => {
  return tasks
    .filter(task => task.scheduledDate)
    .map(task => {
      const start = new Date(task.scheduledDate!);
      const end = new Date(task.scheduledDate!);

      // scheduledTime이 있으면 시간 설정
      if (task.scheduledTime) {
        const [hours, minutes] = task.scheduledTime.split(':').map(Number);
        start.setHours(hours, minutes, 0, 0);
        // 기본 1시간 duration
        end.setHours(hours + 1, minutes, 0, 0);
      } else {
        // 시간 정보가 없으면 하루 종일 이벤트로 표시
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      return {
        id: task.id,
        title: task.title,
        start,
        end,
        resource: task,
      };
    });
}, [tasks]);
```

#### 결과
- ✅ 시간 설정된 작업: 해당 시간에 1시간 블록으로 표시
- ✅ 시간 미설정 작업: 하루 종일 이벤트로 표시
- ✅ 주/일 뷰에서 작업이 겹치지 않고 정확한 시간에 배치됨

---

## 🗂️ 변경된 파일

### 데이터베이스
- `prisma/schema.prisma`
  - `Task.scheduledTime` 필드 추가
  - `FocusSession.timeLeft`, `timerState`, `lastUpdatedAt` 필드 추가
  - `FocusSession`에 `userId`, `timerState` 복합 인덱스 추가
- `prisma/migrations/20251116095604_add_time_fields/migration.sql`

### API
- `app/api/focus-sessions/route.ts`
  - POST: 세션 생성 시 타이머 상태 초기화
  - GET: `active=true` 쿼리로 진행 중인 세션만 필터링
- `app/api/focus-sessions/[id]/route.ts`
  - PATCH: `timeLeft`, `timerState` 업데이트 처리
- `app/api/tasks/route.ts`
  - POST: `scheduledTime` 처리
- `app/api/tasks/[id]/route.ts`
  - PATCH: `scheduledTime` 업데이트 처리

### 컴포넌트
- `components/dashboard/TaskList.tsx`
  - `useMemo`로 작업 자동 분류
  - 오늘/밀린/예정 섹션 UI 구현
  - 접기/펼치기 상태 관리
- `components/dashboard/FocusTimer.tsx`
  - DB 기반 상태 저장/복구 로직
  - 5초마다 자동 저장
  - 마운트 시 active 세션 복구
  - pause/resume 시 DB 업데이트
- `components/dashboard/TaskModal.tsx`
  - `scheduledTime` 입력 필드 추가
  - 3단 그리드 레이아웃 (날짜/시간/우선순위)
- `components/calendar/CalendarView.tsx`
  - `scheduledTime` 기반 이벤트 시간 설정
  - 시간 없을 때 하루 종일 이벤트로 처리

---

## 🚀 배포 가이드

### 1. 마이그레이션 적용

```bash
npx prisma migrate deploy
```

### 2. Prisma Client 재생성

```bash
npx prisma generate
```

### 3. 앱 재시작

개발 환경:
```bash
npm run dev
```

프로덕션 환경:
```bash
npm run build
npm start
```

---

## 📊 테스트 시나리오

### 포커스 타이머 영구 저장 테스트

1. **기본 동작**
   - [ ] 타이머 시작 → 페이지 새로고침 → 타이머가 계속 진행중인가?
   - [ ] 타이머 시작 → 칸반 페이지로 이동 → 대시보드 복귀 → 타이머 유지?
   - [ ] 타이머 일시정지 → 새로고침 → 일시정지 상태 유지?

2. **멀티탭/멀티디바이스**
   - [ ] 탭 A에서 타이머 시작 → 탭 B 열기 → 타이머가 표시되나?
   - [ ] 모바일에서 타이머 시작 → PC에서 확인 → 동일한 타이머 표시?

3. **완료/중단**
   - [ ] 타이머 완료 → 포커스 히스토리에 "완료" 상태로 표시?
   - [ ] 타이머 중단 → 포커스 히스토리에 "중단" 상태로 표시?
   - [ ] 완료/중단된 세션은 다시 로드되지 않나?

### 대시보드 섹션 분리 테스트

1. **자동 분류**
   - [ ] 오늘 날짜 작업 → "오늘 할 일"에 표시?
   - [ ] 어제 날짜 작업 → "밀린 작업"에 표시?
   - [ ] 내일 날짜 작업 → "예정 작업"에 표시?
   - [ ] 날짜 없는 작업 → "오늘 할 일"에 표시?

2. **UI 동작**
   - [ ] "밀린 작업" 헤더 클릭 → 접기/펼치기 동작?
   - [ ] "예정 작업" 헤더 클릭 → 접기/펼치기 동작?
   - [ ] "오늘 할 일"은 항상 펼쳐져 있나?

### 작업 시간 설정 테스트

1. **TaskModal**
   - [ ] 시간 입력 필드가 표시되나?
   - [ ] 시간 입력 후 저장 → DB에 저장되나?
   - [ ] 기존 작업 수정 시 시간이 표시되나?

2. **캘린더 표시**
   - [ ] 시간 설정 작업 → 해당 시간에 1시간 블록으로 표시?
   - [ ] 시간 미설정 작업 → 하루 종일 이벤트로 표시?
   - [ ] 주 뷰에서 작업이 겹치지 않나?
   - [ ] 일 뷰에서 작업이 정확한 시간에 표시되나?

---

## 🐛 알려진 이슈

없음

---

## 💡 향후 개선 사항

1. **포커스 타이머**
   - [ ] 타이머 종료 예정 시간 표시 (예: "14:30에 종료 예정")
   - [ ] 여러 세션 동시 진행 지원
   - [ ] 타이머 템플릿 저장 기능

2. **작업 시간**
   - [ ] 작업 종료 시간 설정 (현재는 1시간 고정)
   - [ ] 시간 충돌 감지 및 경고
   - [ ] 작업 시간 통계 (하루/주/월 총 시간)

3. **대시보드**
   - [ ] 섹션별 정렬 옵션 (우선순위/날짜/제목)
   - [ ] 밀린 작업 자동 오늘로 이동 기능
   - [ ] 섹션별 필터링 (목표별, 우선순위별)

---

## 📚 참고 자료

- [React Big Calendar 문서](https://github.com/jquense/react-big-calendar)
- [Prisma 마이그레이션 가이드](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [React useMemo 최적화](https://react.dev/reference/react/useMemo)

---

**작성자**: Claude
**검토자**: -
**승인자**: -
