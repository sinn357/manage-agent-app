# 현재 앱 상태 및 구현도 — Manage Agent App

> **작성일**: 2026-02-05
> **배포 URL**: https://manage-agent-app.vercel.app
> **저장소**: GitHub → Vercel 자동 배포

---

## 1. 제품 개요

**Manage Agent App**은 개인 생산성 관리 플랫폼으로 **Plan→Focus→Review** 루프를 핵심으로 한다.

- **Plan**: 목표 설정, 태스크 분해, 일정 관리, 루틴/습관 설정
- **Focus**: 포모도로 타이머로 집중 실행, 세션 추적
- **Review**: 주간/월간 통계, 생산성 히트맵, AI 인사이트

---

## 2. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router, Turbopack) | 16.0.10 |
| 언어 | TypeScript | 5.x |
| UI | React | 19.2.3 |
| 스타일링 | Tailwind CSS | 4.x |
| 상태 관리 | TanStack React Query + Zustand | v5 / v5 |
| 폼 | React Hook Form + Zod | |
| UI 컴포넌트 | Radix UI (7개 프리미티브) | |
| 차트 | Recharts | |
| 캘린더 | react-big-calendar + react-day-picker | |
| 드래그앤드롭 | @dnd-kit | |
| AI | OpenAI API (gpt-4o-mini) | |
| ORM | Prisma | 6.16.0 |
| DB | PostgreSQL (Neon Serverless) | |
| 인증 | bcrypt + JWT (httpOnly cookie) | |
| 이미지 | Cloudinary | |
| 호스팅 | Vercel | |
| 테스트 | Vitest (단위) + Playwright (E2E) | |

**총 의존성**: 47개 (production) + 14개 (dev)

---

## 3. 코드베이스 규모

| 항목 | 수량 |
|------|------|
| TypeScript/TSX 파일 | 110개 |
| Prisma 모델 | 13개 |
| API 라우트 | 40개 |
| 페이지 | 8개 |
| 컴포넌트 | 61개 (UI 9 + 기능 52) |
| 단위 테스트 | 3개 |
| E2E 테스트 | 4개 |

---

## 4. 페이지 구조

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 홈 (랜딩) | `/` | 서비스 소개 |
| 로그인 | `/login` | 이메일+비밀번호 인증 |
| 회원가입 | `/register` | 계정 생성 |
| **대시보드** | `/dashboard` | 메인 허브 — 오늘 목표, 루틴, 태스크, 포커스 타이머, 라이프 타임라인 |
| 캘린더 | `/calendar` | 월/주/일 뷰, 태스크 일정 시각화 |
| 칸반 | `/kanban` | Todo→In Progress→Done 드래그앤드롭 |
| 리포트 | `/reports` | 통계 대시보드, 생산성 히트맵, AI 인사이트, 루틴 결과 |
| 주간 리뷰 | `/weekly-review` | 주간 회고 — 무드, 성과, 도전, 다음 주 계획 |
| 설정 | `/settings` | 알림, 루틴 관리, 아카이브, 습관 관리 |

---

## 5. 핵심 기능 구현 현황

### ✅ 완전 구현 (Production Ready)

| 기능 | 설명 | API |
|------|------|-----|
| **인증** | 이메일+비밀번호, JWT httpOnly 쿠키, 세션 유지 | 5개 라우트 |
| **목표 관리** | CRUD, D-day 카운트다운, 색상, 진행률, 정렬 | 2개 라우트 |
| **태스크 관리** | CRUD, 예약일시, 우선순위, 상태, 소프트 삭제, 아카이브(성공/실패), 복구 | 10개 라우트 |
| **포커스 타이머** | 시작/일시정지/재개/중단, 태스크 연동, 24시간 상태 보존, 브라우저 알림 | 2개 라우트 |
| **루틴** | 일간/주간/월간 반복, 완료 체크, 결과 기록 | 2개 라우트 |
| **습관 트래커** | CRUD, 완료 기록, 통계 | 5개 라우트 |
| **인생 목표** | 8개 카테고리(건강/재산/학습/커리어/관계/창의/기여/커스텀), 목표 연결 | 2개 라우트 |
| **주간 리뷰** | 자동 요약, 무드 트래커(1-5), 성과/도전/인사이트 | 1개 라우트 |
| **리포트** | 주간/월간 통계, 목표 달성률 차트, 집중시간 분석, 태스크 분포 | 1개 라우트 |
| **히트맵** | 24시간×7일 생산성 패턴, AI 최적 시간 분석 | 1개 라우트 |
| **칸반** | 3컬럼 드래그앤드롭, 아카이브, 시간 뱃지 | 프론트엔드 |
| **캘린더** | 월/주/일 뷰, 태스크 시각화 | 프론트엔드 |
| **검색** | 목표/태스크/루틴 통합 검색 | 1개 라우트 |
| **AI 자연어 파싱** | "내일 3시 미팅" → 자동 태스크 생성 (OpenAI) | 1개 라우트 |
| **자동화** | Cron: 24시간 후 완료 태스크 자동 아카이브 | 2개 라우트 |
| **라이프 타임라인** | 생년월일 + 목표수명 → 남은 일수 시각화 | 프론트엔드 |

