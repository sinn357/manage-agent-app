# 🚀 Next Features & Improvements

**문서 목적**: 현재 완료된 기능을 넘어 추가할 가치 있는 기능들의 우선순위별 로드맵

**마지막 업데이트**: 2026-01-05
**현재 상태**: Phase 3 완료 + 모바일/UX 개선 완료

---

## 📊 현재 완료 상태

### ✅ 완료된 주요 기능 (2026-01-05 기준)
- **Phase 1-3**: MVP + 일정 관리 + 리포트 시스템
- **Design System**: Gradient Elevation (Glassmorphism 2.0)
- **Mobile Responsive**: 모바일 메뉴바 최적화
- **Soft Delete**: 작업 소프트 삭제 시스템
- **Routine Widget**: 대시보드 루틴 위젯

### 📦 기술 스택
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel
- **Libraries**: recharts, @dnd-kit, react-big-calendar, lucide-react

---

## 🔥 High Priority (즉시 가치 있는 기능)

### 1. 루틴 → 작업 자동 생성 시스템
**현재 상태**: API는 존재하지만 UI 연동 없음
- `/api/routines/generate-tasks` 엔드포인트 존재

**구현 계획**:
- [ ] 매일 자정 자동 작업 생성 (Vercel Cron Job)
- [ ] 루틴 기반 작업에 "루틴" 배지 표시
- [ ] 루틴 완료 체크 및 히스토리 기록
- [ ] "루틴에서 생성됨" 필드 추가 (Task 모델)

**예상 시간**: 4-6시간

**기술 요구사항**:
```typescript
// Task 모델 확장
model Task {
  // ...
  isFromRoutine  Boolean @default(false)
  routineId      String?
  Routine        Routine? @relation(fields: [routineId], references: [id])
}

// Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/cron/generate-routine-tasks",
    "schedule": "0 0 * * *"
  }]
}
```

**사용자 가치**:
- ✅ 매일 반복 작업 자동 생성으로 시간 절약
- ✅ 루틴 준수율 추적 가능
- ✅ 습관 형성 지원

---

### 2. 소프트 삭제 항목 관리 UI (휴지통)
**현재 상태**: 소프트 삭제 로직 구현 완료, UI 없음

**구현 계획**:
- [ ] 설정 → "휴지통" 탭 추가
- [ ] 삭제된 작업 목록 표시 (deletedAt 기준)
- [ ] 복구 버튼 (deletedAt = null)
- [ ] 영구 삭제 버튼 (실제 DELETE)
- [ ] 30일 후 자동 영구 삭제 (Cron Job)

**예상 시간**: 3-4시간

**API 엔드포인트**:
```typescript
// GET /api/tasks/deleted
// PATCH /api/tasks/[id]/restore
// DELETE /api/tasks/[id]/permanent
```

**사용자 가치**:
- ✅ 실수로 삭제한 작업 복구
- ✅ 삭제 기록 확인
- ✅ 데이터 정리 관리

---

### 3. 통합 검색 기능
**현재 상태**: 검색 기능 없음

**구현 계획**:
- [ ] 헤더에 검색 바 추가
- [ ] 키보드 단축키 (Cmd/Ctrl + K)
- [ ] 작업, 목표, 루틴 통합 검색
- [ ] 검색 결과 하이라이팅
- [ ] 최근 검색어 저장 (localStorage)
- [ ] 필터링 옵션 (타입, 상태, 날짜)

**예상 시간**: 6-8시간

**기술 구현**:
```typescript
// Search API
GET /api/search?q=keyword&type=task,goal,routine&status=active

// UI Component
<SearchModal
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
/>
```

**사용자 가치**:
- ✅ 빠른 작업/목표 찾기
- ✅ 생산성 향상
- ✅ 데이터가 많아져도 효율적 관리

---

### 4. 작업 시작 시간 알림
**현재 상태**: 알림 설정은 있으나 실제 알림은 포커스 타이머만

**구현 계획**:
- [ ] `scheduledTime` 기반 브라우저 알림
- [ ] 5분 전 미리 알림 옵션
- [ ] 루틴 시간 알림
- [ ] 알림 스누즈 기능
- [ ] 알림 히스토리

**예상 시간**: 4-5시간

