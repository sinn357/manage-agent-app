# 다음 세션 가이드 - Manage Agent App

> **작업**: Medium Priority 또는 Quick Wins
> **날짜**: 2026-01-26 이후
> **이전 세션**: 포커스 타이머/히스토리 콤팩트화 완료

---

## 이전 세션 완료 내역

### 2026-01-26 완료

#### 포커스 타이머 & 히스토리 콤팩트화
**문제**: FocusTimer와 FocusHistory가 오른쪽 사이드바에서 많은 공간 차지

**해결**: 왼쪽 사이드바와 동일한 콤팩트 + 상세 모달 패턴 적용

**새로 생성된 파일**:
- `components/dashboard/FocusTimerCompact.tsx`
- `components/dashboard/FocusTimerDetailModal.tsx`
- `components/dashboard/FocusHistoryCompact.tsx`
- `components/dashboard/FocusHistoryDetailModal.tsx`

**레이아웃 변화**:
```
Before:                          After:
┌────────────────────────┐       ┌────────────────────────┐
│ FocusTimer (전체)      │       │ FocusTimerCompact      │
│ - 프리셋 6개           │  →    │ - 빠른 시작 25/50분    │
│ - 커스텀 입력          │       │ - 실행중: 타이머만     │
│ (높이 ~400px)          │       │ (높이 ~150px, -60%)    │
├────────────────────────┤       ├────────────────────────┤
│ FocusHistory (전체)    │       │ FocusHistoryCompact    │
│ - 통계 4개             │  →    │ - 오늘 요약만          │
│ - 세션 목록 10개       │       │ - 전체 통계 1줄        │
│ (높이 ~350px)          │       │ (높이 ~100px, -70%)    │
└────────────────────────┘       └────────────────────────┘
```

**특징**:
- idle: 빠른 시작 버튼 (25분/50분)
- running: 타이머 + 프로그레스바 + 제어 버튼
- 상세 설정은 모달에서 진행
- 오른쪽 사이드바 높이 약 50-60% 감소

**참고**: `docs/2026-01-26_Focus_Compact_Implementation.md`

---

### 2026-01-19 완료

#### 1. 주간 리뷰 페이지 구현
- WeeklyReview 모델 추가 (Prisma)
- /api/weekly-reviews API 엔드포인트
- /weekly-review 페이지 (통계, 회고, 다음 주 계획)
- 모든 페이지 헤더에 주간리뷰 메뉴 추가
- **커밋**: `508a170`

#### 2. 대시보드 콤팩트 레이아웃 리디자인 (왼쪽 사이드바)
**새로 생성된 파일**:
- `components/dashboard/LifeTimelineCompact.tsx`
- `components/dashboard/LifeTimelineDetailModal.tsx`
- `components/dashboard/LifeGoalsCompact.tsx`
- `components/dashboard/LifeGoalsDetailModal.tsx`
- `components/dashboard/GoalPanelCompact.tsx`
- `components/dashboard/GoalPanelDetailModal.tsx`

**특징**:
- 각 섹션에 `[→]` 버튼 → 클릭 시 상세 모달
- 왼쪽 사이드바 높이 약 40% 감소
- TaskList 영역 시각적으로 확장

---

## 빠른 시작

### 세션 시작 시:
```bash
"manage-agent-app 작업 계속할게. NEXT_SESSION.md 읽고 시작해줘."
```

---

## 추천 작업 옵션

### Option 1: Medium Priority

#### A. 습관 트래커 (8-10h)
**개념**: 루틴과 별개로 일일 체크 습관 (물 마시기, 운동 등)

**구현 범위**:
- Habit, HabitCheck 모델
- 습관 CRUD API
- 습관 체크 인터페이스
- 스트릭(연속 달성) 계산
- 캘린더에 체크 마크 표시
- 습관 통계 (달성률, 최장 스트릭)

**데이터 모델**:
```prisma
model Habit {
  id          String   @id @default(cuid())
  title       String
  icon        String?
  color       String   @default("#3B82F6")
  targetDays  String   // JSON: [0,1,2,3,4,5,6]
  userId      String
  createdAt   DateTime @default(now())
  User        User     @relation(fields: [userId], references: [id])
  Checks      HabitCheck[]
}

model HabitCheck {
  id        String   @id @default(cuid())
  date      DateTime
  habitId   String
  userId    String
  createdAt DateTime @default(now())
  Habit     Habit    @relation(fields: [habitId], references: [id])
  User      User     @relation(fields: [userId], references: [id])

  @@unique([habitId, userId, date])
}
```

