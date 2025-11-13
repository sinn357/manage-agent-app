# 🏗️ Architecture Design

## A. Implementation Details (구현 시작)

### 1. 인증 시스템 (Authentication)

**기술 스택**
- **암호화**: bcrypt (SALT_ROUNDS = 12)
- **토큰**: JWT (7일 만료)
- **저장**: HTTP-only cookies (secure, sameSite: strict)
- **DB 연결**: Prisma ORM + PostgreSQL

**API 엔드포인트**
```
POST   /api/auth/register    # 회원가입
POST   /api/auth/login       # 로그인
DELETE /api/auth/logout      # 로그아웃
GET    /api/auth/check       # 인증 확인
GET    /api/auth/me          # 현재 사용자 정보
```

**보안 정책**
- 비밀번호: 최소 8자, 영문+숫자 조합 권장
- 로그인 실패: 1초 지연 (브루트포스 방지)
- 토큰 검증: 모든 보호된 API에서 확인
- CSRF 방지: sameSite=strict 설정

**환경 변수**
```env
JWT_SECRET=your_jwt_secret_key_minimum_32_chars
DATABASE_URL=postgresql://...
```

---

### 2. 데이터베이스 구조

**핵심 모델**
```
User (사용자)
  ├── Goal (목표)
  │   ├── Milestone (마일스톤)
  │   └── Task (작업)
  ├── Task (일회성 작업)
  └── FocusSession (집중 세션)
```

**관계 설계**
- User → Goals: 1:N (cascade delete)
- Goal → Milestones: 1:N (cascade delete)
- Goal → Tasks: 1:N (set null on delete)
- User → Tasks: 1:N (cascade delete)
- Task → FocusSessions: 1:N (set null on delete)
- User → FocusSessions: 1:N (cascade delete)

**인덱스 전략**
- `tasks`: (userId, status, scheduledDate) - 오늘 할 일 조회 최적화
- `goals`: (userId, status) - 활성 목표 필터링
- `focusSessions`: (userId, startedAt) - 시간별 통계
- `milestones`: (goalId) - 목표별 마일스톤 조회

---

### 3. API 구조

**RESTful 규칙**
- `GET /api/resource` - 목록 조회
- `POST /api/resource` - 생성
- `GET /api/resource/[id]` - 단일 조회
- `PATCH /api/resource/[id]` - 수정
- `DELETE /api/resource/[id]` - 삭제

**목표 API**
```typescript
GET    /api/goals              # 목표 목록 (쿼리: status, limit, offset)
POST   /api/goals              # 목표 생성
GET    /api/goals/[id]         # 목표 상세
PATCH  /api/goals/[id]         # 목표 수정
DELETE /api/goals/[id]         # 목표 삭제
GET    /api/goals/[id]/progress # 진행률 계산
```

**작업 API**
```typescript
GET    /api/tasks              # 작업 목록
POST   /api/tasks              # 작업 생성
GET    /api/tasks/today        # 오늘 작업 (scheduledDate = today)
GET    /api/tasks/[id]         # 작업 상세
PATCH  /api/tasks/[id]         # 작업 수정
DELETE /api/tasks/[id]         # 작업 삭제
PATCH  /api/tasks/[id]/complete # 작업 완료 토글
```

**포커스 세션 API**
```typescript
POST   /api/focus              # 세션 시작
PATCH  /api/focus/[id]         # 세션 종료/중단
GET    /api/focus/stats        # 통계 (쿼리: period=today|week|month)
GET    /api/focus/[id]         # 세션 상세
```

**응답 형식**
```typescript
// 성공
{
  "success": true,
  "data": { ... }
}

// 실패
{
  "success": false,
  "error": "Error message"
}
```

---

### 4. 컴포넌트 아키텍처

**레이아웃 구조**
```
RootLayout (app/layout.tsx)
  └── AuthProvider (Context API)
       ├── (auth)/layout.tsx      # 비인증 레이아웃 (로그인/회원가입)
       │    └── 중앙 정렬 카드
       │
       └── (dashboard)/layout.tsx # 인증 필요 레이아웃
            ├── Header (상단)
            ├── Sidebar (왼쪽, 선택적)
            └── Main Content
```

**상태 관리 전략**
- **전역 상태**: React Context API
  - AuthContext (사용자 정보, 로그인 상태)
  - ThemeContext (다크모드, 선택적)
- **서버 상태**: Native fetch + useState
  - 추후 React Query 고려 (캐싱, 자동 refetch)
- **로컬 상태**: useState, useReducer

**핵심 커스텀 훅**
```typescript
useAuth()         // 인증 상태, 로그인/로그아웃 함수
useGoals()        // 목표 CRUD
useTasks()        // 작업 CRUD
useFocusTimer()   // 타이머 로직 (시작/정지/리셋)
useToday()        // 오늘 날짜, D-day 계산
```

---

## B. Feature Details (세부 기능 논의)

### 1. 목표/마일스톤 관계

**진행률 계산 로직**
```typescript
Goal Progress = (완료된 Tasks 수 / 전체 Tasks 수) × 100
또는
Goal Progress = (완료된 Milestones 수 / 전체 Milestones 수) × 100

// 둘 다 있으면 가중 평균
Progress = (Task Progress × 0.7) + (Milestone Progress × 0.3)
```

**D-day 표시**
- `D-0`: 오늘이 마감일
- `D-3`: 3일 남음
- `D+5`: 5일 지남 (빨간색 경고)

