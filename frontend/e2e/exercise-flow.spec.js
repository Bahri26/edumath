import { test, expect } from '@playwright/test';
import { loginViaApi, e2eCredentials } from './helpers/auth.js';

const studentCreds = e2eCredentials('student');
const teacherCreds = e2eCredentials('teacher');

test.describe('Exercise flow', () => {
  test.skip(!studentCreds.ready, 'Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD');

  test('student opens study hub after login', async ({ page }) => {
    await loginViaApi(page, studentCreds);
    await page.goto('/student/study-hub');
    await expect(page).toHaveURL(/\/student\/study-hub/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('Teacher progress', () => {
  test.skip(!teacherCreds.ready, 'Set E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD');

  test('teacher opens student progress dashboard', async ({ page }) => {
    await loginViaApi(page, teacherCreds);
    await page.goto('/teacher/student-progress');
    await expect(page).toHaveURL(/\/teacher\/student-progress/);
    await expect(page.getByRole('heading', { name: /öğrenci takibi|student progress/i })).toBeVisible();
  });
});

test.describe('Public shell', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation').or(page.locator('nav'))).toBeVisible();
  });
});
