import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test.describe('Accessibility', () => {
  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('register page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/register');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should not have accessibility violations', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('task modal should not have accessibility violations', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // 작업 추가 모달 열기
    await page.click('button:has-text("+ 추가")');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation should work', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Tab 키로 네비게이션
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 포커스된 요소 확인
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // 중요한 인터랙티브 요소들이 적절한 ARIA 레이블을 가지고 있는지 확인
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // 버튼은 aria-label이나 텍스트 중 하나는 있어야 함
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
  });

  test('should support screen readers', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // main landmark 확인
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // heading hierarchy 확인
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('reports page should not have accessibility violations', async ({ page }) => {
    await login(page);
    await page.goto('/reports');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
