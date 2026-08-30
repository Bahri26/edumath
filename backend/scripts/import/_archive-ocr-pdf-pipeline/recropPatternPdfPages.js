/**
 * Sayfa görüntülerinden soru kırpmalarını yeniden üretir (sayfa başına gerçek soru bandı).
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');

const PAGE_SPLITS = {
  '5-sinif': [4, 4, 4, 4, 3, 2],
  '6-sinif': [3, 3, 3, 3, 3, 2, 2, 2],
  '7-sinif': [4, 4, 4, 4, 3, 2],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

/** Sayfadaki tahmini toplam soru sayısı (dikey bant) */
const PAGE_BAND_COUNT = {
  '5-sinif': [6, 5, 5, 5, 4, 3],
  '6-sinif': [4, 4, 4, 4, 4, 3, 3, 3],
  '7-sinif': [5, 5, 5, 5, 4, 3],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

const HEADER_RATIO = { '9-sinif': 0.12, default: 0.085 };
const FOOTER_RATIO = { '9-sinif': 0.09, default: 0.06 };

async function recropSlug(slug) {
  const dir = path.join(DATA_ROOT, slug);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const outDir = path.join(dir, 'crops');
  fs.mkdirSync(outDir, { recursive: true });

  const splits = PAGE_SPLITS[slug] || [];
  const bands = PAGE_BAND_COUNT[slug] || splits;
  const headerR = HEADER_RATIO[slug] || HEADER_RATIO.default;
  const footerR = FOOTER_RATIO[slug] || FOOTER_RATIO.default;

  for (const pageMeta of manifest.pages) {
    const pageIdx = pageMeta.page - 1;
    const take = splits[pageIdx] || 4;
    const totalBands = bands[pageIdx] || take;
    const imagePath = path.join(dir, pageMeta.image);
    const meta = await sharp(imagePath).metadata();
    const header = Math.floor(meta.height * headerR);
    const footer = Math.floor(meta.height * footerR);
    const contentH = meta.height - header - footer;
    const bandH = contentH / totalBands;

    for (let s = 1; s <= take; s += 1) {
      const top = Math.floor(header + (s - 1) * bandH);
      const height = Math.ceil(bandH - 2);
      const outPath = path.join(outDir, `p${pageMeta.page}-s${s}.png`);
      await sharp(imagePath)
        .extract({ left: 0, top, width: meta.width, height: Math.min(height, meta.height - top) })
        .png()
        .toFile(outPath);
    }
  }
}

async function recropAll() {
  for (const slug of Object.keys(PAGE_SPLITS)) {
    const dir = path.join(DATA_ROOT, slug);
    if (fs.existsSync(path.join(dir, 'manifest.json'))) {
      await recropSlug(slug);
      console.log('recrop:', slug);
    }
  }
}

module.exports = { recropAll, recropSlug, cropPathForSequence: null };
