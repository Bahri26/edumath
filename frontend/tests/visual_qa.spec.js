const { test } = require('@playwright/test');
const fs = require('fs');

test('take screenshots of student and teacher dashboards', async ({ page }) => {
  // Adjust the base URL if running dev server; here we assume local server runs on 5173
  const base = process.env.BASE_URL || 'http://localhost:5173';

  // Student dashboard
  await page.goto(`${base}/student/dashboard`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'student-dashboard.png', fullPage: true });

  // Teacher dashboard
  await page.goto(`${base}/teacher/dashboard`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'teacher-dashboard.png', fullPage: true });

  // Save result metadata
  fs.writeFileSync('visual_qa_result.json', JSON.stringify({ student: 'student-dashboard.png', teacher: 'teacher-dashboard.png' }, null, 2));
});
