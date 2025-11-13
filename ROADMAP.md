# 🗺️ Development Roadmap

## 프로젝트 목표
**매니징 에이전트**: 목표 달성을 중심으로 일정과 집중을 통합 관리하는 자기 운영 플랫폼

**핵심 루프**: Plan (계획) → Focus (실행) → Review (리포트)

---

## 🎯 Phase 1: 핵심 루프 구축 (MVP) - ✅ 완료 (2025-01-13)

### 목표
"오늘 해야 할 일"을 보고, 실행하고, 끝내는 최소 기능 완성

### 주요 기능
- ✅ 사용자 인증 (회원가입, 로그인, 로그아웃) - bcrypt + JWT
- ✅ 목표 관리 (생성, 수정, 삭제, D-day 표시, 진행률)
- ✅ 작업 관리 (목표별 + 일회성 작업, 우선순위, 완료 토글)
- ✅ 포커스 타이머 (25/50/90분 프리셋 + 커스텀, 세션 기록)
- ✅ 포커스 히스토리 (통계, 최근 10개 세션)
- ✅ Today Dashboard (오늘 할 일, 목표 진행률, 타이머)
- ✅ 브라우저 알림 (세션 완료 시)

### 상세 일정

#### Week 1: 기반 구축 ✅
**Day 1-2: 데이터베이스 & 인증**
- [x] Prisma 스키마 설계 (User, Goal, Milestone, Task, FocusSession)
- [x] DB 마이그레이션
- [x] 인증 시스템 구현 (bcrypt + JWT)
- [x] Auth API 라우트 (register, login, logout, check)
- [x] AuthContext 설정

**Day 3-4: 인증 UI**
- [x] AuthForm 컴포넌트 (로그인/회원가입 통합)
- [x] ProtectedRoute HOC (useEffect로 구현)
- [x] 로그인/회원가입 페이지
- [x] 인증 테스트

**Day 5-7: 목표 관리**
- [x] Goal API 라우트 (CRUD)
- [x] GoalPanel 컴포넌트
- [x] 목표 생성/수정 모달
- [x] D-day 계산 유틸
- [x] 진행률 표시 컴포넌트

#### Week 2: 작업 & 포커스 ✅
**Day 8-10: 작업 관리**
- [x] Task API 라우트 (CRUD, today 엔드포인트)
- [x] TaskList 컴포넌트
- [x] 작업 생성/수정 폼
- [x] 우선순위 표시 (high/mid/low)
- [x] 완료 토글 기능

**Day 11-13: 포커스 모드**
- [x] FocusSession API 라우트
- [x] FocusTimer 컴포넌트
- [x] 타이머 로직 (시작/일시정지/중단/완료)
- [x] 세션 기록 저장
- [x] FocusHistory 컴포넌트 (통계)

**Day 14: Today Dashboard**
- [x] 대시보드 레이아웃 구성
- [x] 3단 레이아웃 (Goal+History / Task+Timer)
- [x] 데이터 통합 (key 기반 리렌더)
- [x] 반응형 디자인 적용

#### Week 3: 통합 & 테스트 ✅
**Day 15-17: 통합 개발**
- [x] 컴포넌트 간 데이터 연동
- [x] Goal-Task 연결 UI
- [x] Task-FocusSession 연결
- [x] 실시간 진행률 업데이트

**Day 18-19: 폴리싱**
- [x] UI/UX 개선
- [x] 로딩 상태 처리
- [x] 에러 처리 & 사용자 피드백
- [x] 브라우저 알림

**Day 20-21: 테스트 & 버그 수정**
- [x] 수동 테스트 (전체 플로우)
- [x] 작업 목록 표시 버그 수정 (타임존)
- [x] React key 중복 에러 수정
- [x] FocusSession 생성 에러 수정
- [ ] Vercel 배포 (다음 단계)

### 완료 기준 (DoD) ✅
- [x] 사용자가 회원가입/로그인 가능
- [x] 목표를 생성하고 D-day 확인 가능
- [x] 작업을 추가하고 오늘 할 일 목록 확인 가능
- [x] 포커스 타이머로 25분 집중 후 완료 기록
- [x] Today Dashboard에서 진행률과 집중 시간 확인 가능
- [x] Tailwind 반응형으로 모바일 브라우저 대응

---

## 📅 Phase 2: 일정 & 알림 확장 - ✅ 완료 (2025-01-13)

### 목표
시각적 계획 도구와 자동 리마인드 추가

### 주요 기능
- ✅ 캘린더 뷰 (월간/주간/일간) - react-big-calendar
- ✅ 칸반 보드 (Todo/In Progress/Done)
- ✅ 드래그 앤 드롭 일정 이동 - @dnd-kit
- ✅ 브라우저 푸시 알림 - Web Notifications API
- ✅ 마감일 임박 알림 함수
- ✅ 포커스 세션 완료/임박 알림
- ✅ 알림 설정 (localStorage)

