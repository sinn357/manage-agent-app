# 주간 리뷰 페이지 구현

> **날짜**: 2026-01-19
> **커밋**: `508a170`
> **작업자**: Claude Opus 4.5

---

## 구현 내용

### 1. Prisma 스키마 (`prisma/schema.prisma`)

```prisma
model WeeklyReview {
  id              String   @id @default(cuid())
  weekStart       DateTime // 주 시작일 (월요일 00:00:00)
  weekEnd         DateTime // 주 종료일 (일요일 23:59:59)
  completedTasks  Int      @default(0)
  totalTasks      Int      @default(0)
  completionRate  Float    @default(0)
  focusMinutes    Int      @default(0)
  wins            String?  // JSON array
  challenges      String?  // JSON array
  insights        String?
  nextWeekPlan    String?  // JSON array
  mood            Int?     // 1-5 점수
  userId          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  User            User     @relation(...)

  @@unique([userId, weekStart])
  @@index([userId, weekStart])
}
```

### 2. API 엔드포인트 (`app/api/weekly-reviews/route.ts`)

| Method | 기능 |
|--------|------|
| `GET` | 특정 주 또는 이번 주 리뷰 + 통계 조회 |
| `GET ?history=true` | 최근 12주 리뷰 히스토리 |
| `POST` | 주간 리뷰 저장 (upsert) |

**자동 계산 통계:**
- 완료/전체 작업 수, 달성률
- 총 집중 시간
- 목표별 진척도
- 일별 완료 작업 수
- 미완료 작업 목록

### 3. 페이지 (`app/weekly-review/page.tsx`)

**기능:**
- 주 네비게이션 (이전/다음 주)
- 통계 개요 카드 (완료 작업, 달성률, 집중시간, 목표 수)
- 일별 완료 작업 바 차트
- 목표별 진척도 프로그레스 바
- 기분 선택 (1-5, 이모지 버튼)
- 잘한 점 / 어려웠던 점 / 인사이트 / 다음 주 계획 입력
- 미완료 작업 목록

### 4. 네비게이션 메뉴 추가

다음 페이지 헤더에 "주간리뷰" 버튼 추가:
- `app/dashboard/page.tsx`
- `app/reports/page.tsx`
- `app/calendar/page.tsx`
- `app/kanban/page.tsx`
- `app/settings/page.tsx`

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `prisma/schema.prisma` | WeeklyReview 모델 추가, User relation 추가 |
| `app/api/weekly-reviews/route.ts` | 신규 생성 |
| `app/weekly-review/page.tsx` | 신규 생성 |
| `app/dashboard/page.tsx` | CalendarDays import, 주간리뷰 버튼 추가 |
| `app/reports/page.tsx` | CalendarDays import, 주간리뷰 버튼 추가 |
| `app/calendar/page.tsx` | BarChart3 import, 주간리뷰/리포트 버튼 추가 |
| `app/kanban/page.tsx` | CalendarDays, BarChart3 import, 주간리뷰/리포트 버튼 추가 |
| `app/settings/page.tsx` | CalendarDays, BarChart3 import, 주간리뷰/리포트 버튼 추가 |

---

## 테스트 결과

- `npm run build` 성공
- `/weekly-review` 페이지 정상 생성
- `/api/weekly-reviews` API 정상 생성

---

## 스크린샷

(배포 후 추가 예정)

---

**마지막 업데이트**: 2026-01-19
