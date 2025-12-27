# Design System Redesign - Session 1 (2025-12-27)

## 📋 세션 개요

**목표**: manage-agent-app의 전체 디자인을 2025년 트렌드에 맞게 리뉴얼
**디자인 컨셉**: "Gradient Elevation" - Glassmorphism 2.0 + Floating Cards + Smooth Transitions
**진행 상황**: Phase 1-3 완료, Phase 4-1 부분 완료

---

## ✅ 완료된 작업

### Phase 1: 컬러 시스템 + Tailwind 설정

**파일**: `app/globals.css`

#### 새로운 컬러 팔레트
```css
/* Primary Colors */
--primary: #4f46e5 (Indigo-600)
--violet: #8b5cf6
--purple: #a855f7

/* Semantic Colors */
--success: #10b981 (Emerald-500)
--warning: #f59e0b (Amber-500)
--danger: #f43f5e (Rose-500)
--info: #0ea5e9 (Sky-500)

/* Background */
--background: #ffffff / #020617
--surface: #f8fafc / #0f172a
--border: #e2e8f0 / #1e293b

/* Text */
--foreground: #0f172a / #f8fafc
--foreground-secondary: #475569 / #cbd5e1
--foreground-tertiary: #94a3b8 / #64748b
```

#### Utility Classes 추가
- `.glass-card` - Glassmorphism 효과
- `.floating-card` - Hover 시 Lift 효과
- `.gradient-text` - 그라데이션 텍스트
- `.gradient-border` - 그라데이션 테두리

#### 기타 개선사항
- 다크모드 완벽 지원 (자동 전환)
- 커스텀 스크롤바 스타일
- Selection 스타일
- Focus-visible 스타일
- Smooth transitions (300ms cubic-bezier)

---

### Phase 2: 공통 컴포넌트 리뉴얼

#### 1. Button 컴포넌트 (`components/ui/button.tsx`)

**변경사항**:
- 그라데이션 배경 (from-primary to-violet)
- 5가지 variant: default, secondary, success, warning, danger
- Active scale 효과 (0.95배)
- Smooth transitions (300ms)
- 라운드 코너 (rounded-xl)

**Before**:
```tsx
variant="destructive" // ❌ 제거됨
```

**After**:
```tsx
variant="danger" // ✅ 새로운 이름
```

#### 2. Card 컴포넌트 (`components/ui/card.tsx`)

**변경사항**:
- Floating effect (hover 시 lift)
- 5가지 variant: default, glass, elevated, outline, gradient
- 라운드 코너 (rounded-2xl)
- Smooth hover transitions

**Before**:
```tsx
<div className="rounded-xl border bg-card">
```

**After**:
```tsx
<Card variant="default"> // hover:-translate-y-1
```

#### 3. Dialog 컴포넌트 (`components/ui/dialog.tsx`)

**변경사항**:
- Backdrop blur (bg-black/60 + backdrop-blur-sm)
- 부드러운 애니메이션 (300ms)
- 라운드 코너 (rounded-3xl)
- 닫기 버튼 스타일 개선 (rounded-full)

#### 4. Alert 컴포넌트 (`components/ui/alert.tsx`)

**변경사항**:
- Semantic colors (success, warning, danger, info)
- 라운드 코너 (rounded-2xl)
- Border 두께 증가 (2px)
- 그림자 추가 (shadow-md)

---

### Phase 3: Dashboard 레이아웃 개선

**파일**: `app/dashboard/page.tsx`

#### 주요 변경사항

1. **배경 개선**
   - 기존: 그라데이션 배경 (blue-violet-purple)
   - 변경: 차분한 `bg-surface` 컬러

2. **헤더 리뉴얼**
   - Sticky header with backdrop blur
   - 로고: 그라데이션 박스 + Sparkles 아이콘
   - 반투명 배경 (`bg-background/80 backdrop-blur-xl`)
   - 경계선 추가 (`border-b border-border`)