### 일정 (개략)
**Week 4: 캘린더 & 칸반** ✅
- ✅ 캘린더 컴포넌트 (react-big-calendar)
- ✅ 월간/주간/일간 뷰
- ✅ 칸반 보드 컴포넌트
- ✅ 드래그 앤 드롭 (@dnd-kit/core, @dnd-kit/sortable)
- ✅ Task 상태 변경 (drag between columns)

**Week 5: 알림 시스템** ✅
- ✅ Web Notifications API 통합
- ✅ 알림 권한 요청 함수
- ✅ 알림 유틸리티 함수 (lib/notifications.ts)
- ✅ 알림 설정 localStorage 저장
- ✅ FocusTimer에 알림 통합

### 완료 기준 ✅
- [x] 캘린더에서 이번 주 일정 확인 가능
- [x] 칸반 보드에서 작업 상태 변경 가능
- [x] 드래그로 작업 날짜 변경 가능
- [x] 브라우저 알림으로 마감일 알림 수신
- [x] 포커스 세션 종료 시 알림 수신

### 배포 작업 ✅
- ✅ GitHub repository 생성 (manage-agent-app)
- ✅ Neon DB 연동 (PostgreSQL)
- ✅ Vercel 프로젝트 생성 및 환경 변수 설정
- ✅ TypeScript 빌드 에러 수정 (6개)
  - Prisma 스키마 decorator 추가
  - 관계 필드명 통일 (Goal, FocusSession)
  - Task 타입 정의 통일
  - react-big-calendar 타입 정의 설치
  - NotificationOptions vibrate 속성 제거

---

## 📊 Phase 3: 리포트 & 자동화 - 3주

### 목표
데이터 분석과 지능형 추천 기능

### 주요 기능
- 주간/월간 리포트
- 목표 달성률 추이 그래프
- 집중력 히트맵 (시간대별)
- 반복 루틴 설정
- 포커스 시간 기반 일정 추천
- 생산성 패턴 분석

### 일정 (개략)
**Week 6: 리포트 대시보드**
- Week/Month 뷰 추가
- 차트 라이브러리 통합 (recharts)
- 목표 달성률 그래프
- 집중 시간 통계

**Week 7: 히트맵 & 패턴**
- 시간대별 집중력 히트맵
- 요일별 생산성 분석
- 최적 작업 시간 추천

**Week 8: 자동화 & 루틴**
- 반복 루틴 모델 추가
- 루틴 설정 UI
- 자동 일정 추천 알고리즘
- 스마트 알림 (패턴 기반)

### 완료 기준
- [ ] 이번 주 리포트 확인 (완료율, 집중 시간)
- [ ] 히트맵에서 생산성 높은 시간대 확인
- [ ] 매일 반복 루틴 자동 생성
- [ ] "보통 10시에 집중 잘하시네요" 인사이트 표시

---

## 🔗 Phase 4: 통합 & 확장 - 2주 (선택적)

### 목표
외부 도구와 연동하여 생산성 허브 완성

### 주요 기능
- Google Calendar 연동
- Notion API 연동
- 이메일 알림
- 다기기 동기화
- 공유 기능 (목표/작업 URL)

### 완료 기준
- [ ] Google Calendar 일정 가져오기
- [ ] Notion 페이지에 작업 동기화
- [ ] 이메일로 일일 리포트 수신

---

## 🛠️ 기술 부채 & 개선 사항

### 성능 최적화
- [ ] React Query 도입 (캐싱, 자동 refetch)
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 코드 스플리팅
- [ ] DB 쿼리 최적화 (N+1 제거)

### 코드 품질
- [ ] 유닛 테스트 작성 (Jest)
- [ ] E2E 테스트 (Playwright)
- [ ] 타입 안전성 강화
- [ ] 에러 바운더리 추가

### UX 개선
- [ ] 스켈레톤 로딩
- [ ] Optimistic UI 업데이트
- [ ] 오프라인 지원 (PWA)
- [ ] 키보드 단축키

### 보안 강화
- [ ] Rate limiting
- [ ] 2FA (선택적)
- [ ] 세션 관리 개선

---

## 📋 현재 진행 상황 (2025-01-13 업데이트)

### ✅ 완료
- [x] Phase 1: 핵심 루프 구축 (MVP) - 2025-01-13
  - 인증 시스템, 목표 관리, 작업 관리, 포커스 타이머, Today Dashboard
- [x] Phase 2: 일정 & 알림 확장 - 2025-01-13
  - 캘린더 뷰, 칸반 보드, 드래그 앤 드롭, 브라우저 알림
