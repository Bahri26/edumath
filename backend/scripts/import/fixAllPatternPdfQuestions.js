/**
 * Tüm PDF içe aktarım sorularını Gemini Vision ile yeniden okur ve MongoDB'yi günceller.
 *
 * CONFIRM_PATTERN_PDF_FIX_ALL=YES node scripts/import/fixAllPatternPdfQuestions.js
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const sharp = require('sharp');
const Question = require('../../models/Question');
const { parseQuestionFromImage } = require('./geminiQuestionFromImage');
const { enrichParsedQuestionAsync } = require('../../services/patternQuestionSolver');
const { assessQuestion } = require('./patternPdfQuality');
const {
  ocrImage,
  parseOptionsFromText,
  mergeOptionSources,
  resolveCorrectAnswer,
  letterToCorrectAnswer,
  terminateWorker,
} = require('./pdfQuestionExtractor');
const { recropAll } = require('./recropPatternPdfPages');

const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');
const CONFIRM = 'YES';
const DELAY_MS = Number(process.env.GEMINI_FIX_DELAY_MS || 1200);

const PAGE_SPLITS = {
  '5-sinif': [4, 4, 4, 4, 3, 2],
  '6-sinif': [3, 3, 3, 3, 3, 2, 2, 2],
  '7-sinif': [4, 4, 4, 4, 3, 2],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

const GRADE9_KEYS = {
  1: 'B', 2: 'E', 3: 'E', 4: 'D', 5: 'C', 6: 'B', 7: 'D', 8: 'B',
  9: 'A', 10: 'C', 11: 'C', 12: 'E', 13: 'C', 14: 'E', 15: 'C', 16: 'C',
  17: 'C', 18: 'D', 19: 'D', 20: 'D', 21: 'B',
};

function slugFromClass(classLevel) {
  return classLevel.replace('. Sınıf', '-sinif').replace('.', '-sinif');
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildQuestionText(rawText) {
  const lines = String(rawText || '').split(/\r?\n/);
  const body = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\s*([A-E])\s*[\).:\-]/i.test(trimmed)) break;
    if (/^\d{1,2}\s*[-–]\s*[A-E]/i.test(trimmed)) break;
    if (/^(KTT|BTT|TEST|TEMA|KONU|SINIF|Banko)/i.test(trimmed)) continue;
    body.push(trimmed.replace(/^\s*\d{1,2}\s*[.)]\s*/, '').trim());
  }
  return body.join('\n').trim();
}

async function fixLocalFromCrop(cropPath, { classLevel, difficulty, answerLetter, seq }) {
  const prepped = cropPath.replace('.png', '-fixprep.png');
  await sharp(cropPath)
    .resize({ width: 1300, withoutEnlargement: false })
    .normalize()
    .sharpen()
    .png()
    .toFile(prepped);

  const ocr = await ocrImage(prepped);
  const optionsParsed = mergeOptionSources(parseOptionsFromText(ocr.fullText), ocr.fullText);
  const options = optionsParsed.map((o) => o.text);
  while (options.length < 4) options.push('');

  let text = buildQuestionText(ocr.fullText);
  if (!text || text.length < 15) {
    text = ocr.fullText.split(/\n(?=[A-E]\s*[\).])/)[0]?.trim() || ocr.fullText.slice(0, 500);
  }

  const letterOpts = optionsParsed;

  let correctAnswer = resolveCorrectAnswer(letterOpts, { letter: answerLetter, currentAnswer: '' });

  const enriched = await enrichParsedQuestionAsync({
    text,
    questionText: text,
    ocrPreview: ocr.fullText.slice(0, 2500),
    options: options.slice(0, 5),
    correctAnswer,
    classLevel,
    difficulty,
  });

  if (!correctAnswer && enriched.correctAnswer) correctAnswer = enriched.correctAnswer;
  correctAnswer = resolveCorrectAnswer(letterOpts, {
    letter: answerLetter,
    currentAnswer: correctAnswer,
  });
  if (!correctAnswer) correctAnswer = options.find(Boolean) || 'A';

  return {
    text: text || `${classLevel} örüntü sorusu ${seq}`,
    options: options.slice(0, 5),
    correctAnswer,
    solution: enriched.solution || '',
    topic: enriched.topic || 'Örüntüler — Sayı (sabit adım)',
    learningOutcome: enriched.learningOutcome || '',
    engine: enriched.engine || 'local-ocr',
  };
}