---

#### B. 데이터 백업/내보내기 (4-6h)
**구현 범위**:
- "설정 → 데이터" 탭 추가
- 전체 데이터 JSON 내보내기
- 목표별 CSV 내보내기
- 데이터 가져오기 (JSON)

**API 엔드포인트**:
```typescript
// GET /api/export/all
// GET /api/export/goal/[id]
// POST /api/import
```

---

#### C. 포커스 타이머 & 히스토리 콤팩트화 ✅ 완료 (2026-01-26)
- FocusTimerCompact + FocusTimerDetailModal
- FocusHistoryCompact + FocusHistoryDetailModal
- 오른쪽 사이드바 높이 50-60% 감소

---

### Option 2: Quick Wins (UI 개선)

#### A. 빈 상태 디자인 (3-4h)
**현재**: "데이터 없음" 텍스트만
**개선**:
- 일러스트 추가 (lucide-react 아이콘)
- 온보딩 가이드
- CTA 버튼 강조 ("첫 작업 추가하기")

**컴포넌트**:
- `components/ui/EmptyState.tsx` (재사용 가능)

---

#### B. 키보드 단축키 가이드 (3-4h)
**현재**: 단축키 있지만 안내 없음
**개선**:
- "?" 키로 단축키 모달 표시
- 단축키 설정 페이지 (선택)

**현재 단축키**:
```typescript
const shortcuts = [
  { key: 'Ctrl+K', description: '검색' },
  { key: 'Ctrl+N', description: '새 작업 추가' },
  { key: 'Ctrl+Shift+N', description: '새 목표 추가' },
  { key: 'Ctrl+D', description: '다크 모드 전환' },
  { key: '?', description: '단축키 도움말' },
];
```

---

#### C. 칸반 드래그 피드백 강화 (2-3h)
**현재**: 드래그 시 시각적 피드백 약함
**개선**:
- 드롭 가능 영역 하이라이트
- 드래그 중 투명도 조정
- 드래그 프리뷰 개선

---

#### D. 로딩 상태 일관성 (4-5h)
**현재**: 페이지마다 로딩 UI 다름
**개선**: Skeleton UI 통일

---

## 작업 선택 가이드

### 빠른 가치 제공 (1일):
1. 빈 상태 디자인 (3-4h)
2. 키보드 단축키 가이드 (3-4h)

### 장기적 가치 (2-3일):
1. 습관 트래커 (8-10h)
2. 데이터 백업/내보내기 (4-6h)

---

## 주요 파일 위치

### 프로젝트 루트
- `/Users/woocheolshin/Documents/Vibecoding/projects/manage-agent-app`

### 새로 추가된 파일 (2026-01-26)
```
components/dashboard/
├── FocusTimerCompact.tsx        # 포커스 타이머 콤팩트
├── FocusTimerDetailModal.tsx    # 포커스 타이머 상세 모달
├── FocusHistoryCompact.tsx      # 포커스 히스토리 콤팩트
└── FocusHistoryDetailModal.tsx  # 포커스 히스토리 상세 모달

docs/
├── 2026-01-26_Focus_Compact_Implementation.md
└── NEXT_SESSION.md (이 파일)
```

### 이전 추가 파일 (2026-01-19)
```
components/dashboard/
├── LifeTimelineCompact.tsx      # Life Timeline 콤팩트
├── LifeTimelineDetailModal.tsx  # Life Timeline 상세 모달
├── LifeGoalsCompact.tsx         # 인생목표 콤팩트
├── LifeGoalsDetailModal.tsx     # 인생목표 상세 모달
├── GoalPanelCompact.tsx         # 목표 콤팩트
└── GoalPanelDetailModal.tsx     # 목표 상세 모달

app/
├── weekly-review/page.tsx       # 주간 리뷰 페이지
└── api/weekly-reviews/route.ts  # 주간 리뷰 API
```

---

## 참고 문서

- `docs/2026-01-26_Focus_Compact_Implementation.md` - 포커스 콤팩트화 구현 내역
- `docs/2026-01-19_Weekly_Review_Implementation.md` - 주간 리뷰 구현 내역
- `docs/2026-01-12_Session_Complete.md` - 이전 세션 완료 내역
- `docs/NEXT_FEATURES.md` - 전체 기능 로드맵

---

**마지막 업데이트**: 2026-01-26
**담당**: Claude Opus 4.5
**다음 작업 추천**: Option 2-A (빈 상태 디자인) 또는 Option 1-A (습관 트래커)
