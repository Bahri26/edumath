const fs = require('fs');
const playwright = require('playwright');

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:5173';
  const out = process.cwd();
  try {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    console.log('Opening student dashboard...');
    await page.goto(`${base}/student/dashboard`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'student-dashboard.png', fullPage: true });
    console.log('Saved student-dashboard.png');

    console.log('Opening teacher dashboard...');
    await page.goto(`${base}/teacher/dashboard`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'teacher-dashboard.png', fullPage: true });
    console.log('Saved teacher-dashboard.png');

    await browser.close();
    fs.writeFileSync('visual_qa_result.json', JSON.stringify({ student: 'student-dashboard.png', teacher: 'teacher-dashboard.png' }, null, 2));
    console.log('Visual QA finished.');
  } catch (err) {
    console.error('Visual QA failed:', err.message);
    process.exit(1);
  }
})();