### 🟡 부분 구현 / 개선 필요

| 기능 | 현재 상태 | 남은 작업 |
|------|----------|----------|
| 테스트 커버리지 | 단위 3개 + E2E 4개 | 핵심 비즈니스 로직 테스트 부족 |
| 온보딩 | 없음 | 신규 유저 가이드 플로우 필요 |
| 모바일 최적화 | 반응형 CSS 적용됨 | 네이티브 앱 없음, PWA 미완성 |
| Cron 자동화 | Vercel Hobby 1회/일 제한 | 루틴 결과 기록 Cron 불안정 |
| 에러 핸들링 | 기본 try-catch | 글로벌 에러 바운더리 미흡 |

### ❌ 미구현 (Phase 1에서 필요할 수 있는 기능)

| 기능 | 필요성 | 비고 |
|------|--------|------|
| 결제 시스템 | 🔴 필수 | Stripe 연동 필요 |
| 랜딩페이지 | 🔴 필수 | 현재 홈이 기본적 수준 |
| 클라이언트/프로젝트 관리 | 🟡 중요 | 솔로프레너 핵심 니즈 |
| 인보이스/수익 추적 | 🟡 중요 | 솔로프레너 차별화 |
| 외부 연동 (Google Calendar, Notion) | 🟡 중요 | 데이터 임포트/싱크 |
| 이메일 알림 | 🟢 나중에 | 브라우저 알림만 있음 |
| 다크모드 | 🟢 나중에 | next-themes 설치됨, 미적용 |
| 다국어 (i18n) | 🟢 나중에 | 현재 한국어+영어 혼재 |

---

## 6. 데이터베이스 모델 (13개)

```
User ─┬─ Goal ──── Milestone
      │    └─ Task ──── FocusSession
      ├─ LifeGoal ─── Goal (연결)
      ├─ Routine ─┬─ RoutineCheck
      │           └─ RoutineResult
      ├─ Habit ───┬─ HabitCheck
      │           └─ FocusSession
      └─ WeeklyReview
```

| 모델 | 역할 | 주요 필드 |
|------|------|----------|
| User | 인증/프로필 | email, passwordHash, birthDate, targetLifespan |
| Goal | 장기 목표 | title, targetDate, status, color, order |
| Task | 일일 태스크 | title, scheduledDate/Time, priority, status, weight |
| FocusSession | 집중 세션 | duration, actualTime, timerState, completed |
| Routine | 반복 업무 | recurrenceType, recurrenceDays, timeOfDay |
| RoutineCheck | 루틴 완료 | date, routineId (일별 체크) |
| RoutineResult | 루틴 결과 | date, status(success/failed) |
| Habit | 습관 | title, recurrenceType, defaultDuration |
| HabitCheck | 습관 체크 | date, completed, note |
| LifeGoal | 인생 목표 | category(8종), icon, color |
| WeeklyReview | 주간 리뷰 | mood, wins, challenges, completionRate |
| Milestone | 목표 하위 단계 | title, targetDate, completed |

---

## 7. API 전체 목록 (40개)

### 인증 (5)
- `POST /api/auth/register` — 회원가입
- `POST /api/auth/login` — 로그인
- `DELETE /api/auth/logout` — 로그아웃
- `GET /api/auth/check` — 인증 확인
- `GET /api/auth/me` — 유저 정보

### 목표 (2)
- `GET/POST /api/goals` — 목록/생성
- `GET/PATCH/DELETE /api/goals/[id]` — 상세/수정/삭제

### 태스크 (10)
- `GET/POST /api/tasks` — 목록/생성
- `GET /api/tasks/today` — 오늘 태스크
- `GET/PATCH/DELETE /api/tasks/[id]` — 상세/수정/삭제
- `PATCH /api/tasks/[id]/complete` — 완료 토글
- `GET /api/tasks/archived` — 아카이브 목록
- `PATCH /api/tasks/[id]/archive` — 아카이브
- `PATCH /api/tasks/[id]/unarchive` — 복구
- `GET /api/tasks/deleted` — 삭제된 태스크
- `PATCH /api/tasks/[id]/restore` — 복원
- `PATCH /api/tasks/[id]/permanent` — 영구 삭제
- `POST /api/tasks/parse-nl` — AI 자연어 파싱

