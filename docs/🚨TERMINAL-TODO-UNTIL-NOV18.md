# 🚨🚨🚨 터미널 Claude 작업 지시서 - 11월 18일까지만 유효 🚨🚨🚨

**⏰ 작업 기한: 2025년 11월 18일까지**
**📝 작성일: 2025년 11월 16일**

---

## 📋 작업 요약

웹 Claude가 개발한 기능을 로컬로 가져와서 DB 마이그레이션을 실행하고 main 브랜치에 통합하는 작업입니다.

---

## 🎯 수행할 작업 (3단계)

### 1️⃣ 브랜치 가져오기

```bash
git fetch origin
git checkout claude/dashboard-focus-timer-fixes-013Zw6qdVWGBzvV7UGxec9Vn
git pull origin claude/dashboard-focus-timer-fixes-013Zw6qdVWGBzvV7UGxec9Vn
```

### 2️⃣ 데이터베이스 마이그레이션 실행

```bash
npx prisma db push
```

**예상 변경사항:**
- `Task` 테이블에 `scheduledTime` 컬럼 추가
- `FocusSession` 테이블에 `timeLeft`, `timerState`, `lastUpdatedAt` 컬럼 추가
- 인덱스 추가: `FocusSession(userId, timerState)`

### 3️⃣ Main 브랜치에 통합 및 푸시

```bash
git checkout main
git pull origin main
git merge claude/dashboard-focus-timer-fixes-013Zw6qdVWGBzvV7UGxec9Vn
git push origin main
```

---

## ✅ 성공 확인

다음 사항을 확인해주세요:

- [ ] `npx prisma db push` 명령어가 에러 없이 완료되었는가?
- [ ] `git merge` 과정에서 충돌이 없었는가?
- [ ] `git push origin main` 이 성공했는가?

---

## 🔍 구현된 기능 (참고용)

이번 작업으로 추가된 기능들:

1. **대시보드 TaskList 섹션 분리**
   - 오늘 할 일 (파란색 강조)
   - 밀린 작업 (빨간색, 접기/펼치기)
   - 예정 작업 (회색, 접기/펼치기)

2. **포커스 타이머 영구 저장**
   - DB에 타이머 상태 저장
   - 페이지 이동/새로고침해도 유지
   - 5초마다 자동 저장

3. **작업 시간 설정 기능**
   - TaskModal에 시간 입력 필드 추가
   - 캘린더에서 정확한 시간에 작업 표시

4. **캘린더 작업 겹침 문제 해결**
   - 시간 설정된 작업: 해당 시간에 1시간 블록으로 표시
   - 시간 미설정 작업: 하루 종일 이벤트로 표시

---

## ⚠️ 문제 발생 시

### 마이그레이션 에러가 발생하면

```bash
# 스키마와 DB 상태 확인
npx prisma db pull

# 문제가 있다면 강제 동기화
npx prisma db push --force-reset  # ⚠️ 데이터 삭제됨!
```

### Merge 충돌 발생 시

```bash
# 충돌 확인
git status

# 충돌 해결 후
git add .
git commit -m "Merge branch 'claude/dashboard-focus-timer-fixes-013Zw6qdVWGBzvV7UGxec9Vn' into main"
git push origin main
```

---

## 📝 작업 완료 후

이 파일은 **11월 18일 이후 삭제**해주세요:

```bash
git rm docs/🚨TERMINAL-TODO-UNTIL-NOV18.md
git commit -m "docs: 완료된 터미널 작업 지시서 삭제"
git push origin main
```

---

## 💬 추가 참고사항

- **웹 Claude**: 코드 개발, 버그 수정, 문서 작성 (토큰 많음)
- **터미널 Claude**: 명령어 실행, DB 작업, main 관리 (토큰 적음)

**협업 원칙:**
- 웹 Claude가 feature 브랜치에서 개발
- 터미널 Claude가 마이그레이션 & main 통합

---

**📌 이 파일을 읽었다면 위의 3단계 작업을 순서대로 진행해주세요!**

---

**작성자**: 웹 Claude
**수신자**: 터미널 Claude
**기한**: 2025년 11월 18일까지
