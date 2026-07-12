import { test, expect } from '@playwright/test';
import { loginViaApi, e2eCredentials } from './helpers/auth.js';
import {
  createSmokeExamPack,
  cleanupSmokeExamPack,
} from './helpers/api.js';

const studentCreds = e2eCredentials('student');
const teacherCreds = e2eCredentials('teacher');
const runFullExam = process.env.E2E_RUN_EXAM_FLOW === '1';

test.describe('Teacher / student shells', () => {
  test.skip(!teacherCreds.ready, 'Set E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD');

  test('teacher opens question bank', async ({ page }) => {
    await loginViaApi(page, teacherCreds);
    await page.goto('/teacher/questions');
    await expect(page).toHaveURL(/\/teacher\/questions/);
    await expect(page.getByRole('button', { name: /soru ekle|add question/i }).first()).toBeVisible();
  });
});

test.describe('Student quizzes shell', () => {
  test.skip(!studentCreds.ready, 'Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD');

  test('student opens quizzes list', async ({ page }) => {
    await loginViaApi(page, studentCreds);
    await page.goto('/student/quizzes');
    await expect(page).toHaveURL(/\/student\/quizzes/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('Full exam flow', () => {
  test.skip(!runFullExam, 'Set E2E_RUN_EXAM_FLOW=1 to run teacher→student exam UI');
  test.skip(!teacherCreds.ready || !studentCreds.ready, 'Teacher and student E2E credentials required');

  test('student completes smoke exam and sees result', async ({ page }) => {
    const pack = await createSmokeExamPack({
      classLevel: process.env.E2E_CLASS_LEVEL || '9. Sınıf',
    });

    try {
      await loginViaApi(page, studentCreds);
      await page.goto(`/student/quizzes?start=${pack.examId}`);

      for (let i = 0; i < 21; i += 1) {
        const optionFour = page.locator('label').filter({ hasText: /B\)\s*4/ });
        await expect(optionFour.first()).toBeVisible();
        await optionFour.first().click();

        if (i < 20) {
          await page.getByRole('button', { name: /ileri|next/i }).click();
        } else {
          await page.getByRole('button', { name: /bitir|finish/i }).click();
          const confirm = page.getByRole('button', { name: /evet|yes/i });
          await expect(confirm.first()).toBeVisible({ timeout: 10_000 });
          await confirm.first().click();
        }
      }

      await expect(page.getByText(/sınav tamamlandı|exam complete|başarılı tamamlandı/i).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole('button', { name: /yazdır|pdf/i }).or(page.getByText(/yazdır \/ pdf/i))).toBeVisible();
    } finally {
      await cleanupSmokeExamPack(pack);
    }
  });
});