### 포커스 세션 (2)
- `GET/POST /api/focus-sessions` — 목록/시작
- `GET/PATCH /api/focus-sessions/[id]` — 상세/업데이트

### 습관 (5+)
- `GET/POST /api/habits` — 목록/생성
- `PATCH/DELETE /api/habits/[id]` — 수정/삭제
- `GET /api/habits/[id]/checks` — 완료 기록
- `POST/DELETE /api/habits/[id]/check` — 체크/해제
- `GET /api/habits/[id]/stats` — 통계
- `GET /api/habits/stats` — 전체 통계

### 루틴 (2+)
- `GET/POST /api/routines` — 목록/생성
- `PATCH/DELETE /api/routines/[id]` — 수정/삭제
- `POST/DELETE /api/routines/[id]/check` — 체크/해제

### 인생 목표 (2)
- `GET/POST /api/life-goals` — 목록/생성
- `GET/PATCH/DELETE /api/life-goals/[id]` — 상세/수정/삭제

### 리포트/분석 (3)
- `GET /api/reports` — 통계 요약
- `GET /api/analytics/heatmap` — 생산성 히트맵
- `GET/POST /api/weekly-reviews` — 주간 리뷰

### 기타 (4)
- `GET /api/user/profile` — 프로필 + 라이프 통계
- `GET /api/search` — 통합 검색
- `GET/POST /api/cron/archive-tasks` — 자동 아카이브 (Cron)
- `GET/POST /api/cron/routine-results` — 루틴 결과 기록 (Cron)

---

## 8. 개발 이력 요약

| 시기 | Phase | 주요 내용 |
|------|-------|----------|
| 2025-01-13 | Phase 1 | MVP — 인증, 목표, 태스크, 포커스 타이머, 대시보드 |
| 2025-01-13 | Phase 2 | 캘린더, 칸반, 드래그앤드롭, 알림 |
| 2025-11~12 | Phase 3a | 리포트 대시보드, 히트맵, 패턴 분석 |
| 2025-12-27~28 | - | 디자인 시스템 리디자인 |
| 2026-01-09 | Phase 3b | 아카이브 시스템, 루틴 자동화, Cron |
| 2026-01-12 | - | 추가 버그픽스, 안정화 |
| 2026-01-19 | - | 주간 리뷰 자동 생성 |
| 2026-01-26 | - | 포커스 타이머 UI 개선 |
| 2026-02-02 | - | AI 자연어 태스크 생성 (최신) |

---

## 9. 인프라 & 배포

```
[사용자] → [Vercel Edge] → [Next.js App Router]
                                    │
                              ┌─────┼─────┐
                              │     │     │
                          [Pages] [API] [Cron]
                              │     │     │
                              └─────┼─────┘
                                    │
                            [Prisma ORM]
                                    │
                          [Neon PostgreSQL]

외부 연동:
- OpenAI API (자연어 파싱, AI 인사이트)
- Cloudinary (이미지)
```

- **Vercel Cron**: 매일 자정(UTC) 태스크 자동 아카이브
- **Hobby Plan 제약**: Cron 1회/일, 서버리스 함수 10초 제한

---

## 10. Phase 1 (솔로프레너 워크 OS) 전환을 위한 Gap 분석

### 있는 것 (활용 가능)
- ✅ Plan→Focus→Review 핵심 루프
- ✅ AI 자연어 태스크 생성
- ✅ 풍부한 분석/리포트
- ✅ 안정적인 인프라
- ✅ 인증 시스템

### 없는 것 (구현 필요)

| 우선순위 | 기능 | 이유 |
|---------|------|------|
| P0 | 랜딩페이지 리디자인 | 첫인상 = 전환율 |
| P0 | 온보딩 플로우 | 신규 유저 이탈 방지 |
| P0 | Stripe 결제 | 수익화 필수 |
| P1 | 클라이언트/프로젝트 관리 | 솔로프레너 핵심 차별화 |
| P1 | 수익/인보이스 대시보드 | 솔로프레너 핵심 차별화 |
| P1 | Google Calendar 연동 | 기존 워크플로우 통합 |
| P2 | PWA / 모바일 최적화 | 모바일 접근성 |
| P2 | 다크모드 완성 | UX 기본 |
| P2 | i18n (영어 우선) | 글로벌 타겟 시 필수 |
| P3 | 이메일 알림 | 리텐션 개선 |
| P3 | 소셜 공유 카드 | 바이럴 채널 |

---

*이 문서는 ChatGPT 등 외부 AI와 토론 시 컨텍스트로 활용 가능합니다.*
*Last Updated: 2026-02-05*
