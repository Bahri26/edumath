/**
 * 5. Sınıf pattern-pdf sorularını düzeltir: metin, şık, cevap, çözüm, diyagram görseli.
 * CONFIRM_GRADE5_PATTERN=YES node scripts/import/applyGrade5PatternCurated.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { uploadBuffer, getStorageStatus } = require('../../services/storageService');
const { extractDiagramBufferFromFile } = require('../../services/questionImageCropService');
const { DATA_ROOT } = require('./patternPdfRegionResolver');
const { CURATED, PAGE_DIAGRAM_CROPS, IMAGE_SOURCE } = require('./grade5PatternCurated');

const CONFIRM = 'YES';
const CLASS = '5. Sınıf';

function toOptionDocs(texts) {
  return texts.map((text) => ({
    text: String(text || '').trim(),
    image: '',
    imageKey: '',
    imageProvider: '',
  }));
}

async function extractPageDiagram(spec) {
  const pagePath = path.join(DATA_ROOT, spec.pageFile);
  if (!fs.existsSync(pagePath)) return null;
  const meta = await sharp(pagePath).metadata();
  const left = Math.floor(meta.width * (spec.leftRatio || 0));
  const top = Math.floor(meta.height * (spec.topRatio || 0));
  const width = Math.floor(meta.width * (spec.widthRatio || 0.92));
  const height = Math.floor(meta.height * (spec.heightRatio || 0.1));
  const buffer = await sharp(pagePath)
    .extract({
      left,
      top,
      width: Math.min(width, meta.width - left),
      height: Math.min(height, meta.height - top),
    })
    .png()
    .toBuffer();
  return { buffer, cropMethod: 'page-coordinate' };
}

async function resolveDiagram(seq) {
  const fix = CURATED[seq];
  if (fix?.skipImage) return null;

  const pageSpec = PAGE_DIAGRAM_CROPS[seq];
  if (pageSpec?.pageFile && !pageSpec.column && !pageSpec.file) {
    return extractPageDiagram(pageSpec);
  }

  const imgSrc = IMAGE_SOURCE[seq] || (pageSpec?.file ? { file: pageSpec.file, column: pageSpec.column } : null);
  if (imgSrc) {
    const filePath = path.join(DATA_ROOT, imgSrc.file);
    if (fs.existsSync(filePath)) {
      return extractDiagramBufferFromFile(filePath, { column: imgSrc.column || 'full' });
    }
  }

  if (pageSpec?.pageFile && pageSpec.column) {
    const filePath = path.join(DATA_ROOT, pageSpec.pageFile);
    if (fs.existsSync(filePath)) {
      return extractDiagramBufferFromFile(filePath, { column: pageSpec.column });
    }
  }

  return null;
}

async function uploadDiagram(buffer, seq) {
  return uploadBuffer(buffer, {
    originalName: `5.-sinif-pattern-q${seq}-diagram.png`,
    mimeType: 'image/png',
    prefix: 'questions/pattern-pdf',
    extension: '.png',
  });
}

async function main() {
  if (String(process.env.CONFIRM_GRADE5_PATTERN || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_GRADE5_PATTERN=${CONFIRM} node scripts/import/applyGrade5PatternCurated.js`);
    process.exit(1);
  }

  const storage = getStorageStatus();
  if (!storage.cloudinaryEnabled) {
    console.warn('STORAGE_PROVIDER=cloudinary önerilir (üretim için).');
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const questions = await Question.find({
    classLevel: CLASS,
    'assessmentMeta.importSource': 'pattern-pdf-pack',
  }).sort({ 'assessmentMeta.sequenceIndex': 1 });

  let updated = 0;
  let uploaded = 0;
  let cleared = 0;

  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex;
    const fix = CURATED[seq];
    if (!fix) {
      console.warn(`  ? #${seq} · CURATED tanımı yok`);
      continue;
    }

    const updates = {
      text: fix.text,
      options: toOptionDocs(fix.options),
      correctAnswer: fix.correctAnswer,
      solution: fix.solution || q.solution,
      visualPrompt: 'PDF şekil örüntüsü — görsele bakınız',
      'assessmentMeta.curatedAt': new Date().toISOString(),
    };

    if (fix.skipImage) {
      updates.image = '';
      updates.imageKey = '';
      updates.imageProvider = '';
      cleared += 1;
      console.log(`  ○ #${seq} · metin-only`);
    } else {
      const diagram = await resolveDiagram(seq);
      if (diagram?.buffer) {
        const result = await uploadDiagram(diagram.buffer, seq);
        updates.image = result.url;
        updates.imageKey = result.key;
        updates.imageProvider = result.provider;
        uploaded += 1;
        console.log(`  ✓ #${seq} · ${diagram.cropMethod || 'diagram'}`);
      } else {
        console.warn(`  ✗ #${seq} · görsel çıkarılamadı`);
      }
    }

    await Question.updateOne({ _id: q._id }, { $set: updates });
    updated += 1;
  }

  console.log(JSON.stringify({ updated, uploaded, cleared }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
