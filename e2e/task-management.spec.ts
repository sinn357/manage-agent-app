import { test, expect } from '@playwright/test';

// 테스트 전에 로그인하는 헬퍼 함수
async function login(page: any) {
  const email = `test${Date.now()}@example.com`;
  const password = 'Password123';

  // 회원가입
  await page.goto('/auth/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="username"]', `testuser${Date.now()}`);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="name"]', 'Test User');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create new task', async ({ page }) => {
    // "추가" 버튼 클릭 (TaskList 컴포넌트)
    await page.click('button:has-text("+ 추가")');

    // 모달이 열렸는지 확인
    await expect(page.locator('text=/작업 추가|새 작업/i')).toBeVisible();

    // 작업 정보 입력
    await page.fill('input[name="title"]', '새로운 작업');
    await page.fill('textarea[name="description"]', '작업 설명');

    // 우선순위 선택 (React Hook Form Select 또는 일반 select)
    await page.click('text=/우선순위/i');
    await page.click('text=/높음|high/i');

    // 저장 버튼 클릭
    await page.click('button:has-text("저장")');

    // 작업이 목록에 나타나는지 확인
    await expect(page.locator('text=새로운 작업')).toBeVisible();
  });

  test('should edit existing task', async ({ page }) => {
    // 먼저 작업 생성
    await page.click('button:has-text("+ 추가")');
    await page.fill('input[name="title"]', '수정할 작업');
    await page.click('button:has-text("저장")');

    // 작업 클릭하여 모달 열기
    await page.click('text=수정할 작업');

    // 제목 수정
    await page.fill('input[name="title"]', '수정된 작업');
    await page.click('button:has-text("저장")');

    // 수정된 내용 확인
    await expect(page.locator('text=수정된 작업')).toBeVisible();
    await expect(page.locator('text=수정할 작업')).not.toBeVisible();
  });

  test('should toggle task completion', async ({ page }) => {
    // 작업 생성
    await page.click('button:has-text("+ 추가")');
    await page.fill('input[name="title"]', '완료할 작업');
    await page.click('button:has-text("저장")');

    // 체크박스 클릭 (실제 구현에 따라 선택자 조정 필요)
    const taskItem = page.locator('text=완료할 작업').locator('..');
    const checkbox = taskItem.locator('button').first();
    await checkbox.click();

    // 완료된 작업 스타일 확인 (line-through 등)
    await expect(taskItem).toHaveClass(/completed|line-through/);
  });

  test('should delete task', async ({ page }) => {
    // 작업 생성
    await page.click('button:has-text("+ 추가")');
    await page.fill('input[name="title"]', '삭제할 작업');
    await page.click('button:has-text("저장")');

    // 작업 클릭하여 모달 열기
    await page.click('text=삭제할 작업');

    // 삭제 버튼 클릭
    await page.click('button:has-text("삭제")');

    // 확인 다이얼로그 처리
    page.on('dialog', dialog => dialog.accept());

    // 작업이 목록에서 사라졌는지 확인
    await expect(page.locator('text=삭제할 작업')).not.toBeVisible();
  });

  test('should filter tasks by priority', async ({ page }) => {
    // 다양한 우선순위의 작업 생성
    const tasks = [
      { title: '높은 우선순위 작업', priority: '높음' },
      { title: '중간 우선순위 작업', priority: '중간' },
      { title: '낮은 우선순위 작업', priority: '낮음' },
    ];

    for (const task of tasks) {
      await page.click('button:has-text("+ 추가")');
      await page.fill('input[name="title"]', task.title);
      await page.click(`text=/우선순위/i`);
      await page.click(`text=/${task.priority}/i`);
      await page.click('button:has-text("저장")');
    }

    // 필터 적용 (실제 필터 UI에 따라 조정)
    await page.click('text=/필터|filter/i');
    await page.click('text=/높음|high/i');

    // 필터링 결과 확인
    await expect(page.locator('text=높은 우선순위 작업')).toBeVisible();
    await expect(page.locator('text=중간 우선순위 작업')).not.toBeVisible();
  });
});