**기술 구현**:
```typescript
// lib/scheduler.ts
export function scheduleTaskNotification(task: Task) {
  const scheduledTime = new Date(`${task.scheduledDate} ${task.scheduledTime}`);
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();

  if (delay > 0) {
    setTimeout(() => {
      showNotification(`작업 시작: ${task.title}`);
    }, delay);
  }
}
```

**사용자 가치**:
- ✅ 작업 시작 시간 놓치지 않음
- ✅ 일정 준수율 향상
- ✅ 시간 관리 개선

---

## 📊 Medium Priority (생산성 향상)

### 5. 주간 리뷰 페이지
**컨셉**: 이번 주 돌아보기 + 다음 주 계획

**구현 계획**:
- [ ] "주간 리뷰" 페이지 추가 (`/weekly-review`)
- [ ] 이번 주 완료한 작업 목록
- [ ] 미완료 작업 분석 (왜 못 했나?)
- [ ] 목표별 진척도
- [ ] 다음 주 계획 작성 필드
- [ ] 주간 리뷰 히스토리 저장

**예상 시간**: 6-8시간

**데이터 모델**:
```typescript
model WeeklyReview {
  id              String   @id @default(cuid())
  weekStart       DateTime
  weekEnd         DateTime
  completedTasks  Int
  totalTasks      Int
  insights        String?
  nextWeekPlan    String?
  userId          String
  createdAt       DateTime @default(now())
  User            User     @relation(fields: [userId], references: [id])
}
```

**사용자 가치**:
- ✅ 주기적 회고로 생산성 개선
- ✅ 패턴 인식 및 학습
- ✅ 목표 조정 기회

---

### 6. 습관 트래커
**컨셉**: 루틴과 별개로 일일 체크 습관 (물 마시기, 운동 등)

**구현 계획**:
- [ ] Habit 모델 추가
- [ ] 습관 CRUD API
- [ ] 습관 체크 인터페이스
- [ ] 스트릭(연속 달성) 계산
- [ ] 캘린더에 체크 마크 표시
- [ ] 습관 통계 (달성률, 최장 스트릭)

**예상 시간**: 8-10시간

