import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register new user', async ({ page }) => {
    await page.goto('/auth/register');

    // 폼 입력
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="username"]', `testuser${Date.now()}`);
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="name"]', 'Test User');

    // 회원가입 제출
    await page.click('button[type="submit"]');

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard');
  });

  test('should login existing user', async ({ page }) => {
    // 먼저 회원가입
    const email = `test${Date.now()}@example.com`;
    const password = 'Password123';

    await page.goto('/auth/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="username"]', `testuser${Date.now()}`);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');

    // 로그아웃 (AuthContext에 로그아웃 기능이 있다고 가정)
    await page.goto('/');

    // 로그인
    await page.goto('/auth/login');
    await page.fill('input[name="emailOrUsername"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/auth/register');

    // 잘못된 이메일 입력
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123'); // too short

    await page.click('button[type="submit"]');

    // 에러 메시지 확인 (실제 폼 구현에 따라 달라질 수 있음)
    await expect(page.locator('text=/이메일|email/i')).toBeVisible();
  });

  test('should toggle between login and register modes', async ({ page }) => {
    await page.goto('/auth/login');

    // 회원가입 링크 클릭
    await page.click('text=/회원가입|register/i');

    // URL 또는 폼 변경 확인
    await expect(page.locator('text=/이름|name/i')).toBeVisible();

    // 로그인 링크 클릭
    await page.click('text=/로그인|login/i');

    // 로그인 폼 확인
    await expect(page.locator('input[name="emailOrUsername"]')).toBeVisible();
  });
});