- [x] 배포 환경 구축
  - GitHub repository (manage-agent-app)
  - Neon DB 연동
  - Vercel 프로젝트 생성

### 🔄 진행 중 (오늘)
- [ ] Vercel 프로덕션 빌드 완료 대기
- [ ] 프로덕션 환경 테스트

### 📅 다음 단계
- Phase 3: 리포트 & 자동화 준비
- 주간/월간 리포트 대시보드 설계
- 집중력 히트맵 구상

---

## 🎯 단기 목표 (이번 주)

1. **Day 1-2 (오늘 포함)**
   - Prisma 스키마 완성 및 마이그레이션
   - 인증 시스템 구현 (lib/auth.ts)
   - Auth API 라우트 4개 완성
   - Prisma 클라이언트 설정

2. **Day 3-4**
   - AuthForm 컴포넌트 개발
   - 로그인/회원가입 페이지
   - 인증 플로우 테스트

3. **Day 5-7**
   - Goal CRUD API
   - GoalPanel 컴포넌트
   - 목표 생성 모달

---

## 📊 진행률 추적

| Phase | 기능 | 상태 | 진행률 |
|-------|------|------|--------|
| Phase 1 | 데이터베이스 설계 | ✅ 완료 | 100% |
| Phase 1 | 인증 시스템 | ✅ 완료 | 100% |
| Phase 1 | 목표 관리 | ✅ 완료 | 100% |
| Phase 1 | 작업 관리 | ✅ 완료 | 100% |
| Phase 1 | 포커스 모드 | ✅ 완료 | 100% |
| Phase 1 | Today Dashboard | ✅ 완료 | 100% |
| Phase 2 | 캘린더 뷰 | ✅ 완료 | 100% |
| Phase 2 | 칸반 보드 | ✅ 완료 | 100% |
| Phase 2 | 알림 시스템 | ✅ 완료 | 100% |
| 배포 | GitHub/Neon/Vercel | 🔄 진행 중 | 95% |
| Phase 3 | 리포트 대시보드 | ⏳ 대기 | 0% |
| Phase 3 | 히트맵 & 패턴 | ⏳ 대기 | 0% |
| Phase 3 | 자동화 & 루틴 | ⏳ 대기 | 0% |

---

## 🚀 배포 전략

### 개발 환경 ✅
- 로컬 개발: `npm run dev`
- 로컬 DB: Neon DB (개발)
- Repository: https://github.com/sinn357/manage-agent-app

### 프로덕션 환경 🔄
- **호스팅**: Vercel (자동 배포 설정)
- **데이터베이스**: Neon DB (PostgreSQL)
  - Connection String: 환경 변수로 관리
  - Pooling 활성화
- **환경 변수**:
  - `DATABASE_URL`: Neon PostgreSQL connection string
  - `JWT_SECRET`: 32+ characters
- **빌드 상태**: 배포 진행 중 (TypeScript 에러 해결 완료)

---

## 📝 회의록 & 결정 사항

### 2025-01-13: Phase 2 완료 & 배포
- **완료**: 캘린더 뷰 구현 (react-big-calendar, date-fns)
- **완료**: 칸반 보드 구현 (@dnd-kit/core, @dnd-kit/sortable)
- **완료**: 알림 시스템 구현 (Web Notifications API, react-hot-toast)
- **결정**: Vercel + Neon DB 배포 아키텍처
- **해결**: TypeScript 빌드 에러 6개 수정
  1. Prisma 스키마에 @default(cuid()) 및 @updatedAt 추가
  2. focusSessions → FocusSession 관계 필드명 통일
  3. 모든 컴포넌트 Task 타입 통일 (null 허용)
  4. goal → Goal 필드명 통일
  5. @types/react-big-calendar 설치
  6. NotificationOptions vibrate 속성 제거

### 2025-01-13: 초기 설계 회의
- **결정**: my-site 방식 인증 (bcrypt + JWT + httpOnly cookies)
- **결정**: 일회성 Task 허용 (goalId nullable)
- **결정**: 중단된 포커스 세션도 기록
- **결정**: 브라우저 푸시 알림 사용
- **결정**: Context API로 상태 관리 (Phase 1)

---

## 🎉 마일스톤

- **M1**: Phase 1 MVP 완성 (3주)
- **M2**: Phase 2 캘린더 & 알림 (5주)
- **M3**: Phase 3 리포트 & 자동화 (8주)
- **M4**: Phase 4 외부 연동 (10주, 선택적)

---

## 📞 참고 자료
- ARCHITECTURE.md - 기술 상세 설계
- DEPLOYMENT.md - 배포 가이드
- README.md - 프로젝트 개요 및 설치
