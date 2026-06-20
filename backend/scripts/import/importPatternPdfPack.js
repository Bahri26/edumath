/**
 * Doktora tezi örüntü PDF paketlerini (5-6-7-9. sınıf) sisteme yükler.
 * Her sınıf: 21 soru → 7 Kolay + 7 Orta + 7 Zor
 *
 * Kullanım:
 *   CONFIRM_PATTERN_PDF_IMPORT=YES node scripts/import/importPatternPdfPack.js
 *
 * Ortam:
 *   PATTERN_PDF_REPLACE=true   — mevcut örüntü sorularını siler (ilgili sınıflar)
 *   PATTERN_PDF_DIR            — PDF kök klasörü (varsayılan: OneDrive yolu)
 */

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const Exam = require('../../models/Exam');
const User = require('../../models/User');
const { uploadBuffer } = require('../../services/storageService');
const { enrichParsedQuestionAsync } = require('../../services/patternQuestionSolver');
const { PATTERN_TOPIC_LABELS } = require('../../constants/patternTopics');
const {
  splitPageIntoQuestions,
  letterToCorrectAnswer,
  terminateWorker,
} = require('./pdfQuestionExtractor');

const CONFIRM_TOKEN = 'YES';
const MEB_REF = 'MEB Matematik Öğretim Programı (2018) — Örüntüler (KTT/BTT bankası)';
const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');

const DEFAULT_PDF_DIR = process.env.PATTERN_PDF_DIR
  || path.join(process.env.USERPROFILE || '', 'OneDrive', 'Masaüstü', 'Bahri', 'Doktora Tezi');

