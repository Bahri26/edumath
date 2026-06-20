import { test, expect } from '@playwright/test';

test.describe('Accessibility smoke', () => {
  test('landing exposes skip link to main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /ana içeriğe atla|skip to main content/i });
    await expect(skip).toBeFocused();
    await skip.click();
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('login modal has dialog semantics when opened', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /giriş|login/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
