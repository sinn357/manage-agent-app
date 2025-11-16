import { test, expect } from '@playwright/test';

async function login(page: any) {
  const email = `test${Date.now()}@example.com`;
  const password = 'Password123';

  await page.goto('/auth/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="username"]', `testuser${Date.now()}`);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="name"]', 'Test User');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

test.describe('Focus Timer', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should select preset duration', async ({ page }) => {
    // 25분 프리셋 버튼 클릭
    const preset25 = page.locator('button:has-text("25")').first();
    await preset25.click();

    // 타이머 디스플레이 확인 (25:00)
    await expect(page.locator('text=/25:00|25 : 00/')).toBeVisible();
  });

  test('should start and pause timer', async ({ page }) => {
    // 25분 프리셋 선택
    await page.locator('button:has-text("25")').first().click();

    // 시작 버튼 클릭
    await page.click('button:has-text("시작")');

    // 타이머 실행 중 상태 확인
    await expect(page.locator('text=/집중 중|Running/')).toBeVisible();
    await expect(page.locator('button:has-text("일시정지")')).toBeVisible();

    // 일시정지 클릭
    await page.click('button:has-text("일시정지")');

    // 일시정지 상태 확인
    await expect(page.locator('button:has-text("재개")')).toBeVisible();
  });

  test('should stop timer', async ({ page }) => {
    // 타이머 시작
    await page.locator('button:has-text("25")').first().click();
    await page.click('button:has-text("시작")');

    // 중단 버튼 클릭
    await page.click('button:has-text("중단")');

    // idle 상태로 복귀 확인
    await expect(page.locator('button:has-text("시작")')).toBeVisible();
  });

  test('should enter custom duration', async ({ page }) => {
    // 커스텀 입력 필드 찾기
    const customInput = page.locator('input[type="number"]').first();

    // 커스텀 시간 입력 (10분)
    await customInput.fill('10');

    // 시작 버튼 클릭
    await page.click('button:has-text("시작")');

    // 타이머가 10분으로 시작되었는지 확인
    await expect(page.locator('text=/10:00|10 : 00/')).toBeVisible();
  });

  test('should link task to timer', async ({ page }) => {
    // 먼저 작업 생성
    await page.click('button:has-text("+ 추가")');
    await page.fill('input[name="title"]', '집중할 작업');
    await page.click('button:has-text("저장")');

    // 타이머에서 작업 선택 (select 또는 드롭다운)
    await page.click('text=/작업 선택|Select Task/i');
    await page.click('text=집중할 작업');

    // 선택된 작업 표시 확인
    await expect(page.locator('text=집중할 작업')).toBeVisible();
  });

  test('should display focus session history', async ({ page }) => {
    // 1분 타이머로 빠른 테스트
    const customInput = page.locator('input[type="number"]').first();
    await customInput.fill('1');
    await page.click('button:has-text("시작")');

    // 1분 대기 (실제로는 너무 길어서 타이머를 빠르게 완료하도록 수정 필요)
    // 또는 API를 통해 완료된 세션 직접 생성

    // 히스토리 섹션 확인
    await expect(page.locator('text=/히스토리|History|최근 세션/i')).toBeVisible();
  });

  test('should show timer state persistence', async ({ page }) => {
    // 타이머 시작
    await page.locator('button:has-text("25")').first().click();
    await page.click('button:has-text("시작")');

    // 페이지 새로고침
    await page.reload();

    // 타이머가 계속 실행 중인지 확인
    await expect(page.locator('text=/집중 중|Running/')).toBeVisible();
  });

  test('should complete timer and show notification', async ({ page }) => {
    // 매우 짧은 타이머 (1초) - 실제 구현에서는 최소값 체크 필요
    const customInput = page.locator('input[type="number"]').first();

    // 참고: 실제 앱에서 1분 미만을 허용하지 않을 수 있음
    await customInput.fill('1');
    await page.click('button:has-text("시작")');

    // 타이머 완료 대기 (61초)
    await page.waitForTimeout(61000);

    // 완료 알림 또는 메시지 확인
    await expect(page.locator('text=/완료|Completed|수고하셨습니다/')).toBeVisible();
  });
});
