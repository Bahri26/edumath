/**
 * Geçici / gereksiz dosya temizliği.
 * Kalıcı veri MongoDB (+ yapılandırılmış blob depolama) üzerindedir.
 *
 * Kullanım:
 *   node scripts/tools/cleanupStorage.js --dry-run          # rapor
 *   node scripts/tools/cleanupStorage.js --yes              # güvenli temizlik
 *   node scripts/tools/cleanupStorage.js --yes --import-data  # import ara dosyaları da
 *   node scripts/tools/cleanupStorage.js --yes --orphan-uploads  # DB'de referansı olmayan yerel uploads
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const AUTO_YES = argv.includes('--yes') || argv.includes('-y');
const CLEAN_IMPORT = argv.includes('--import-data');
const CLEAN_ORPHAN_UPLOADS = argv.includes('--orphan-uploads');

const ROOT = path.join(__dirname, '..', '..');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const UPLOADS = path.join(ROOT, 'uploads');
const IMPORT_ROOT = path.join(ROOT, 'data', 'pattern-pdf-import');

const INTERMEDIATE_CROP_RE = /-(fixprep|polish|sync|fin|chk|hq|x)\.png$/i;
const PREP_CROP_RE = /^prep-/i;

const TEMP_DIRS = [
  path.join(UPLOADS, 'temp'),
  path.join(ROOT, 'tmp'),
  path.join(REPO_ROOT, 'tmp'),
  path.join(REPO_ROOT, 'frontend', 'dist'),
  path.join(REPO_ROOT, 'frontend', 'test-results'),
  path.join(REPO_ROOT, 'scripts', '__pycache__'),
];

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function walkFiles(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, onFile);
    } else if (entry.isFile()) {
      onFile(full);
    }
  }
}

function removePath(targetPath, stats) {
  try {
    const st = fs.statSync(targetPath);
    if (st.isDirectory()) {
      if (DRY_RUN) {
        walkFiles(targetPath, (f) => {
          stats.files += 1;
          stats.bytes += fs.statSync(f).size;
        });
        return;
      }
      fs.rmSync(targetPath, { recursive: true, force: true });
      stats.dirs += 1;
      return;
    }
    stats.files += 1;
    stats.bytes += st.size;
    if (!DRY_RUN) fs.unlinkSync(targetPath);
  } catch (err) {
    stats.errors.push(`${targetPath}: ${err.message}`);
  }
}

function purgeDirContents(dir, stats) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.gitkeep') continue;
    removePath(path.join(dir, entry.name), stats);
  }
}

function collectImportArtifacts(stats) {
  if (!fs.existsSync(IMPORT_ROOT)) return;
  walkFiles(IMPORT_ROOT, (filePath) => {
    const base = path.basename(filePath);
    const rel = path.relative(IMPORT_ROOT, filePath);
    if (rel.includes('-test' + path.sep) || rel.startsWith('5-sinif-test') || rel.startsWith('9-sinif-test')) {
      removePath(filePath, stats);
      return;
    }
    if (INTERMEDIATE_CROP_RE.test(base) || PREP_CROP_RE.test(base)) {
      removePath(filePath, stats);
    }
  });
}

function collectLocalUploadRefsFromValue(value, refs) {
  if (value == null) return;
  if (typeof value === 'string') {
    if (value.startsWith('/uploads/')) {
      refs.add(value.replace(/^\/uploads\/?/, '').replace(/\\/g, '/'));
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectLocalUploadRefsFromValue(v, refs));
    return;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((v) => collectLocalUploadRefsFromValue(v, refs));
  }
}

async function purgeOrphanLocalUploads(stats) {
  const mongoose = require('mongoose');
  const Question = require('../../models/Question');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    stats.errors.push('MONGODB_URI yok — orphan uploads atlandı');
    return;
  }

  await mongoose.connect(uri, process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {});
  const refs = new Set(['patterns']); // seed SVG'ler korunur

  const questions = await Question.find({}, { image: 1, imageKey: 1, options: 1, assessmentMeta: 1 }).lean();
  for (const q of questions) {
    collectLocalUploadRefsFromValue(q.image, refs);
    collectLocalUploadRefsFromValue(q.imageKey, refs);
    collectLocalUploadRefsFromValue(q.options, refs);
    collectLocalUploadRefsFromValue(q.assessmentMeta, refs);
  }

  const scanRoots = ['questions', 'question-options', 'generated', 'pattern-templates', 'seed-math-bank', 'seed-pattern-bank'];
  for (const sub of scanRoots) {
    const dir = path.join(UPLOADS, sub);
    if (!fs.existsSync(dir)) continue;
    walkFiles(dir, (filePath) => {
      const rel = path.relative(UPLOADS, filePath).replace(/\\/g, '/');
      if (refs.has(rel) || [...refs].some((r) => rel.startsWith(`${r}/`))) return;
      removePath(filePath, stats);
    });
  }

  await mongoose.disconnect();
}

async function main() {
  if (!DRY_RUN && !AUTO_YES) {
    console.error('Gerçek silme için --yes ekleyin. Önce --dry-run ile rapor alın.');
    process.exit(1);
  }

  const stats = { files: 0, dirs: 0, bytes: 0, errors: [] };
  console.log(`--- Depolama temizliği ${DRY_RUN ? '(DRY RUN)' : ''} ---`);

  console.log('\n[1] Geçici klasörler');
  for (const dir of TEMP_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const rel = path.relative(REPO_ROOT, dir);
    console.log(`  → ${rel}`);
    purgeDirContents(dir, stats);
  }

  console.log('\n[2] Import ara dosyaları (fixprep/polish/sync/fin/test)');
  collectImportArtifacts(stats);

  if (CLEAN_IMPORT) {
    console.log('\n[3] Tüm pattern-pdf-import (MongoDB kaynak — yeniden PDF import mümkün)');
    if (fs.existsSync(IMPORT_ROOT)) {
      removePath(IMPORT_ROOT, stats);
    }
  }

  if (CLEAN_ORPHAN_UPLOADS) {
    console.log('\n[4] MongoDB referansı olmayan yerel uploads');
    await purgeOrphanLocalUploads(stats);
  }

  console.log('\n--- Özet ---');
  console.log(`  Dosya: ${stats.files}`);
  console.log(`  Klasör: ${stats.dirs}`);
  console.log(`  Boyut: ${fmtBytes(stats.bytes)}`);
  if (stats.errors.length) {
    console.log('  Hatalar:');
    stats.errors.forEach((e) => console.log(`    ! ${e}`));
  }
  if (DRY_RUN) {
    console.log('\nSilme için: node scripts/tools/cleanupStorage.js --yes');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