**데이터 모델**:
```typescript
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

**사용자 가치**:
- ✅ 일일 습관 추적
- ✅ 동기부여 (스트릭)
- ✅ 건강/웰빙 개선

---

### 7. 데이터 백업/내보내기
**구현 계획**:
- [ ] "설정 → 데이터" 탭 추가
- [ ] 전체 데이터 JSON 내보내기
- [ ] 목표별 CSV 내보내기
- [ ] 정기 백업 (Vercel Blob Storage)
- [ ] 데이터 가져오기 (JSON)

**예상 시간**: 4-6시간

**API 엔드포인트**:
```typescript
// GET /api/export/all
// GET /api/export/goal/[id]
// POST /api/import
```

**사용자 가치**:
- ✅ 데이터 안전성
- ✅ 플랫폼 이동 자유도
- ✅ 외부 분석 도구 연동 가능

---

### 8. 작업 템플릿
**컨셉**: 반복 프로젝트를 템플릿으로 저장

**구현 계획**:
- [ ] Template 모델 추가
- [ ] 템플릿 생성 (목표 + 작업 묶음)
- [ ] 템플릿에서 일괄 생성
- [ ] 템플릿 공유 (선택)
- [ ] 커뮤니티 템플릿 (선택)

**예상 시간**: 6-8시간

**데이터 모델**:
```typescript
model Template {
  id          String   @id @default(cuid())
  name        String
  description String?
  structure   String   // JSON: {goal, tasks[]}
  isPublic    Boolean  @default(false)
  userId      String
  createdAt   DateTime @default(now())
  User        User     @relation(fields: [userId], references: [id])
}
```

**사용자 가치**:
- ✅ 반복 프로젝트 빠른 시작
- ✅ 일관된 작업 구조
- ✅ 시간 절약

---

## 💡 Low Priority (장기 개선)

### 9. 협업 기능
- [ ] 목표/작업 읽기 전용 공유
- [ ] 댓글 기능
- [ ] 프로젝트 멤버 초대
- [ ] 실시간 동기화

**예상 시간**: 20-30시간

---

### 10. AI 어시스턴트
- [ ] 작업 우선순위 자동 추천
- [ ] 일정 충돌 감지
- [ ] "이번 주는 A 목표에 집중하세요" 제안
- [ ] 생산성 패턴 분석 AI

**예상 시간**: 30-40시간

**기술 요구사항**:
- OpenAI API 또는 Anthropic API
- Vector DB (벡터 검색)
- 사용자 행동 패턴 학습

---

### 11. PWA 오프라인 모드
- [ ] Service Worker 구현
- [ ] IndexedDB 캐싱
- [ ] 오프라인 작업 큐
- [ ] 온라인 복귀 시 동기화

**예상 시간**: 15-20시간

---

## 🛠 즉시 다듬을 부분 (Quick Wins)

### UI/UX 개선

#### 1. 칸반 드래그 피드백 강화
**현재**: 드래그 시 시각적 피드백 약함
**개선**: 드롭 가능 영역 하이라이트, 드래그 중 투명도

**예상 시간**: 2-3시간

---

#### 2. 빈 상태 디자인
**현재**: "데이터 없음" 텍스트만
**개선**:
- 일러스트 추가
- 온보딩 가이드
- CTA 버튼 강조

**예상 시간**: 3-4시간

**컴포넌트**:
- EmptyState.tsx (재사용 가능)
- 각 페이지별 빈 상태 메시지

---

#### 3. 로딩 상태 일관성
**현재**: 페이지마다 로딩 UI 다름
**개선**: Skeleton UI 통일

**예상 시간**: 4-5시간

**컴포넌트**:
```tsx
// components/ui/skeleton.tsx 확장
<TaskListSkeleton />
<GoalPanelSkeleton />
<ChartSkeleton />
```

---

#### 4. 에러 처리 개선
**현재**: toast만 표시
**개선**:
- 재시도 버튼
- 에러 바운더리
- 에러 페이지 (404, 500)

**예상 시간**: 4-6시간

---

#### 5. 키보드 단축키 가이드
**현재**: Ctrl+N 등 있지만 안내 없음
**개선**:
- "?" 키로 단축키 모달 표시
- 단축키 설정 페이지
- 커스터마이징 가능

**예상 시간**: 3-4시간

**단축키 목록**:
```typescript
const shortcuts = [
  { key: 'Ctrl+N', description: '새 작업 추가' },
  { key: 'Ctrl+Shift+N', description: '새 목표 추가' },
  { key: 'Ctrl+K', description: '검색' },
  { key: 'Ctrl+D', description: '다크 모드 전환' },
  { key: '?', description: '단축키 도움말' },
];
```

---

## 🎯 추천 구현 순서 (1주일 기준)

### Week 1: Foundation & Quick Wins
**Day 1-2**:
- ✅ 루틴 → 작업 자동 생성
- ✅ 검색 기능 (기본)

**Day 3-4**:
- ✅ 소프트 삭제 관리 UI (휴지통)
- ✅ 작업 시작 시간 알림

**Day 5-6**:
- ✅ 빈 상태 디자인
- ✅ 키보드 단축키 가이드
- ✅ 로딩 상태 일관성

**Day 7**:
- ✅ 주간 리뷰 페이지 (기본)
- ✅ 통합 테스트 & 버그 수정

---

## 📈 장기 로드맵 (3개월)

### Month 1: Core Features
- 루틴 자동화 완성
- 검색 시스템
- 휴지통 & 복구
- 알림 시스템 강화

### Month 2: Analytics & Habits
- 주간 리뷰
- 습관 트래커
- 데이터 백업/내보내기
- 작업 템플릿

### Month 3: Advanced Features
- AI 어시스턴트 (Phase 1)
- 협업 기능 (Phase 1)
- PWA 오프라인 모드
- 성능 최적화

---

## 📊 성공 지표

### 사용자 경험
- 일일 활성 사용자 (DAU)
- 세션 당 체류 시간
- 작업 완료율
- 루틴 준수율

### 기술 성능
- 페이지 로드 시간 < 2초
- API 응답 시간 < 500ms
- Lighthouse 점수 > 90
- 에러율 < 1%

---

## 🔗 관련 문서
- `DEVELOPMENT_HISTORY.md` - 개발 히스토리
- `ROADMAP.md` - 원래 로드맵
- `ARCHITECTURE.md` - 기술 아키텍처
- `README.md` - 프로젝트 개요

---

**문서 작성**: 2026-01-05
**다음 업데이트 예정**: 2026-01-12
