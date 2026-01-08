# Codex Task: 루틴 완료 체크 기능 구현

## 📋 작업 개요
오늘의 루틴 위젯에 체크박스를 추가하여 사용자가 루틴 완료 여부를 기록할 수 있도록 구현

**예상 소요 시간**: 4-5시간
**난이도**: 중간
**관련 파일**: 데이터베이스 스키마, API, UI 컴포넌트

---

## 🎯 요구사항

### 기능 요구사항
1. 루틴마다 체크박스 표시
2. 체크 시 오늘 날짜로 완료 기록 저장
3. 체크 해제 시 완료 기록 삭제
4. 오늘 이미 완료한 루틴은 체크 상태 유지
5. 완료 히스토리 저장 (날짜별)

### UI 요구사항
- 체크박스는 각 루틴 카드 왼쪽에 배치
- 체크된 루틴은 시각적으로 구분 (흐릿하게 또는 배경 변경)
- 체크/언체크 즉시 반영 (새로고침 불필요)

---

## 📐 데이터베이스 스키마

### RoutineCheck 모델 추가
**파일**: `prisma/schema.prisma`

```prisma
model RoutineCheck {
  id        String   @id @default(cuid())
  date      DateTime // 완료한 날짜 (YYYY-MM-DD 00:00:00)
  routineId String
  userId    String
  createdAt DateTime @default(now())

  Routine   Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)
  User      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([routineId, userId, date])
  @@index([userId, date])
}
```

### Routine 모델에 relation 추가
**파일**: `prisma/schema.prisma`

```prisma
model Routine {
  // 기존 필드들...

  RoutineCheck RoutineCheck[]
}
```

### User 모델에 relation 추가
**파일**: `prisma/schema.prisma`

```prisma
model User {
  // 기존 필드들...

  RoutineCheck RoutineCheck[]
}
```

### 마이그레이션 실행
```bash
npx prisma generate
npx prisma db push
```

---

## 🔌 API 구현