**목표 상태**
- `active`: 진행 중
- `completed`: 완료
- `archived`: 보관됨 (UI에서 숨김)

---

### 2. 포커스 타이머 상세 동작

**프리셋**
- 25분 (뽀모도로)
- 50분 (딥워크)
- 90분 (울트라딥워크)
- 커스텀 (사용자 입력)

**타이머 상태**
```typescript
enum TimerState {
  IDLE,        // 시작 전
  RUNNING,     // 실행 중
  PAUSED,      // 일시정지
  COMPLETED,   // 완료
  INTERRUPTED  // 중단됨
}
```

**중단 처리**
- 중단 버튼 클릭 시: `interrupted=true`, `actualTime` 기록
- 최소 5분 미만 세션은 통계에서 제외 (선택적)
- 중단된 세션도 리스트에 표시 (회색 처리)

**알림**
- 타이머 종료 시: 브라우저 알림 + 사운드
- 5분 전: "곧 종료됩니다" 알림

---

### 3. Task-Goal 관계

**일회성 Task 처리**
- `goalId = null` 허용
- Today Dashboard에서 "목표 없음" 섹션 별도 표시
- 필터: "전체 / 목표별 / 일회성만"

**Task 우선순위**
```typescript
enum Priority {
  HIGH = "high",    // 🔴 빨강
  MID = "mid",      // 🟡 노랑
  LOW = "low"       // 🟢 초록
}
```

**Task 상태 전환**
```
todo → in_progress → completed
  ↓                      ↑
  ←────── (재시작) ──────┘
```

---

### 4. UI/UX 인터랙션

**드래그 앤 드롭**
- Task 순서 변경: `order` 필드 업데이트
- 날짜 변경: (Phase 2 - 캘린더 뷰에서 구현)

**실시간 업데이트**
- 포커스 타이머: 1초마다 UI 갱신
- 진행률: Task 완료 시 즉시 반영
- D-day: 자정 기준 자동 갱신

**반응형 디자인**
- Desktop: 3단 레이아웃
- Tablet: 2단 (Goal + Task/Timer 병합)
- Mobile: 1단 (탭 전환)

---

## C. Tech Stack (기술 스택 확정)

### 1. 상태관리
**선택: Context API (Phase 1)**
- 이유: 간단한 전역 상태 관리
- 추후 확장: React Query (서버 상태) + Zustand (복잡한 클라이언트 상태)

**Context 구조**
```typescript
AuthContext       // 사용자 인증
DashboardContext  // Today 데이터 (goals, tasks, sessions)
```

---

### 2. UI 라이브러리
**선택: Tailwind CSS + Headless UI**
- Tailwind CSS: 이미 설정됨
- Headless UI: 접근성 좋은 컴포넌트 (Modal, Dropdown)
- 추후 고려: shadcn/ui (재사용 컴포넌트)

**컴포넌트 유틸**
```typescript
// lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### 3. 폼 관리
**선택: React Hook Form + Zod**
- React Hook Form: 성능 최적화된 폼 관리
- Zod: 타입 안전 유효성 검증

**예시**
```typescript
const taskSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요"),
  priority: z.enum(["high", "mid", "low"]),
  scheduledDate: z.date().optional(),
});
```

---

### 4. 날짜 처리
**선택: date-fns**
- 이유: 경량, 트리 쉐이킹 지원
- 용도: D-day 계산, 날짜 포맷팅

```typescript
import { differenceInDays, format } from "date-fns";
import { ko } from "date-fns/locale";

const daysLeft = differenceInDays(targetDate, new Date());
```

---

### 5. 알림
**선택: Web Notifications API + react-hot-toast**
- Web Notifications API: 브라우저 푸시
- react-hot-toast: 인앱 토스트 메시지

**권한 요청**
```typescript
if ("Notification" in window) {
  Notification.requestPermission();
}
```

---

### 6. 개발 도구
- **TypeScript**: 타입 안전성
- **ESLint + Prettier**: 코드 품질
- **Prisma Studio**: DB GUI
- **Thunder Client / Postman**: API 테스트

---

## 성능 최적화 전략

### 1. 데이터베이스
- 인덱스 활용 (userId, status, date)
- N+1 쿼리 방지 (Prisma include/select)
- 페이지네이션 (limit, offset)

### 2. 프론트엔드
- 컴포넌트 lazy loading
- 이미지 최적화 (Next.js Image)
- 메모이제이션 (useMemo, useCallback)

### 3. API
- 응답 캐싱 (선택적)
- 불필요한 데이터 제외 (Prisma select)

---

## 보안 체크리스트

- [ ] 비밀번호 해싱 (bcrypt)
- [ ] JWT 시크릿 환경변수 관리
- [ ] HTTP-only 쿠키 사용
- [ ] CSRF 방지 (sameSite)
- [ ] SQL Injection 방지 (Prisma parameterized queries)
- [ ] XSS 방지 (React 기본 escape)
- [ ] Rate limiting (추후 구현)
- [ ] 민감 정보 로그 제외

---

## 테스트 전략 (추후)

### Unit Tests
- 유틸 함수 (D-day 계산, 진행률 계산)
- 인증 로직

### Integration Tests
- API 엔드포인트
- 데이터베이스 연동

### E2E Tests
- 로그인 → 목표 생성 → 작업 완료 플로우
- 포커스 타이머 세션

---

## 참고 문서
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
