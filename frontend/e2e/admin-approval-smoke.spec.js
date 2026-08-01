import { test, expect } from '@playwright/test';
import { loginViaApi, e2eCredentials } from './helpers/auth.js';

const adminCreds = e2eCredentials('admin');

test.describe('Admin approval shell', () => {
  test.skip(!adminCreds.ready, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test('admin opens pending user approvals list', async ({ page }) => {
    await loginViaApi(page, adminCreds);
    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText(/kullanıcı onayları|user approvals/i).first()).toBeVisible();
    await expect(page.getByRole('searchbox').or(page.getByPlaceholder(/ad veya e-posta|name or email/i)).first()).toBeVisible();
  });
});