### 1. 루틴 완료 체크 API
**파일**: `app/api/routines/[id]/check/route.ts` ✨ 신규

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/routines/[id]/check - 루틴 완료 체크
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;

    // 루틴 존재 및 소유권 확인
    const routine = await prisma.routine.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!routine) {
      return NextResponse.json(
        { success: false, error: 'Routine not found' },
        { status: 404 }
      );
    }

    if (routine.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 오늘 날짜 (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 이미 체크되어 있는지 확인
    const existing = await prisma.routineCheck.findUnique({
      where: {
        routineId_userId_date: {
          routineId: id,
          userId,
          date: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already checked today' },
        { status: 400 }
      );
    }

    // 루틴 체크 생성
    const check = await prisma.routineCheck.create({
      data: {
        routineId: id,
        userId,
        date: today,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Routine checked',
      check,
    });
  } catch (error) {
    console.error('Check routine error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/routines/[id]/check - 루틴 완료 체크 해제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;

    // 오늘 날짜 (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 체크 삭제
    const deleted = await prisma.routineCheck.deleteMany({
      where: {
        routineId: id,
        userId,
        date: today,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Routine unchecked',
    });
  } catch (error) {
    console.error('Uncheck routine error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. 루틴 목록 API 수정
**파일**: `app/api/routines/route.ts` 📝 수정

기존 GET 엔드포인트에 오늘의 체크 상태 포함:

```typescript
// GET /api/routines 수정
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const routines = await prisma.routine.findMany({
      where: { userId },
      include: {
        RoutineCheck: {
          where: {
            date: today,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // isCheckedToday 필드 추가
    const routinesWithCheck = routines.map((routine) => ({
      ...routine,
      isCheckedToday: routine.RoutineCheck.length > 0,
      RoutineCheck: undefined, // 클라이언트에 전송 안 함
    }));

    return NextResponse.json({
      success: true,
      routines: routinesWithCheck,
    });
  } catch (error) {
    console.error('Get routines error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 UI 구현

### TodayRoutines 컴포넌트 수정
**파일**: `components/dashboard/TodayRoutines.tsx` 📝 수정

#### 1. interface 수정
```typescript
interface Routine {
  id: string;
  title: string;
  description: string | null;
  recurrenceType: string;
  recurrenceDays: string | null;
  timeOfDay: string | null;
  duration: number | null;
  priority: string;
  active: boolean;
  isCheckedToday: boolean; // 추가
}
```

#### 2. import 추가
```typescript
import { CheckCircle2, Circle } from 'lucide-react';
```

#### 3. 체크 핸들러 함수 추가
```typescript
const handleCheck = async (routineId: string, isChecked: boolean) => {
  try {
    const method = isChecked ? 'DELETE' : 'POST';
    const response = await fetch(`/api/routines/${routineId}/check`, {
      method,
    });

    const data = await response.json();

    if (data.success) {
      // 루틴 목록 새로고침
      fetchRoutines();
    } else {
      console.error('Failed to toggle routine check:', data.error);
    }
  } catch (error) {
    console.error('Toggle routine check error:', error);
  }
};
```

#### 4. 루틴 카드 UI 수정
기존 카드 div 내부에 체크박스 추가:

```typescript
<div
  key={routine.id}
  className={`p-4 bg-surface rounded-xl border border-border hover:shadow-md transition-all ${
    routine.isCheckedToday ? 'opacity-60' : ''
  }`}
>
  <div className="flex items-start gap-3">
    {/* 체크박스 추가 */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleCheck(routine.id, routine.isCheckedToday);
      }}
      className="flex-shrink-0 mt-0.5 transition-all"
      aria-label={`${routine.title} ${routine.isCheckedToday ? '완료 취소' : '완료 처리'}`}
    >
      {routine.isCheckedToday ? (
        <CheckCircle2 className="w-5 h-5 text-success" />
      ) : (
        <Circle className="w-5 h-5 text-border hover:text-primary transition-colors" />
      )}
    </button>

    {/* 기존 콘텐츠 */}
    <div
      className="flex-1 min-w-0 cursor-pointer"
      onClick={() => router.push('/settings?tab=routines')}
    >
      {/* 기존 내용 그대로 유지 */}
    </div>
  </div>
</div>
```

---

## ✅ 체크리스트

### DB & 마이그레이션
- [ ] `prisma/schema.prisma`에 RoutineCheck 모델 추가
- [ ] Routine 모델에 relation 추가
- [ ] User 모델에 relation 추가
- [ ] `npx prisma generate` 실행
- [ ] `npx prisma db push` 실행

### API 구현
- [ ] `app/api/routines/[id]/check/route.ts` 생성
- [ ] POST 엔드포인트 구현 (체크)
- [ ] DELETE 엔드포인트 구현 (언체크)
- [ ] `app/api/routines/route.ts` GET 수정 (isCheckedToday 포함)

### UI 구현
- [ ] `components/dashboard/TodayRoutines.tsx` interface 수정
- [ ] CheckCircle2, Circle import
- [ ] handleCheck 함수 추가
- [ ] 체크박스 UI 추가
- [ ] 체크된 루틴 스타일 변경 (opacity-60)

### 테스트
- [ ] 루틴 체크 → DB에 RoutineCheck 생성 확인
- [ ] 루틴 언체크 → DB에서 RoutineCheck 삭제 확인
- [ ] 페이지 새로고침 → 체크 상태 유지 확인
- [ ] 다른 날짜에 다시 체크 가능 확인

---

## ⚠️ 주의사항

1. **날짜 처리**
   - 항상 `today.setHours(0, 0, 0, 0)` 사용
   - 시간대 문제 방지

2. **Unique 제약**
   - `@@unique([routineId, userId, date])` 있음
   - 같은 날 중복 체크 방지

3. **에러 처리**
   - API 실패 시 사용자에게 피드백
   - console.error로 로그 출력

4. **성능**
   - 루틴 목록 조회 시 join 최소화
   - isCheckedToday는 서버에서 계산

---

## 📚 참고 파일

- **유사 구현**: `components/dashboard/TaskList.tsx` (체크박스 로직)
- **API 패턴**: `app/api/tasks/[id]/complete/route.ts`
- **DB 모델**: `prisma/schema.prisma` (Task, FocusSession 참고)

---

**작성일**: 2026-01-09
**담당**: Codex
**검토**: Claude Code
