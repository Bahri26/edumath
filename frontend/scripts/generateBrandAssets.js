#!/usr/bin/env node
/**
 * Matova favicon / OG PNG üretimi.
 * Çalıştır (backend sharp ile):
 *   cd backend && node ../frontend/scripts/generateBrandAssets.js
 */
const fs = require('fs');
const path = require('path');

async function main() {
  let sharp;
  try {
    sharp = require(path.join(__dirname, '..', '..', 'backend', 'node_modules', 'sharp'));
  } catch {
    try {
      sharp = require('sharp');
    } catch {
      console.error('sharp bulunamadı. backend klasöründe npm i sharp sonrası tekrar deneyin.');
      process.exit(1);
    }
  }

  const publicDir = path.join(__dirname, '..', 'public');
  const faviconSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'));
  const ogSvg = fs.readFileSync(path.join(publicDir, 'og-image.svg'));

  await sharp(faviconSvg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32.png'));
  await sharp(faviconSvg).resize(48, 48).png().toFile(path.join(publicDir, 'favicon-48.png'));
  await sharp(faviconSvg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(faviconSvg).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(faviconSvg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));
  await sharp(ogSvg).resize(1200, 630).png().toFile(path.join(publicDir, 'og-image.png'));

  console.log('Brand assets written to frontend/public/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
