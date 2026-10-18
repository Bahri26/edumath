/**
 * Doktora tezi örüntü PDF paketlerinden (5-6-7-9. sınıf) ELLE ÇIKARILMIŞ VE
 * DOĞRULANMIŞ soruları (backend/data/pattern-pdf-import/*.json) veritabanına aktarır.
 *
 * Bu script eski `importPatternPdfPack.js` pipeline'ından FARKLIDIR:
 *  - PDF'leri yeniden OCR/AI ile OKUMAZ; zaten elle doğrulanmış JSON verisini kullanır
 *    (zorluk = gerçek KTT/YGT/BTT renk koduna göre, sıraya göre DEĞİL)
 *  - Varsayılan olarak HİÇBİR ŞEYİ SİLMEZ — eski script'in aksine, mevcut "Örüntüler"
 *    sorularına (başka bir pipeline'dan gelmiş olabilir) DOKUNMAZ
 *  - Sadece kendi eklediği kayıtları (assessmentMeta.importSource = IMPORT_TAG) hedef
 *    alarak aynı soru kimlikleriyle yeniden çalıştırılabilir (silmeden upsert)
 *  - Bir sorunun JSON'unda "diagramFile" alanı varsa (örn. "5-sinif/ktt-q03.png"),
 *    o dosyayı backend/data/pattern-pdf-import/ altından okuyup mevcut
 *    STORAGE_PROVIDER'a (Drive/Cloudinary) yükler ve image/imageKey/imageProvider'ı
 *    otomatik doldurur — elle görsel eklemeye gerek kalmaz.
 *
 * Kullanım:
 *   # 1) İnceleme / dry-run — HİÇBİR ŞEY YAZMAZ, sadece rapor basar
 *   node scripts/import/importExtractedPatternQuestions.js
 *
 *   # 2) Gerçek aktarım
 *   CONFIRM_EXTRACTED_PATTERN_IMPORT=YES node scripts/import/importExtractedPatternQuestions.js
 *
 * Ortam değişkenleri:
 *   EXTRACTED_PATTERN_GRADES        virgülle sınıf filtresi, örn: "5,9" (boş = hepsi)
 *   --local-preview                veritabanına bağlanmadan tüm paketleri doğrular
 *   EXTRACTED_PATTERN_CREATE_EXAM   true|false (varsayılan true) — sınıf başına, yalnızca
 *                                   paketin tüm sorularını içeren bir inceleme sınavı oluşturur/günceller
 *   SEED_TEACHER_EMAIL              createdBy için öğretmen e-postası (opsiyonel)
 *   MONGODB_URI / MONGO_URI         DB aktarımı ve DB önizlemesi için zorunlu
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const Exam = require('../../models/Exam');
const User = require('../../models/User');
const { uploadBuffer } = require('../../services/storageService');
const { sourceIdentity, validatePack } = require('./extractedPatternPack');

const IMPORT_TAG = 'pattern-pdf-extracted-2026-08';
const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');

const FILES = [
  { slug: '5-sinif', file: '5-sinif-extracted.json' },
  { slug: '6-sinif', file: '6-sinif-extracted.json' },
  { slug: '7-sinif', file: '7-sinif-extracted.json' },
  { slug: '9-sinif', file: '9-sinif-extracted.json' },
];

function loadJson(slug, file) {
  const p = path.join(DATA_ROOT, file);
  if (!fs.existsSync(p)) {
    throw new Error(`Bulunamadı: ${p} (önce backend/data/pattern-pdf-import altına kopyalayın)`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function uploadDiagramIfAny(q, { slug, classLevel }, warnings) {
  if (!q.hasVisual) return { image: '', imageKey: '', imageProvider: '', uploaded: false };

  const relFile = q.diagramFile;
  if (!relFile) {
    warnings.push(
      `${slug} · sayfa ${q.page ?? '?'} · soru ${q.questionNumber ?? '?'}: görsel/diyagram bekliyor ama diagramFile alanı yok (image boş kalacak).`
    );
    throw new Error(`${slug}: diagramFile eksik`);
  }

  const filePath = path.join(DATA_ROOT, relFile);
  if (!fs.existsSync(filePath)) {
    warnings.push(
      `${slug} · sayfa ${q.page ?? '?'} · soru ${q.questionNumber ?? '?'}: diyagram dosyası bulunamadı (${relFile}) — image boş kalacak.`
    );
    throw new Error(`${slug}: görsel bulunamadı: ${relFile}`);
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const safeClass = classLevel.replace(/\s+/g, '-').toLowerCase();
    const uploaded = await uploadBuffer(buffer, {
      originalName: `${safeClass}-pattern-p${q.page}-q${q.questionNumber}.png`,
      mimeType: 'image/png',
      prefix: 'questions/pattern-pdf-extracted',
      extension: '.png',
    });
    return { image: uploaded.url, imageKey: uploaded.key, imageProvider: uploaded.provider, uploaded: true };
  } catch (uploadErr) {
    warnings.push(
      `${slug} · sayfa ${q.page ?? '?'} · soru ${q.questionNumber ?? '?'}: diyagram yüklenemedi (${uploadErr.message}) — image boş kalacak.`
    );
    throw new Error(`${slug}: görsel yüklenemedi: ${uploadErr.message}`);
  }
}

async function buildQuestionDoc(q, { classLevel, mebReference, createdBy, slug }, warnings) {
  const options = (q.options || []).map((text) => ({
    text: String(text || ''),
    image: '',
    imageKey: '',
    imageProvider: '',
  }));

  let correctAnswer = String(q.correctAnswer || '').trim();
  let needsReview = Boolean(q.needsReview);
  if (!correctAnswer) {
    throw new Error(`${sourceIdentity(slug, q)}: doğru cevap eksik`);
  }

  const { image, imageKey, imageProvider, uploaded } = await uploadDiagramIfAny(q, { slug, classLevel }, warnings);

  const visualNotes = [];
  if (q.hasVisual && !uploaded) {
    visualNotes.push(
      'Bu soru PDF’de bir görsel/diyagram içeriyor. Bu aktarımda gerçek diyagram görseli YÜKLENMEDİ ' +
        '— öğretmen panelinden orijinal PDF’e bakarak görseli ekleyin.'
    );
  }
  if (needsReview && correctAnswer) {
    visualNotes.push('needsReview: şekil/görsel eleman sayımına dayanan bir cevap içerebilir, doğrulayın.');
  }

  return {
    text: String(q.text || '').trim() || `${classLevel} örüntü sorusu ${q.questionNumber ?? ''}`.trim(),
    topic: q.topic || '',
    learningOutcome: '',
    subject: 'Matematik',
    classLevel,
    difficulty: q.difficulty,
    type: 'multiple-choice',
    interactiveType: 'none',
    interactionData: null,
    visualPrompt: visualNotes.join(' '),
    correctAnswer,
    solution: q.solution || 'Çözüm: örüntü kuralını bulun, adım adım uygulayın ve şıklarla karşılaştırın.',
    options,
    image,
    imageKey,
    imageProvider,
    source: 'Manuel',
    mebReference,
    curriculumNote: `Elle doğrulanmış PDF çıkarımı (${q.testCode || 'sıra'} · ${q.testName || ''}) — sayfa ${q.page ?? '?'}`.trim(),
    createdBy: createdBy || undefined,
    assessmentMeta: {
      importSource: IMPORT_TAG,
      sourceIdentity: sourceIdentity(slug, q),
      imageRole: q.imageRole || 'diagram',
      sourceCrop: q.sourceCrop || null,
      gradeSlug: slug,
      pageNumber: q.page ?? null,
      questionNumber: q.questionNumber ?? null,
      testCode: q.testCode || null,
      testName: q.testName || null,
      hasVisualPending: Boolean(q.hasVisual) && !uploaded,
      needsReview,
    },
  };
}

async function inspectExisting(classLevel) {
  const docs = await Question.find(
    { classLevel, topic: { $regex: '^Örüntüler' } },
    { 'assessmentMeta.importSource': 1 }
  ).lean();
  const bySource = {};
  for (const d of docs) {
    const key = d.assessmentMeta?.importSource || '(kaynak etiketi yok / eski kayıt)';
    bySource[key] = (bySource[key] || 0) + 1;
  }
  return { total: docs.length, bySource };
}

async function main() {
  const gradeFilter = String(process.env.EXTRACTED_PATTERN_GRADES || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const files = gradeFilter.length
    ? FILES.filter(f => gradeFilter.includes(f.slug.split('-')[0])) : FILES;
  if (!files.length) throw new Error('Geçerli sınıf seçilmedi');
  const packs = files.map(f => ({ ...f, data: loadJson(f.slug, f.file) }));
  const summaries = packs.map(({slug,data}) => validatePack(data, DATA_ROOT, slug));
  console.log(JSON.stringify(summaries, null, 2));
  if (process.argv.includes('--local-preview')) return;
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI tanımlı değil (.env kontrol edin).');
    process.exit(1);
  }
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  console.log(`Bağlandı: ${dbName}\n`);

  const confirmed = String(process.env.CONFIRM_EXTRACTED_PATTERN_IMPORT || '').trim() === 'YES';
  if (String(process.env.EXTRACTED_PATTERN_REPLACE_MINE || 'false').toLowerCase() === 'true') {
    throw new Error('Silerek yeniden aktarım kaldırıldı; mevcut kayıtlar kimlikleri korunarak güncellenir.');
  }
  const createExam = String(process.env.EXTRACTED_PATTERN_CREATE_EXAM || 'true').toLowerCase() !== 'false';
  let teacher = await User.findOne({ email: String(process.env.SEED_TEACHER_EMAIL || '').trim() }).select('_id');
  if (!teacher) {
    teacher = await User.findOne({ role: 'teacher' }).sort({ createdAt: 1 }).select('_id');
  }

  const allWarnings = [];
  const results = [];

  for (const { slug, file } of files) {
    const data = loadJson(slug, file);
    const classLevel = data.source.classLevel;
    const mebReference = data.source.mebReference;
    const questions = data.questions;

    const existing = await inspectExisting(classLevel);
    const alreadyOurs = existing.bySource[IMPORT_TAG] || 0;

    console.log(`=== ${classLevel} (${slug}) ===`);
    console.log(`  JSON'daki soru sayısı: ${questions.length}`);
    console.log(`  DB'de mevcut "Örüntüler" soruları: ${existing.total}`);
    console.log(`  Kaynağa göre dağılım:`, existing.bySource);
    if (alreadyOurs > 0) {
      console.log(
        `  Mevcut ${alreadyOurs} kayıt kaynak sayfası ve soru numarasına göre güncellenecek.`
      );
    }

    if (!confirmed) {
      results.push({ classLevel, wouldInsert: questions.length, existingTotal: existing.total, existingBySource: existing.bySource });
      console.log('');
      continue;
    }

    const docs = [];
    for (const q of questions) {
      docs.push(await buildQuestionDoc(q, { classLevel, mebReference, createdBy: teacher?._id, slug }, allWarnings));
    }
    const inserted = [];
    for (const doc of docs) {
      inserted.push(await Question.findOneAndUpdate({
        classLevel, 'assessmentMeta.importSource': IMPORT_TAG,
        ...(slug === '9-sinif' ? {} : { 'assessmentMeta.pageNumber': doc.assessmentMeta.pageNumber }),
        'assessmentMeta.questionNumber': doc.assessmentMeta.questionNumber,
      }, { $set: doc }, { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }));
    }
    console.log(`  Eklendi/güncellendi: ${inserted.length} soru`);

    if (createExam) {
      await Exam.findOneAndUpdate(
        {
          title: `${classLevel} Matematik - Örüntüler PDF Bankası (Elle Doğrulanmış İnceleme)`,
          classLevel,
          subject: 'Matematik',
          topic: 'Örüntüler',
        },
        {
          $set: {
            description: `${classLevel} KTT/YGT/BTT örüntü PDF paketi — elle çıkarılmış ve doğrulanmış ${inserted.length} soru.`,
            duration: Math.max(30, inserted.length * 3),
            questions: inserted.map((d) => d._id),
            status: 'active',
            examType: 'meb-patterns-pdf-extracted',
            learningOutcomes: ['Örüntü oluşturma ve analiz etme'],
            mebReference,
            createdBy: teacher?._id,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      console.log('  İnceleme sınavı oluşturuldu/güncellendi.');
    }

    results.push({ classLevel, inserted: inserted.length });
    console.log('');
  }

  console.log('\n=== ÖZET ===');
  console.log(JSON.stringify(results, null, 2));

  if (allWarnings.length) {
    console.log(`\n=== UYARILAR (${allWarnings.length}) — öğretmen panelinden gözden geçirin ===`);
    allWarnings.forEach((w) => console.log(' - ' + w));
  }

  if (!confirmed) {
    console.log(
      '\nBu SADECE bir önizlemedir, hiçbir şey yazılmadı.\n' +
        'Gerçekten eklemek için: CONFIRM_EXTRACTED_PATTERN_IMPORT=YES npm run import:extracted-patterns'
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('HATA:', err.message);
  process.exit(1);
});