3. **아이콘 교체** (이모지 → Lucide Icons)
   - BarChart3 (📊 리포트)
   - Calendar (📅 캘린더)
   - Kanban (📋 칸반)
   - Settings (⚙️ 설정)
   - LogOut (로그아웃)

4. **로딩 UI 개선**
   - 모던한 이중 원형 스피너
   - 부드러운 애니메이션

5. **반응형 개선**
   - 네비게이션 텍스트: sm 이상에서만 표시
   - 모바일: 아이콘만 표시

---

### Phase 4-1: Dashboard 컴포넌트 리뉴얼 (부분 완료)

#### 1. GoalPanel 컴포넌트 (`components/dashboard/GoalPanel.tsx`)

**변경사항**:
- Card 컴포넌트 사용 (CardHeader, CardTitle, CardContent)
- Lucide Icons: Target, Plus, GripVertical
- Semantic colors (danger/warning/primary) for D-day badges
- 프로그레스바 높이 증가 (2.5px → 2.5px)
- 부드러운 애니메이션 (500ms ease-out)
- Empty state 개선 (아이콘 + 설명 + CTA)
- Skeleton loading 개선

**Before**:
```tsx
<div className="bg-white/90 backdrop-blur-lg rounded-lg">
  <h2>목표</h2>
  <button>+ 추가</button>
```

**After**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>
      <Target /> 목표
    </CardTitle>
    <Button variant="ghost" size="sm">
      <Plus /> 추가
    </Button>
```

#### 2. TaskList 컴포넌트 (`components/dashboard/TaskList.tsx`)

**변경사항**:
- Card 컴포넌트 사용
- Lucide Icons: CheckCircle2/Circle, ListTodo, ChevronDown, AlertCircle, CalendarIcon, Flame
- 체크박스: SVG → CheckCircle2/Circle 아이콘
- 작업 분류 UI 개선:
  - 오늘 할 일: 기본 열림
  - 밀린 작업: danger 테마 (`border-danger/20 bg-danger/5`)
  - 예정 작업: surface 테마
- Empty state 개선
- Skeleton loading 개선 (체크박스 포함)
- 코드 최적화 (508줄 → 473줄)

**Before**:
```tsx
<button className="w-5 h-5 rounded border-2">
  {isCompleted && <svg>...</svg>}
</button>
```

**After**:
```tsx
<button>
  {isCompleted ? (
    <CheckCircle2 className="text-success" />
  ) : (
    <Circle className="text-border hover:text-primary" />
  )}
