# 다음 세션 가이드 - Manage Agent App

> **작업**: Medium Priority 또는 Quick Wins
> **날짜**: 2026-01-12 이후
> **이전 세션**: Option A - Quick Wins 완료 (3개 작업)

---

## 🎯 이전 세션 완료 내역

### ✅ Option A - Quick Wins (완료)
1. **작업 시작 시간 알림 시스템** - scheduledTime 기반 알림, 미리 알림 (5/10/15/30분)
2. **루틴 → 작업 자동 생성** - 매일 자정 7일치 작업 자동 생성, 루틴 배지
3. **통합 검색 기능** - Ctrl+K 단축키, 작업/목표/루틴 검색, 하이라이팅

**커밋**: `2456bf8`, `a9a5217`, `83760c2`
**소요 시간**: ~6-7시간
**추가 코드**: ~1,700줄

---

## ⚠️ 세션 시작 전 확인사항

### 1. GitHub Actions 워크플로우 푸시 이슈 해결 (필수!)

**문제**:
- `a9a5217` 커밋에 `.github/workflows/cron-jobs.yml` 변경사항 포함
- GitHub 리포지토리 규칙으로 푸시 차단
- OAuth App에 `workflow` scope 권한 없음

**해결 방법**:
1. https://github.com/sinn357/manage-agent-app 접속
2. `.github/workflows/cron-jobs.yml` 파일 열기
3. "Edit" 버튼 클릭
4. 로컬 파일 내용 복사:
   ```bash
   cat /Users/woocheolshin/Documents/Vibecoding/projects/manage-agent-app/.github/workflows/cron-jobs.yml
   ```
5. 붙여넣기 후 "Commit changes"

**또는**:
- https://github.com/sinn357/manage-agent-app/settings/rules
- 워크플로우 규칙 비활성화 후 `git push` 재시도

### 2. GitHub Secrets 확인
- Settings → Secrets and variables → Actions
- `CRON_SECRET` 설정 확인 (2026-01-12 설정됨)

### 3. 워크플로우 수동 테스트
```bash
gh workflow run cron-jobs.yml -R sinn357/manage-agent-app
gh run list -R sinn357/manage-agent-app --workflow=cron-jobs.yml --limit 1
```

---

## 🚀 빠른 시작

### 세션 시작 시:
```bash
"manage-agent-app 작업 계속할게. 이전 세션 내역(docs/2026-01-12_Session_Complete.md)과
다음 세션 가이드(NEXT_SESSION.md) 읽고 시작해줘."
```

### Claude 자동 체크리스트:
1. ✅ README.md 읽기
2. ✅ CLAUDE.md 읽기 (토큰 효율성, 에러 처리)
3. ✅ 이전 세션 완료 내역 읽기
4. ✅ 이 가이드 읽기
5. ✅ 프로젝트 정보 확인 (`vibe info manage-agent-app`)

---

## 📋 추천 작업 옵션

### Option 1: Medium Priority 작업 (추천)

#### A. 주간 리뷰 페이지 (6-8h) ⭐
**개념**: 이번 주 돌아보기 + 다음 주 계획

**구현 범위**:
- `/weekly-review` 페이지 추가
- WeeklyReview 모델 (Prisma 스키마)
- 이번 주 완료한 작업 목록
- 미완료 작업 분석 (왜 못 했나?)
- 목표별 진척도
- 다음 주 계획 작성 필드
- 주간 리뷰 히스토리 저장

**데이터 모델**:
```prisma
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

#### B. 습관 트래커 (8-10h)
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

**사용자 가치**:
- ✅ 일일 습관 추적
- ✅ 동기부여 (스트릭)
- ✅ 건강/웰빙 개선

---

#### C. 데이터 백업/내보내기 (4-6h)
**구현 범위**:
- "설정 → 데이터" 탭 추가
- 전체 데이터 JSON 내보내기
- 목표별 CSV 내보내기
- 정기 백업 (Vercel Blob Storage - 선택)
- 데이터 가져오기 (JSON)

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

### Option 2: Quick Wins (UI 개선) (3-5h)

#### A. 빈 상태 디자인 (3-4h) ⭐
**현재**: "데이터 없음" 텍스트만
**개선**:
- 일러스트 추가 (lucide-react 아이콘)
- 온보딩 가이드
- CTA 버튼 강조 ("첫 작업 추가하기")

**컴포넌트**:
- `components/ui/EmptyState.tsx` (재사용 가능)
- 각 페이지별 빈 상태 메시지

**예시**:
```tsx
<EmptyState
  icon={<ListTodo className="w-16 h-16" />}
  title="아직 작업이 없습니다"
  description="첫 작업을 추가하고 목표를 달성해보세요!"
  action={{
    label: "작업 추가하기",
    onClick: handleAddTask
  }}
