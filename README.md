# 🎯 Manage Agent App

> 목표 기반 작업 관리 및 생산성 분석 플랫폼

**배포 URL**: https://manage-agent-app.vercel.app

목표 달성을 중심으로 일정과 집중을 통합 관리하는 자기 운영 플랫폼입니다. Plan (계획) → Focus (실행) → Review (리포트)의 핵심 루프를 통해 생산성을 극대화합니다.

---

## ✨ 주요 기능

### 📊 Plan (계획)
- **목표 관리**: D-day 표시, 진행률 추적, 색상 커스터마이징
- **작업 관리**: 목표별 작업 연결, 우선순위 설정, 상태 관리
- **캘린더 뷰**: 월간/주간/일간 일정 시각화
- **칸반 보드**: 드래그 앤 드롭으로 작업 상태 변경
- **루틴 자동화**: 반복 루틴 설정 → 자동 작업 생성

### ⏱️ Focus (실행)
- **포모도로 타이머**: 25/50/90분 프리셋 + 커스텀 시간
- **작업 연결**: 타이머와 작업 연동
- **세션 기록**: 시작/종료 시간, 실제 소요 시간 저장
- **브라우저 알림**: 세션 완료/임박 시 알림

### 📈 Review (리포트)
- **리포트 대시보드**:
  - 주간/월간 통계
  - 목표 달성률 그래프
  - 집중 시간 통계
  - 작업 상태 분포
- **패턴 분석**:
  - 시간대별 집중력 히트맵 (24h × 7일)
  - 요일별 생산성 분석
  - AI 인사이트 (최적 작업 시간 추천)

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS
- **Charts**: recharts
- **Drag & Drop**: @dnd-kit
- **Calendar**: react-big-calendar
- **Notifications**: react-hot-toast

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Auth**: bcrypt + JWT (httpOnly cookies)

### Deployment
- **Hosting**: Vercel
- **Database**: Neon (Serverless PostgreSQL)
- **CI/CD**: GitHub → Vercel 자동 배포

---

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/sinn357/manage-agent-app.git
cd manage-agent-app
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열고 다음 값을 설정하세요:
```env
DATABASE_URL="postgresql://..."  # Neon DB 연결 문자열
JWT_SECRET="your-secret-key"     # 32자 이상 랜덤 문자열
```

### 4. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 동기화
npx prisma db push
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 앱을 확인하세요.

---

## 📁 프로젝트 구조

```
manage-agent-app/
├── app/
│   ├── api/                 # API 라우트
│   │   ├── auth/           # 인증 API
│   │   ├── goals/          # 목표 API
│   │   ├── tasks/          # 작업 API
│   │   ├── focus-sessions/ # 포커스 세션 API
│   │   ├── reports/        # 리포트 API
│   │   ├── analytics/      # 분석 API
│   │   └── routines/       # 루틴 API
│   ├── dashboard/          # 메인 대시보드
│   ├── calendar/           # 캘린더 페이지
│   ├── kanban/             # 칸반 보드
│   ├── reports/            # 리포트 & 분석
│   ├── settings/           # 설정 (알림 + 루틴)
│   ├── login/              # 로그인
│   └── register/           # 회원가입
├── components/
│   ├── dashboard/          # 대시보드 컴포넌트
│   ├── calendar/           # 캘린더 컴포넌트
│   ├── kanban/             # 칸반 컴포넌트
│   ├── reports/            # 리포트 컴포넌트
│   └── routines/           # 루틴 컴포넌트
├── contexts/
│   └── AuthContext.tsx     # 인증 컨텍스트
├── lib/
│   ├── auth.ts             # 인증 유틸리티
│   ├── prisma.ts           # Prisma 클라이언트
│   └── notifications.ts    # 알림 유틸리티
├── prisma/
│   └── schema.prisma       # 데이터베이스 스키마
├── ARCHITECTURE.md         # 아키텍처 문서
├── ROADMAP.md              # 개발 로드맵
└── DEVELOPMENT_HISTORY.md  # 개발 히스토리
```

---

## 📊 데이터베이스 스키마

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  username     String   @unique
  passwordHash String
  name         String?
  // Relations
  Goal         Goal[]
  Task         Task[]
  FocusSession FocusSession[]
  Routine      Routine[]
}

model Goal {
  id          String      @id @default(cuid())
  title       String
  description String?
  targetDate  DateTime?
  status      String      @default("active")
  color       String      @default("#3B82F6")
  // Relations
  Task        Task[]
  Milestone   Milestone[]
}

model Task {
  id            String         @id @default(cuid())
  title         String
  scheduledDate DateTime?
  priority      String         @default("mid")
  status        String         @default("todo")
  // Relations
  Goal          Goal?
  FocusSession  FocusSession[]
}

model FocusSession {
  id          String    @id @default(cuid())
  duration    Int
  actualTime  Int       @default(0)
  startedAt   DateTime
  endedAt     DateTime?
  completed   Boolean   @default(false)
  // Relations
  Task        Task?
}

model Routine {
  id             String   @id @default(cuid())
  title          String
  recurrenceType String   @default("daily")
  recurrenceDays String?
  timeOfDay      String?
  active         Boolean  @default(true)
}
```

---

## 🎨 주요 화면

### Dashboard
- 목표 진행률 + 오늘 할 일 + 포커스 타이머

### Calendar
- 월간/주간/일간 뷰 전환
- 작업/목표 일정 표시

### Kanban
- Todo / In Progress / Done 컬럼
- 드래그 앤 드롭 작업 이동

### Reports
- **리포트 탭**: 통계, 목표 달성률, 집중 시간 차트
- **패턴 분석 탭**: 히트맵, 요일별 생산성, AI 인사이트

### Settings
- **알림 설정**: 브라우저 알림 on/off, 마감일 알림 일수
- **루틴 관리**: 반복 루틴 생성, 자동 작업 생성

---

## 📦 주요 스크립트

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# 린트
npm run lint

# Prisma Studio (DB GUI)
npx prisma studio
```

---

## 🗺️ 개발 로드맵

### ✅ Phase 1: 핵심 루프 구축 (MVP)
- 인증, 목표, 작업, 포커스 타이머, 대시보드

### ✅ Phase 2: 일정 & 알림 확장
- 캘린더, 칸반, 브라우저 알림

### ✅ Phase 3: 리포트 & 자동화
- 리포트 대시보드, 패턴 분석, 루틴 자동화

### ⏸️ Phase 4: 통합 & 확장 (보류)
- Google Calendar, Notion, 이메일 알림, 공유 기능

자세한 내용은 [ROADMAP.md](./ROADMAP.md) 참조

---

## 📚 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 아키텍처 설계
- [ROADMAP.md](./ROADMAP.md) - 개발 로드맵
- [DEVELOPMENT_HISTORY.md](./DEVELOPMENT_HISTORY.md) - 개발 히스토리
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드

---

## 🤝 기여

이 프로젝트는 개인 프로젝트입니다. 버그 제보나 제안은 Issues를 통해 남겨주세요.

---

## 📄 라이선스

MIT License

---

## 👤 작성자

**Woocheol Shin**
- GitHub: [@sinn357](https://github.com/sinn357)
- 배포: https://manage-agent-app.vercel.app

---

**마지막 업데이트**: 2025-11-15

🤖 Built with [Claude Code](https://claude.ai/code)