</button>
```

---

## 📊 변경된 파일 목록

### 수정된 파일 (11개)
1. `app/globals.css` - 컬러 시스템 + Utility classes
2. `components/ui/button.tsx` - 버튼 컴포넌트
3. `components/ui/card.tsx` - 카드 컴포넌트
4. `components/ui/dialog.tsx` - 다이얼로그 컴포넌트
5. `components/ui/alert.tsx` - 알럿 컴포넌트
6. `components/ErrorBoundary.tsx` - destructive → danger
7. `components/dashboard/FocusTimer.tsx` - destructive → danger
8. `components/dashboard/GoalModal.tsx` - destructive → danger
9. `components/dashboard/LifeGoalModal.tsx` - destructive → danger
10. `components/dashboard/TaskModal.tsx` - destructive → danger
11. `app/dashboard/page.tsx` - 대시보드 레이아웃
12. `components/dashboard/GoalPanel.tsx` - 목표 패널 (리뉴얼)
13. `components/dashboard/TaskList.tsx` - 작업 목록 (리뉴얼)

### 커밋 히스토리
```
ac50268 - feat: Phase 1-2 완료 - 새로운 디자인 시스템 적용
ffcd705 - feat: Phase 3 완료 - Dashboard 레이아웃 리뉴얼
fa7d94b - feat: GoalPanel 컴포넌트 리뉴얼 (Phase 4-1 시작)
b7d4777 - feat: TaskList 컴포넌트 리뉴얼 (Phase 4-1 계속)
```

---

## 📝 다음 세션 작업 계획

### Phase 4-1: Dashboard 컴포넌트 리뉴얼 (남은 작업)

#### 1. FocusTimer 컴포넌트 ⭐ (중요)
**파일**: `components/dashboard/FocusTimer.tsx`

**작업 내용**:
- Card 컴포넌트 사용
- Lucide Icons 적용 (Play, Pause, Square, Timer 등)
- 타이머 디스플레이 개선 (더 큰 폰트, 모던한 스타일)
- 버튼 스타일 개선 (그라데이션 + 아이콘)
- 프리셋 버튼 스타일 개선
- 작업 선택 드롭다운 개선
- Empty state 추가

#### 2. FocusHistory 컴포넌트
**파일**: `components/dashboard/FocusHistory.tsx`

**작업 내용**:
- Card 컴포넌트 사용
- Lucide Icons 적용
- 세션 카드 스타일 개선
- Empty state 개선
- Skeleton loading 추가

#### 3. LifeTimeline 컴포넌트
**파일**: `components/dashboard/LifeTimeline.tsx`

**작업 내용**:
- Card 컴포넌트 사용
- Lucide Icons 적용
- 타임라인 바 스타일 개선
- Life Goal 카드 스타일 개선

#### 4. ProfileSettingsModal 컴포넌트
**파일**: `components/dashboard/ProfileSettingsModal.tsx`

**작업 내용**:
- Dialog 컴포넌트 개선 적용 확인
- 폼 스타일 개선
- 버튼 스타일 통일

---

### Phase 4-2: Modal 컴포넌트 리뉴얼

#### 1. GoalModal 컴포넌트 ⭐
**파일**: `components/dashboard/GoalModal.tsx`

**작업 내용**:
- Dialog 컴포넌트 개선 적용
- 폼 필드 스타일 개선
- 색상 선택 UI 개선
- 날짜 선택 UI 개선
- 버튼 레이아웃 개선

#### 2. TaskModal 컴포넌트 ⭐
**파일**: `components/dashboard/TaskModal.tsx`

**작업 내용**:
- Dialog 컴포넌트 개선 적용
- 폼 필드 스타일 개선
- 우선순위 선택 UI 개선
- 목표 선택 드롭다운 개선
- 날짜/시간 선택 UI 개선

#### 3. LifeGoalModal 컴포넌트
**파일**: `components/dashboard/LifeGoalModal.tsx`

**작업 내용**:
- Dialog 컴포넌트 개선 적용
- 아이콘 선택 UI 개선
- 색상 선택 UI 개선
- 날짜 범위 선택 개선

---

### Phase 5: 애니메이션 + 폴리싱

#### 1. Micro-interactions 추가
- 버튼 클릭 시 ripple 효과
- 카드 호버 시 subtle lift
- 체크박스 토글 애니메이션
- 프로그레스바 증가 애니메이션

#### 2. Loading States 개선
- Skeleton screens (shimmer 효과)
- Spinner 컴포넌트 통일
- Progressive loading

#### 3. Empty States 통일
- 일러스트 또는 아이콘
- 격려 메시지
- CTA 버튼

#### 4. 최종 폴리싱
- 모든 페이지 간격/여백 통일
- 다크모드 최종 검증
- 반응형 최종 검증
- 접근성 개선 (aria-labels, keyboard navigation)

---

## 🎨 디자인 시스템 가이드

### 컴포넌트 사용 패턴

#### Card 사용법
```tsx
// 기본 카드
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <IconComponent className="w-5 h-5 text-primary" />
      제목
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* 내용 */}
  </CardContent>
</Card>

// 로딩 상태
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-4 bg-surface rounded-lg w-3/4"></div>
          <div className="h-2.5 bg-surface rounded-full w-full"></div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>

