# 2026-02-02 자연어 작업 생성 기능 구현

## 개요

OpenAI API를 활용하여 자연어 입력으로 작업을 생성하는 기능 추가.

---

## 구현 내용

### 1. 새로 생성한 파일

| 파일 | 설명 |
|------|------|
| `lib/openai.ts` | OpenAI 클라이언트 초기화 |
| `lib/nlParser.ts` | 프롬프트 설계 및 파싱 로직 |
| `app/api/tasks/parse-nl/route.ts` | 자연어 파싱 API 엔드포인트 |
| `components/dashboard/NLTaskInput.tsx` | 자연어 입력 + 미리보기 UI |
| `types/nlTask.ts` | ParsedTask 타입 정의 |

### 2. 수정한 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/dashboard/page.tsx` | NLTaskInput 컴포넌트 연동 |
| `package.json` | openai 패키지 추가 |

---

## 아키텍처

```
사용자 입력 (자연어)
    ↓
NLTaskInput 컴포넌트
    ↓
POST /api/tasks/parse-nl
    ↓
OpenAI API (gpt-4o-mini)
    ↓
파싱 결과 반환 (JSON)
    ↓
미리보기 UI (수정 가능)
    ↓
POST /api/tasks (기존 API)
    ↓
작업 생성 완료
```

---

## 사용 방법

### 자연어 입력 예시

| 입력 | 파싱 결과 |
|------|----------|
| "내일 오후 3시에 미팅" | title: 미팅, date: 내일, time: 15:00 |
| "영어 공부 - 높은 우선순위" | title: 영어 공부, priority: high |
| "이번주 금요일까지 보고서" | title: 보고서, date: 금요일 |
| "오늘 저녁 7시 운동 1시간" | title: 운동, time: 19:00, endTime: 20:00 |

### UI 위치

대시보드 TaskList 상단에 Quick Input 필드:
```
+--------------------------------------------------+
| ✨ 자연어로 작업 추가...                    [AI] |
+--------------------------------------------------+
```

---

## 환경변수

```env
OPENAI_API_KEY=sk-...
```

- 로컬: `.env.local`에 추가
- Vercel: Settings → Environment Variables

---

## 기타 변경사항

### 루틴 → 작업 자동 생성 기능 제거

루틴 섹션이 별도로 존재하므로 Task로 중복 생성하는 기능 제거:

- `app/api/routines/generate-tasks/route.ts` 삭제
- `RoutineList.tsx`의 "7일치 작업 생성" 버튼 제거
- DB에서 `isFromRoutine=true`인 작업 104개 삭제

---

## 커밋 이력

| 커밋 | 설명 |
|------|------|
| `e5414a5` | refactor: 루틴에서 작업 자동 생성 기능 제거 |
| `0835dec` | feat: 자연어로 작업 생성 기능 추가 (OpenAI API) |

---

**작업자**: Partner + Claude Opus 4.5
**날짜**: 2026-02-02
