/**
 * İlkokul örüntü SVG görsellerini Google Drive'a yükler ve MongoDB kayıtlarını günceller.
 *
 * Gerekli env: MONGODB_URI, STORAGE_PROVIDER=gdrive, GOOGLE_DRIVE_*
 * Onay: CONFIRM_PATTERN_SVG_DRIVE=YES node scripts/import/uploadPatternSvgsToDrive.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { uploadBuffer, getStorageStatus } = require('../../services/storageService');

const CONFIRM = 'YES';
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const DRIVE_PREFIX = 'questions/pattern-svg';

function normalizeLocalPath(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/uploads/') && !trimmed.startsWith('uploads/')) return null;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function resolveLocalFile(localPath) {
  const rel = localPath.replace(/^\/?uploads\//, '');
  const full = path.join(UPLOAD_ROOT, rel);
  return fs.existsSync(full) ? full : null;
}

function inferMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

async function uploadLocalSvg(filePath, baseName) {
  const buffer = fs.readFileSync(filePath);
  return uploadBuffer(buffer, {
    originalName: `${baseName}.svg`,
    mimeType: inferMimeType(filePath),
    prefix: DRIVE_PREFIX,
    extension: '.svg',
  });
}

function collectLocalPaths(questions) {
  const paths = new Set();
  for (const q of questions) {
    const main = normalizeLocalPath(q.image);
    if (main) paths.add(main);
    for (const opt of q.options || []) {
      const optPath = normalizeLocalPath(opt.image);
      if (optPath) paths.add(optPath);
    }
  }
  return [...paths];
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_SVG_DRIVE || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_SVG_DRIVE=${CONFIRM} node scripts/import/uploadPatternSvgsToDrive.js`);
    process.exit(1);
  }

  const storage = getStorageStatus();
  if (!storage.googleDriveEnabled) {
    console.error('STORAGE_PROVIDER=gdrive ve GOOGLE_DRIVE_* env değişkenleri gerekli.');
    console.error(JSON.stringify(storage, null, 2));
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });

  const questions = await Question.find({
    $or: [
      { image: { $regex: '^/?uploads/patterns/' } },
      { 'options.image': { $regex: '^/?uploads/patterns/' } },
      { image: { $regex: '^https://res\\.cloudinary\\.com/' } },
      { 'options.image': { $regex: '^https://res\\.cloudinary\\.com/' } },
    ],
  }).lean();

  const localPaths = collectLocalPaths(questions);
  const urlMap = new Map();
  let uploaded = 0;
  let failed = 0;

  for (const localPath of localPaths) {
    const filePath = resolveLocalFile(localPath);
    if (!filePath) {
      failed += 1;
      console.warn(`  ✗ dosya yok: ${localPath}`);
      continue;
    }

    const baseName = path.basename(filePath, path.extname(filePath));
    try {
      const result = await uploadLocalSvg(filePath, baseName);
      urlMap.set(localPath, result);
      urlMap.set(localPath.replace(/^\//, ''), result);
      uploaded += 1;
      console.log(`  ✓ ${localPath} → ${result.url}`);
    } catch (err) {
      failed += 1;
      console.warn(`  ✗ ${localPath} · ${err.message}`);
    }
  }

  let questionsUpdated = 0;
  for (const q of questions) {
    const updates = {};
    let optionChanged = false;
    const nextOptions = (q.options || []).map((opt) => {
      const optPath = normalizeLocalPath(opt.image);
      if (!optPath) return opt;
      const mapped = urlMap.get(optPath);
      if (!mapped) return opt;
      optionChanged = true;
      return { ...opt, image: mapped.url };
    });

    const mainPath = normalizeLocalPath(q.image);
    if (mainPath) {
      const mapped = urlMap.get(mainPath);
      if (mapped) {
        updates.image = mapped.url;
        updates.imageKey = mapped.key;
        updates.imageProvider = mapped.provider;
      }
    }

    if (optionChanged) {
      updates.options = nextOptions;
    }

    if (Object.keys(updates).length === 0) continue;

    await Question.updateOne({ _id: q._id }, { $set: updates });
    questionsUpdated += 1;
  }

  console.log(JSON.stringify({
    questionsWithLocalPaths: questions.length,
    uniqueLocalPaths: localPaths.length,
    filesUploaded: uploaded,
    fileFailures: failed,
    questionsUpdated,
  }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