async function tryGemini(crop, ctx) {
  if (!process.env.GEMINI_API_KEY || process.env.PATTERN_PDF_SKIP_GEMINI === 'true') {
    return null;
  }
  try {
    return await parseQuestionFromImage(crop, ctx);
  } catch (err) {
    if (/429|quota|Too Many Requests/i.test(String(err.message))) {
      process.env.PATTERN_PDF_SKIP_GEMINI = 'true';
    }
    return null;
  }
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_FIX_ALL || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_PDF_FIX_ALL=${CONFIRM} node scripts/import/fixAllPatternPdfQuestions.js`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri, { dbName: (process.env.MONGODB_DB || 'Edumath').trim() });

  console.log('Sayfa kırpmaları yenileniyor...');
  await recropAll();

  const questions = await Question.find({
    'assessmentMeta.importSource': 'pattern-pdf-pack',
  }).sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let fixed = 0;
  let failed = 0;

  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex || 0;
    const crop = cropPathForSequence(q.classLevel, seq);
    if (!crop) {
      console.warn(`  atlandı (görsel yok): ${q.classLevel} #${seq}`);
      failed += 1;
      continue;
    }

    const answerLetter = q.classLevel === '9. Sınıf'
      ? (GRADE9_KEYS[seq] || q.assessmentMeta?.answerLetter || '')
      : (q.assessmentMeta?.answerLetter || '');

    try {
      const ctx = {
        classLevel: q.classLevel,
        difficulty: q.difficulty,
        answerLetter,
        sequenceIndex: seq,
      };
      let parsed = await tryGemini(crop, ctx);
      if (!parsed) {
        parsed = await fixLocalFromCrop(crop, { ...ctx, seq });
      }

      if (!parsed.text || parsed.text.length < 8) {
        throw new Error('Boş metin');
      }

      await Question.updateOne(
        { _id: q._id },
        {
          $set: {
            text: parsed.text,
            options: parsed.options.map((text) => ({
              text: String(text || ''),
              image: '',
              imageKey: '',
              imageProvider: '',
            })),
            correctAnswer: parsed.correctAnswer,
            solution: parsed.solution || q.solution,
            topic: parsed.topic || q.topic,
            learningOutcome: parsed.learningOutcome || q.learningOutcome,
            visualPrompt: parsed.hasDiagram ? 'PDF diyagram / şekil örüntüsü' : '',
            'assessmentMeta.answerLetter': answerLetter || q.assessmentMeta?.answerLetter,
            'assessmentMeta.enrichEngine': parsed.engine,
            'assessmentMeta.fixedAt': new Date().toISOString(),
          },
        }
      );

      fixed += 1;
      console.log(`  ✓ ${q.classLevel} #${seq} ${q.difficulty} → ${parsed.correctAnswer?.slice(0, 30) || '?'}`);
    } catch (err) {
      failed += 1;
      console.warn(`  ✗ ${q.classLevel} #${seq}: ${err.message}`);
    }

    if (process.env.PATTERN_PDF_SKIP_GEMINI !== 'true') {
      await sleep(DELAY_MS);
    }
  }

  await terminateWorker();

  const after = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' }).lean();
  let kritik = 0;
  for (const row of after) {
    if (assessQuestion(row).severity === 'kritik') kritik += 1;
  }

  console.log(JSON.stringify({ total: questions.length, fixed, failed, kritikAfter: kritik }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
