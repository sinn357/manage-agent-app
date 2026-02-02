# Manage Agent App Changelog

## 2026-02-02

### Added
- **자연어 작업 생성 기능** (OpenAI API 연동)
  - `POST /api/tasks/parse-nl` 엔드포인트
  - `NLTaskInput` 컴포넌트 (대시보드 TaskList 상단)
  - 한국어 날짜/시간/우선순위 자동 파싱
  - 미리보기 + 수정 후 생성 플로우

### Removed
- 루틴에서 작업 자동 생성 기능 제거 (루틴은 RoutineCheck로만 관리)
  - `generate-tasks` API 삭제
  - RoutineList "7일치 작업 생성" 버튼 제거
  - 기존 isFromRoutine 작업 104개 정리

---

## 2025-11-17

### Fixed
- Dashboard focus timer 수정

---

## Earlier

### Phase 1 완료
- 기본 작업 관리 시스템 구축
- Kanban 보드
- 포모도로 타이머

---

**Last Updated**: 2026-02-02