// Empty 상태
<Card>
  <CardContent>
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
        <IconComponent className="w-8 h-8 text-foreground-tertiary" />
      </div>
      <p className="text-foreground-secondary text-sm mb-4">메시지</p>
      <Button variant="outline" size="sm">
        <Plus className="w-4 h-4" />
        CTA 텍스트
      </Button>
    </div>
  </CardContent>
</Card>
```

#### Button 사용법
```tsx
// 기본 버튼
<Button>텍스트</Button>

// 아이콘 + 텍스트
<Button variant="ghost" size="sm" className="gap-1.5">
  <Plus className="w-4 h-4" />
  추가
</Button>

// Semantic 버튼
<Button variant="success">저장</Button>
<Button variant="warning">경고</Button>
<Button variant="danger">삭제</Button>
```

#### Lucide Icons 사용법
```tsx
import { Icon1, Icon2 } from 'lucide-react';

// 기본 사용
<Icon1 className="w-5 h-5 text-primary" />

// 인터랙티브
<Icon2 className="w-4 h-4 text-foreground-tertiary hover:text-foreground-secondary" />
```

### 색상 사용 가이드

```tsx
// 텍스트
text-foreground           // 주요 텍스트
text-foreground-secondary // 보조 텍스트
text-foreground-tertiary  // 미약한 텍스트

// 배경
bg-background  // 기본 배경
bg-surface     // 카드/패널 배경
bg-border      // 구분선

// Semantic
text-success / bg-success  // 성공/완료
text-warning / bg-warning  // 경고/주의
text-danger / bg-danger    // 위험/삭제
text-info / bg-info        // 정보

// Primary
text-primary / bg-primary  // 강조/액션
```

---

## 🚀 빠른 시작 (다음 세션)

### 1. 프로젝트 상태 확인
```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/manage-agent-app
git status
git log --oneline -5
```

### 2. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000/dashboard 접속
```

### 3. FocusTimer부터 시작
```bash
# 파일 열기
code components/dashboard/FocusTimer.tsx

# 패턴 참고
# - GoalPanel.tsx (Card + Icons + Skeleton)
# - TaskList.tsx (Collapsible + Empty state)
```

### 4. 빌드 테스트
```bash
npm run build
```

---

## 📌 주의사항

1. **variant 이름 변경**
   - `destructive` → `danger` (모든 컴포넌트에서 통일)

2. **Icon import**
   ```tsx
   // ❌ 이모지 사용 금지
   📊 리포트

   // ✅ Lucide Icons 사용
   import { BarChart3 } from 'lucide-react';
   <BarChart3 className="w-5 h-5" />
   ```

3. **Card Header 패턴**
   ```tsx
   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
     <CardTitle className="flex items-center gap-2">
       <IconComponent className="w-5 h-5 text-primary" />
       제목
     </CardTitle>
     <Button variant="ghost" size="sm">
       <Plus className="w-4 h-4" />
       추가
     </Button>
   </CardHeader>
   ```

4. **애니메이션 duration**
   - 기본: 300ms
   - 프로그레스바: 500ms
   - 모두 `cubic-bezier(0.4, 0, 0.2, 1)` 사용

---

## 📈 진행률

- [x] Phase 1: 컬러 시스템 (100%)
- [x] Phase 2: 공통 컴포넌트 (100%)
- [x] Phase 3: Dashboard 레이아웃 (100%)
- [ ] Phase 4-1: Dashboard 컴포넌트 (40% - GoalPanel, TaskList 완료)
- [ ] Phase 4-2: Modal 컴포넌트 (0%)
- [ ] Phase 5: 애니메이션 + 폴리싱 (0%)

**전체 진행률**: 약 55%

---

**Last Updated**: 2025-12-27
**Next Session**: FocusTimer 컴포넌트부터 시작
