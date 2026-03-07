const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = process.argv[2] || 'http://localhost:5174/';
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'networkidle' });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  // Try clicking the logo container
  try {
    // Click the logo by text to avoid ambiguous selectors
      const el = await page.$('text=EduMath');
      if (el) {
        const html = await el.evaluate(node => node.outerHTML);
        console.log('Logo element outerHTML:', html.substring(0, 400));
      } else {
        console.log('Logo element not found by text selector');
      }
      // Try clicking the parent container that has the click handler
      await page.click('nav div.cursor-pointer');
    await page.waitForTimeout(500);
    console.log('After click location:', page.url());
  } catch (e) {
    console.error('Click failed:', e.message);
  }
  await browser.close();
})();