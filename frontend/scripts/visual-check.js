const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const url = process.argv[2] || 'http://localhost:5173/';
  console.log('Capturing screenshots for', url);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Desktop
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, 'home-desktop.png'), fullPage: true });
  console.log('Saved', 'home-desktop.png');

  // Tablet (portrait)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, 'home-tablet.png'), fullPage: true });
  console.log('Saved', 'home-tablet.png');

  // Mobile (iPhone-like)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outDir, 'home-mobile.png'), fullPage: true });
  console.log('Saved', 'home-mobile.png');

  await browser.close();
  console.log('Done. Screenshots saved to', outDir);
})();