/>
```

---

#### B. 키보드 단축키 가이드 (3-4h)
**현재**: 단축키 있지만 안내 없음
**개선**:
- "?" 키로 단축키 모달 표시
- 단축키 설정 페이지 (선택)
- 커스터마이징 가능 (선택)

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

**컴포넌트**:
```tsx
// components/ui/skeleton.tsx 확장
<TaskListSkeleton />
<GoalPanelSkeleton />
<ChartSkeleton />
```

---

## 💡 작업 선택 가이드

### 빠른 가치 제공 (1-2일):
1. 빈 상태 디자인 (3-4h)
2. 키보드 단축키 가이드 (3-4h)
→ **총 6-8시간, 즉시 UX 개선**

### 장기적 가치 (2-3일):
1. 주간 리뷰 페이지 (6-8h)
2. 데이터 백업/내보내기 (4-6h)
→ **총 10-14시간, 회고 & 데이터 안전성**

### 습관 형성 지원 (3-4일):
1. 습관 트래커 (8-10h)
→ **단독 작업, 웰빙 개선**

---

## 🤝 Codex 협업 전략

### 협업 Trigger 조건
다음 조건 충족 시 Codex 위임 고려:
- ✅ 반복 패턴 3회 이상
- ✅ 명확한 템플릿 제공 가능
- ✅ 독립적 작업 (다른 부분 영향 없음)
- ✅ 예상 시간 1시간 이상

### Handoff 체크리스트
- [ ] Task 명확히 정의
- [ ] 템플릿/예시 1개 작성
- [ ] 주의사항 명시
- [ ] 참고 파일 경로 제공

---

## 📂 주요 파일 위치

### 프로젝트 루트
- `/Users/woocheolshin/Documents/Vibecoding/projects/manage-agent-app`

### 주요 디렉토리
```
app/
├── api/              # API 라우트
│   ├── search/      # 검색 API (신규)
│   ├── routines/    # 루틴 API
│   ├── tasks/       # 작업 API
│   └── goals/       # 목표 API
├── dashboard/       # 대시보드 페이지
├── settings/        # 설정 페이지
└── reports/         # 리포트 페이지

components/
├── dashboard/       # 대시보드 컴포넌트
├── search/          # 검색 모달 (신규)
└── ui/              # 공통 UI 컴포넌트

lib/
├── hooks/           # React 훅
│   └── useDebounce.ts (신규)
├── taskNotificationScheduler.ts (신규)
└── notifications.ts # 알림 시스템

prisma/
└── schema.prisma    # DB 스키마 (Task 모델 수정됨)

docs/
├── 2026-01-12_Session_Complete.md (신규)
├── NEXT_FEATURES.md # 기능 로드맵
└── projects/manage-agent-app.md
```

---

## 🧪 테스트 체크리스트

### 새 세션 시작 전
- [ ] 워크플로우 파일 GitHub에 푸시 완료
- [ ] GitHub Actions 수동 실행 테스트
- [ ] 로컬 DB 마이그레이션 확인 (`npx prisma db push`)
- [ ] 개발 서버 실행 확인 (`npm run dev`)

### 기능 테스트
- [ ] 작업 시작 알림 (설정 → 작업 생성 → 알림 확인)
- [ ] 루틴 자동 생성 (설정 → 루틴 생성 → API 호출 → 작업 확인)
- [ ] 통합 검색 (Ctrl+K → 검색 → 결과 클릭)

---

## 📝 작업 시작 템플릿

### Claude에게 요청 (예시)
```
"manage-agent-app 작업 계속할게.

이전 세션 완료:
- 작업 시작 알림
- 루틴 자동 생성
- 통합 검색

다음 작업: [Option 1-A: 주간 리뷰 페이지] 또는 [Option 2-A: 빈 상태 디자인]

docs/2026-01-12_Session_Complete.md와 NEXT_SESSION.md 읽고,
작업 계획 세워줘."
```

---

## 🔗 참고 문서

- `docs/2026-01-12_Session_Complete.md` - 이전 세션 완료 내역
- `docs/NEXT_FEATURES.md` - 전체 기능 로드맵
- `DEVELOPMENT_HISTORY.md` - 개발 히스토리
- `CLAUDE.md` - Claude 작업 프로토콜
- `AI_WORKFLOW.md` - Claude + Codex 협업

---

**마지막 업데이트**: 2026-01-12 18:30 KST
**담당**: Claude Sonnet 4.5
**다음 작업 추천**: Option 1-A (주간 리뷰) 또는 Option 2-A (빈 상태 디자인)
