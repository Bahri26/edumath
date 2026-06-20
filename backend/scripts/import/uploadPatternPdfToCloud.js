/**
 * Yerel /uploads veya crop dosyalarından pattern-pdf görsellerini Cloudinary'ye yükler.
 * Üretim MongoDB kayıtlarındaki image alanlarını kalıcı URL ile günceller.
 *
 * Gerekli env: MONGODB_URI, STORAGE_PROVIDER=cloudinary, CLOUDINARY_*
 * Onay: CONFIRM_PATTERN_PDF_CLOUD=YES node scripts/import/uploadPatternPdfToCloud.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { uploadBuffer, getStorageStatus } = require('../../services/storageService');

const CONFIRM = 'YES';
const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

const PAGE_SPLITS = {
  '5-sinif': [4, 4, 4, 4, 3, 2],
  '6-sinif': [3, 3, 3, 3, 3, 2, 2, 2],
  '7-sinif': [4, 4, 4, 4, 3, 2],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

function slugFromClass(classLevel) {
  return classLevel.replace('. Sınıf', '-sinif');
}

function cropPathForSequence(classLevel, sequenceIndex) {
  const slug = slugFromClass(classLevel);
  const splits = PAGE_SPLITS[slug];
  if (!splits) return null;
  let remaining = sequenceIndex;
  for (let pi = 0; pi < splits.length; pi += 1) {
    const count = splits[pi];
    if (remaining <= count) {
      const p = path.join(DATA_ROOT, slug, 'crops', `p${pi + 1}-s${remaining}.png`);
      return fs.existsSync(p) ? p : null;
    }
    remaining -= count;
  }
  return null;
}

function imageCropForQuestion(classLevel, sequenceIndex) {
  if (classLevel === '5. Sınıf' && sequenceIndex >= 13 && sequenceIndex <= 16) {
    const shared = path.join(DATA_ROOT, '5-sinif', 'crops', 'p4-s1.png');
    if (fs.existsSync(shared)) return shared;
  }
  return cropPathForSequence(classLevel, sequenceIndex);
}

function resolveLocalFile(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const v = imageUrl.trim();
  if (!v.startsWith('/uploads/') && !v.startsWith('uploads/')) return null;
  const rel = v.replace(/^\/?uploads\//, '');
  const full = path.join(UPLOAD_ROOT, rel);
  return fs.existsSync(full) ? full : null;
}

function isCloudUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

async function uploadFile(filePath, classLevel, seq) {
  const buffer = fs.readFileSync(filePath);
  const safeClass = classLevel.replace(/\s+/g, '-').toLowerCase();
  return uploadBuffer(buffer, {
    originalName: `${safeClass}-pattern-q${seq}.png`,
    mimeType: 'image/png',
    prefix: 'questions/pattern-pdf',
    extension: '.png',
  });
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_CLOUD || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_PDF_CLOUD=${CONFIRM} node scripts/import/uploadPatternPdfToCloud.js`);
    process.exit(1);
  }

  const storage = getStorageStatus();
  if (!storage.cloudinaryEnabled) {
    console.error('STORAGE_PROVIDER=cloudinary ve CLOUDINARY_* env değişkenleri gerekli.');
    console.error(JSON.stringify(storage, null, 2));
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const questions = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' })
    .sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex;
    const label = `${q.classLevel} #${seq}`;

    if (isCloudUrl(q.image)) {
      skipped += 1;
      console.log(`  — ${label} · zaten cloud`);
      continue;
    }

    const localFromDb = resolveLocalFile(q.image);
    const crop = imageCropForQuestion(q.classLevel, seq);
    const source = localFromDb || crop;

    if (!source) {
      failed += 1;
      console.warn(`  ✗ ${label} · kaynak dosya yok (image=${q.image || '—'})`);
      continue;
    }

    try {
      const result = await uploadFile(source, q.classLevel, seq);
      await Question.updateOne(
        { _id: q._id },
        {
          $set: {
            image: result.url,
            imageKey: result.key,
            imageProvider: result.provider,
            'assessmentMeta.cloudUploadedAt': new Date().toISOString(),
          },
        },
      );
      uploaded += 1;
      console.log(`  ✓ ${label} · ${result.url.slice(0, 72)}…`);
    } catch (err) {
      failed += 1;
      console.warn(`  ✗ ${label} · ${err.message}`);
    }
  }

  console.log(JSON.stringify({ total: questions.length, uploaded, skipped, failed }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