/** Sayfa başına soru sayısı (toplam 21) */
const PAGE_SPLITS = {
  '5-sinif': [4, 4, 4, 4, 3, 2],
  '6-sinif': [3, 3, 3, 3, 3, 2, 2, 2],
  '7-sinif': [4, 4, 4, 4, 3, 2],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

const PACKS = [
  {
    classLevel: '5. Sınıf',
    slug: '5-sinif',
    pdfName: '5 sınıf örüntü başlık.pdf',
    mebReference: 'MEB Matematik Öğretim Programı (2018) — 5. sınıf örüntü kazanımı',
  },
  {
    classLevel: '6. Sınıf',
    slug: '6-sinif',
    pdfName: '6 sınıf örüntü - başlık.pdf',
    mebReference: 'MEB Matematik Öğretim Programı (2018) — 6. sınıf örüntü kazanımı',
  },
  {
    classLevel: '7. Sınıf',
    slug: '7-sinif',
    pdfName: '7 sınıf örüntü başlık.pdf',
    mebReference: 'MEB Matematik Öğretim Programı (2018) — 7. sınıf örüntü kazanımı',
  },
  {
    classLevel: '9. Sınıf',
    slug: '9-sinif',
    pdfName: '9. SINIF ORUNTÜ SORULARI.pdf',
    mebReference: 'MEB Matematik Öğretim Programı (2018) — 9. sınıf sayı örüntüleri',
  },
];

function difficultyForIndex(index) {
  if (index < 7) return 'Kolay';
  if (index < 14) return 'Orta';
  return 'Zor';
}

function inferPatternTopic(text) {
  const t = String(text || '').toLowerCase();
  if (/alt[ıi]gen|şekil|kibrit|kutu|karelerden|geometrik/.test(t)) {
    return PATTERN_TOPIC_LABELS.GEOMETRIC;
  }
  if (/kare\s*say|n[\^²2]/.test(t)) return PATTERN_TOPIC_LABELS.SQUARES;
  if (/üçgensel|ucgensel/.test(t)) return PATTERN_TOPIC_LABELS.TRIANGULAR;
  if (/iki\s*ad[ıi]ml|karma\s*kural|yanlıştır|doğrudur/.test(t)) return PATTERN_TOPIC_LABELS.RULE;
  if (/kural|hangisi|ifade|adım\s*say/.test(t)) return PATTERN_TOPIC_LABELS.RULE;
  return PATTERN_TOPIC_LABELS.ARITHMETIC;
}

function renderPdfPack(pdfPath, outDir) {
  const pyScript = path.join(__dirname, 'pdfRenderPages.py');
  execFileSync('python', [pyScript, '--pdf', pdfPath, '--out', outDir, '--scale', '2'], {
    stdio: 'inherit',
    encoding: 'utf8',
  });
  const manifestPath = path.join(outDir, 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

async function uploadQuestionImage(cropPath, classLevel, index) {
  const buffer = fs.readFileSync(cropPath);
  const safeClass = classLevel.replace(/\s+/g, '-').toLowerCase();
  return uploadBuffer(buffer, {
    originalName: `${safeClass}-pattern-q${index + 1}.png`,
    mimeType: 'image/png',
    prefix: 'questions/pattern-pdf',
    extension: '.png',
  });
}

async function buildQuestionDoc(raw, { classLevel, index, mebReference, createdBy }) {
  const difficulty = difficultyForIndex(index);
  const optionTexts = raw.options.map((o) => o.text).filter(Boolean);
  while (optionTexts.length < 4) optionTexts.push('');
  const trimmedOptions = optionTexts.slice(0, 5);

  let correctAnswer = letterToCorrectAnswer(raw.options, raw.answerLetter);
  let solution = '';

  const enriched = await enrichParsedQuestionAsync({
    text: raw.text,
    questionText: raw.text,
    ocrPreview: raw.ocrPreview,
    options: trimmedOptions,
    correctAnswer,
    topic: inferPatternTopic(raw.text),
    difficulty,
    classLevel,
  });

  if (!correctAnswer && enriched.correctAnswer) {
    correctAnswer = enriched.correctAnswer;
  }
  solution = enriched.solution || '';
  const topic = enriched.topic || inferPatternTopic(raw.text);

  let image = '';
  let imageKey = '';
  let imageProvider = '';
  const needsImage = raw.hasVisual || raw.cropPath;
  if (needsImage && raw.cropPath && fs.existsSync(raw.cropPath)) {
    const uploaded = await uploadQuestionImage(raw.cropPath, classLevel, index);
    image = uploaded.url;
    imageKey = uploaded.key;
    imageProvider = uploaded.provider;
  }

  const questionText = String(raw.text || '').trim()
    || String(raw.ocrPreview || '').trim().slice(0, 500)
    || `${classLevel} örüntü sorusu ${index + 1}`;

  const finalAnswer = String(correctAnswer || trimmedOptions.find(Boolean) || 'A').trim();

  return {
    text: questionText,
    topic: topic.startsWith('Örüntüler') ? topic : inferPatternTopic(questionText),
    learningOutcome: '',
    subject: 'Matematik',
    classLevel,
    difficulty,
    type: 'multiple-choice',
    interactiveType: 'none',
    interactionData: null,
    visualPrompt: raw.hasVisual ? 'PDF diyagram / şekil örüntüsü' : '',
    correctAnswer: finalAnswer,
    solution: solution || 'Çözüm: örüntü kuralını bulun, adım adım uygulayın ve şıklarla karşılaştırın.',
    options: trimmedOptions.map((text) => ({
      text: String(text || ''),
      image: '',
      imageKey: '',
      imageProvider: '',
    })),
    image,
    imageKey,
    imageProvider,
    source: 'Manuel',
    mebReference,
    curriculumNote: `KTT/BTT bankası PDF içe aktarımı · sıra ${index + 1}/21`,
    createdBy: createdBy || undefined,
    assessmentMeta: {
      importSource: 'pattern-pdf-pack',
      sequenceIndex: index + 1,
      pageNumber: raw.pageNumber,
      sliceIndex: raw.sliceIndex || null,
      localNumber: raw.localNumber || null,
      hasVisual: raw.hasVisual,
      enrichEngine: enriched.engine || 'local',
      answerLetter: raw.answerLetter || null,
    },
  };
}

async function importPack(pack, { createdBy, replace }) {
  const pdfPath = path.join(DEFAULT_PDF_DIR, pack.pdfName);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF bulunamadı: ${pdfPath}`);
  }

  const outDir = path.join(DATA_ROOT, pack.slug);
  console.log(`\n=== ${pack.classLevel} ===`);
  console.log('PDF:', pdfPath);

  const manifest = renderPdfPack(pdfPath, outDir);
  const globalAnswerKeys = Object.fromEntries(
    Object.entries(manifest.answerKeys || {}).map(([k, v]) => [Number(k), v])
  );

  const pageSplits = PAGE_SPLITS[pack.slug] || manifest.pages.map(() => 4);
  const collected = [];
  let globalIndex = 0;

  for (const pageMeta of manifest.pages) {
    const imagePath = path.join(outDir, pageMeta.image);
    const splitCount = pageSplits[pageMeta.page - 1] || 4;
    const pageKeys = { ...globalAnswerKeys, ...Object.fromEntries(
      Object.entries(pageMeta.answerKeys || {}).map(([k, v]) => [Number(k), v])
    ) };

    const pageQuestions = await splitPageIntoQuestions(imagePath, splitCount, {
      answerKeys: pageKeys,
      pageNumber: pageMeta.page,
      regions: pageMeta.regions || [],
    });

    for (const q of pageQuestions) {
      globalIndex += 1;
      q.globalIndex = globalIndex;
      if (globalAnswerKeys[globalIndex]) {
        q.answerLetter = globalAnswerKeys[globalIndex];
      }
      collected.push(q);
    }
    console.log(`  sayfa ${pageMeta.page}: ${pageQuestions.length} soru`);
  }

  if (collected.length < 21) {
    console.warn(`  UYARI: ${pack.classLevel} için yalnızca ${collected.length} soru çıkarıldı (hedef 21).`);
  }

  const selected = collected.slice(0, 21);
  if (replace) {
    const del = await Question.deleteMany({
      classLevel: pack.classLevel,
      subject: 'Matematik',
      topic: { $regex: '^Örüntüler' },
    });
    console.log(`  Silinen eski örüntü sorusu: ${del.deletedCount}`);
  }

  const insertedIds = [];
  for (let i = 0; i < selected.length; i += 1) {
    const raw = selected[i];
    if (globalAnswerKeys[i + 1]) {
      raw.answerLetter = globalAnswerKeys[i + 1];
    }

    const doc = await buildQuestionDoc(raw, {
      classLevel: pack.classLevel,
      index: i,
      mebReference: pack.mebReference,
      createdBy,
    });

    const saved = await Question.create(doc);
    insertedIds.push(saved._id);
    const visual = doc.image ? '🖼' : '📝';
    console.log(`  [${i + 1}/21] ${visual} ${doc.difficulty} · ${doc.correctAnswer?.slice(0, 20) || '?'}`);
  }

  await Exam.findOneAndUpdate(
    {
      title: `${pack.classLevel} Matematik - Örüntüler PDF Bankası (21)`,
      classLevel: pack.classLevel,
      subject: 'Matematik',
      topic: 'Örüntüler',
      createdBy,
    },
    {
      $set: {
        description: `${pack.classLevel} KTT/BTT örüntü PDF paketi: 7 Kolay + 7 Orta + 7 Zor.`,
        duration: 70,
        questions: insertedIds,
        status: 'active',
        examType: 'meb-patterns-pdf-import',
        learningOutcomes: ['Örüntü oluşturma ve analiz etme'],
        mebReference: pack.mebReference,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { classLevel: pack.classLevel, inserted: insertedIds.length, extracted: collected.length };
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_IMPORT || '').trim() !== CONFIRM_TOKEN) {
    console.error(
      'PDF içe aktarımı MongoDB\'ye yazar.\n' +
        `Devam: CONFIRM_PATTERN_PDF_IMPORT=${CONFIRM_TOKEN} node scripts/import/importPatternPdfPack.js`
    );
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI tanımlı değil.');
    process.exit(1);
  }
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  await mongoose.connect(uri, { dbName });

  let teacher = await User.findOne({ email: String(process.env.SEED_TEACHER_EMAIL || '').trim() }).select('_id');
  if (!teacher) {
    teacher = await User.findOne({ role: 'teacher' }).sort({ createdAt: 1 }).select('_id');
  }

  const replace = String(process.env.PATTERN_PDF_REPLACE || 'true').toLowerCase() !== 'false';
  const gradeFilter = String(process.env.PATTERN_PDF_GRADES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const packs = gradeFilter.length
    ? PACKS.filter((p) => gradeFilter.some((g) => p.classLevel.startsWith(g)))
    : PACKS;

  const results = [];

  for (const pack of packs) {
    try {
      results.push(await importPack(pack, { createdBy: teacher?._id, replace }));
    } catch (err) {
      console.error(`HATA ${pack.classLevel}:`, err.message);
      results.push({ classLevel: pack.classLevel, error: err.message });
    }
  }

  console.log('\nÖzet:', JSON.stringify(results, null, 2));
  await terminateWorker();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
