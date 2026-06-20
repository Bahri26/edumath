/**
 * Cloudinary (veya yerel /uploads) soru görsellerini Google Drive'a taşır.
 * CONFIRM_MIGRATE_IMAGES_DRIVE=YES node scripts/import/migrateQuestionImagesToDrive.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { uploadBuffer, getStorageStatus } = require('../../services/storageService');

const CONFIRM = 'YES';
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

function isDriveUrl(value) {
  return typeof value === 'string' && value.includes('drive.google.com');
}

function isMigratable(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (isDriveUrl(value)) return false;
  return value.includes('cloudinary.com') || value.includes('/uploads/');
}

async function loadBufferFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function loadBufferFromLocal(relativePath) {
  const rel = relativePath.replace(/^\/?uploads\//, '');
  const full = path.join(UPLOAD_ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full);
}

async function migrateImage(currentUrl, prefix) {
  let buffer;
  let originalName = 'image.svg';

  if (/^https?:\/\//i.test(currentUrl)) {
    buffer = await loadBufferFromUrl(currentUrl);
    originalName = path.basename(new URL(currentUrl).pathname) || originalName;
  } else {
    buffer = loadBufferFromLocal(currentUrl);
    if (!buffer) throw new Error('Yerel dosya yok');
    originalName = path.basename(currentUrl);
  }

  const ext = path.extname(originalName).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';

  return uploadBuffer(buffer, {
    originalName,
    mimeType: mime,
    prefix,
    extension: ext || '.svg',
  });
}

async function main() {
  if (String(process.env.CONFIRM_MIGRATE_IMAGES_DRIVE || '').trim() !== CONFIRM) {
    console.error('CONFIRM_MIGRATE_IMAGES_DRIVE=YES node scripts/import/migrateQuestionImagesToDrive.js');
    process.exit(1);
  }

  const storage = getStorageStatus();
  if (!storage.googleDriveEnabled) {
    console.error('STORAGE_PROVIDER=gdrive gerekli');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });

  const questions = await Question.find({
    $or: [
      { image: { $regex: 'cloudinary\\.com' } },
      { image: { $regex: '^/?uploads/' } },
      { 'options.image': { $regex: 'cloudinary\\.com' } },
      { 'options.image': { $regex: '^/?uploads/' } },
    ],
  });

  let filesMigrated = 0;
  let questionsUpdated = 0;
  let failures = 0;

  for (const q of questions) {
    const updates = {};
    let changed = false;

    if (isMigratable(q.image)) {
      try {
        const result = await migrateImage(q.image, 'questions');
        updates.image = result.url;
        updates.imageKey = result.key;
        updates.imageProvider = result.provider;
        filesMigrated += 1;
        changed = true;
        console.log(`  ✓ ${q._id} ana görsel → Drive`);
      } catch (err) {
        failures += 1;
        console.warn(`  ✗ ${q._id} ana görsel: ${err.message}`);
      }
    }

    if (Array.isArray(q.options)) {
      const nextOptions = [];
      let optionsChanged = false;
      for (const opt of q.options) {
        if (!isMigratable(opt?.image)) {
          nextOptions.push(opt);
          continue;
        }
        try {
          const result = await migrateImage(opt.image, 'questions/options');
          nextOptions.push({ ...opt, image: result.url });
          filesMigrated += 1;
          optionsChanged = true;
        } catch (err) {
          failures += 1;
          console.warn(`  ✗ ${q._id} seçenek görseli: ${err.message}`);
          nextOptions.push(opt);
        }
      }
      if (optionsChanged) {
        updates.options = nextOptions;
        changed = true;
      }
    }

    if (changed) {
      await Question.updateOne({ _id: q._id }, { $set: updates });
      questionsUpdated += 1;
    }
  }

  console.log(JSON.stringify({ questionsScanned: questions.length, filesMigrated, questionsUpdated, failures }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
