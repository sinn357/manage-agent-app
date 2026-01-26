# 포커스 타이머 & 히스토리 콤팩트화 구현

> **날짜**: 2026-01-26
> **작업자**: Claude Opus 4.5

---

## 구현 개요

대시보드 오른쪽 사이드바의 FocusTimer와 FocusHistory를 콤팩트 버전으로 리디자인.
왼쪽 사이드바와 동일한 패턴 적용: 콤팩트 컴포넌트 + 상세 모달.

---

## 변경 사항

### 레이아웃 비교

```
Before:                              After:
┌────────────────────────────┐       ┌────────────────────────────┐
│ FocusTimer (전체)          │       │ FocusTimerCompact          │
│ - 프리셋 버튼 6개          │       │ - 빠른 시작 (25/50분)      │
│ - 커스텀 입력              │  →    │ - 실행 중: 타이머 + 제어   │
│ - 작업 선택                │       │ - 상세 모달 열기 [→]       │
│ - 타이머 디스플레이        │       │ (약 60% 높이 감소)         │
│ (높이: ~400px)             │       │                            │
├────────────────────────────┤       ├────────────────────────────┤
│ FocusHistory (전체)        │       │ FocusHistoryCompact        │
│ - 통계 4개                 │       │ - 오늘 요약 (시간, 완료)   │
│ - 세션 목록 (최대 10개)    │  →    │ - 전체 요약 (1줄)          │
│ - 더보기/접기              │       │ - 상세 모달 열기 [→]       │
│ (높이: ~350px)             │       │ (약 70% 높이 감소)         │
└────────────────────────────┘       └────────────────────────────┘
```

---

## 새로 생성된 파일

### 1. `components/dashboard/FocusTimerCompact.tsx`

**기능:**
- 타이머 idle 상태: 빠른 시작 버튼 (25분, 50분)
- 타이머 running/paused 상태: 시간 표시 + 프로그레스바 + 제어 버튼
- 연결된 작업 표시
- 상세 모달 열기 버튼 `[→]`
- 기존 FocusTimer의 모든 로직 유지 (세션 복구, Visibility API 등)

**Props:**
```typescript
interface FocusTimerCompactProps {
  tasks?: Task[];
  onSessionComplete?: () => void;
  taskTrigger?: { task: Task; minutes: number | 'custom' } | null;
  onTaskTriggerConsumed?: () => void;
}
```

### 2. `components/dashboard/FocusTimerDetailModal.tsx`

**기능:**
- 전체 FocusTimer 기능을 모달에서 제공
- 프리셋 버튼 (5, 10, 25, 30, 45, 60, 90분)
- 커스텀 시간 입력
- 작업 선택 드롭다운
- 타이머 제어 (시작/일시정지/재개/중단)
- 브라우저 알림 권한 요청

**Props:**
```typescript
interface FocusTimerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSessionComplete?: () => void;
  currentState: TimerStateData;
  onStateChange: (newState: Partial<...>) => void;
}
```

### 3. `components/dashboard/FocusHistoryCompact.tsx`

**기능:**
- 오늘 집중 시간 & 완료 세션 수 표시
- 전체 통계 요약 (1줄)
- 상세 모달 열기 버튼 `[→]`

**Props:**
```typescript
interface FocusHistoryCompactProps {
  refreshKey?: number;
}
```

### 4. `components/dashboard/FocusHistoryDetailModal.tsx`

**기능:**
- 전체 통계 카드 (세션, 완료, 중단, 총 시간)
- 완료율 프로그레스바
- 세션 목록 (작업명, 시간, 상태 뱃지)
- 세션 삭제 기능

**Props:**
```typescript
interface FocusHistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: FocusSession[];
  stats: { total, completed, interrupted, totalMinutes };
  onRefresh: () => void;
}
```

---

## 수정된 파일

### `app/dashboard/page.tsx`

**변경 내용:**
1. import 변경: `FocusTimer` → `FocusTimerCompact`
2. import 변경: `FocusHistory` → `FocusHistoryCompact`
3. 컴포넌트 사용 변경 (Props는 동일)

```diff
- import FocusTimer from '@/components/dashboard/FocusTimer';
- import FocusHistory from '@/components/dashboard/FocusHistory';
+ import FocusTimerCompact from '@/components/dashboard/FocusTimerCompact';
+ import FocusHistoryCompact from '@/components/dashboard/FocusHistoryCompact';
```

---

## UX 개선 사항

### 1. 공간 효율성
- 오른쪽 사이드바 높이 약 50-60% 감소
- TaskList 영역이 시각적으로 더 넓어 보임

### 2. 빠른 시작
- idle 상태에서 25분/50분 버튼으로 즉시 시작 가능
- 커스텀 설정은 모달에서 진행

### 3. 집중 모드
- 타이머 실행 중에는 핵심 정보만 표시
- 불필요한 UI 요소 숨김

### 4. 오늘 집중 강조
- 히스토리에서 "오늘" 통계를 먼저 표시
- 동기부여 효과

---

## 테스트 체크리스트

- [x] 빌드 성공
- [ ] 빠른 시작 (25분/50분) 동작
- [ ] 커스텀 시간 설정 (모달)
- [ ] 작업 연결 기능
- [ ] 타이머 일시정지/재개/중단
- [ ] 세션 완료 시 히스토리 갱신
- [ ] 페이지 새로고침 후 세션 복구
- [ ] 브라우저 알림

---

## 파일 목록

### 신규 (4개)
- `components/dashboard/FocusTimerCompact.tsx`
- `components/dashboard/FocusTimerDetailModal.tsx`
- `components/dashboard/FocusHistoryCompact.tsx`
- `components/dashboard/FocusHistoryDetailModal.tsx`

### 수정 (1개)
- `app/dashboard/page.tsx` (import 및 컴포넌트 변경)

### 유지 (2개, 삭제하지 않음)
- `components/dashboard/FocusTimer.tsx` (다른 페이지에서 사용 가능)
- `components/dashboard/FocusHistory.tsx` (다른 페이지에서 사용 가능)

---

**마지막 업데이트**: 2026-01-26
