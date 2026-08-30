/**
 * Şık metinlerini yeniden ayrıştırır, cevapları düzeltir; 9. sınıfta PDF metin katmanını kullanır.
 */

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const sharp = require('sharp');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const { enrichParsedQuestionAsync } = require('../../services/patternQuestionSolver');
const { assessQuestion } = require('./patternPdfQuality');
const {
  ocrImage,
  parseOptionsFromText,
  mergeOptionSources,
  resolveCorrectAnswer,
  buildQuestionText: buildQuestionTextFromExtractor,
  buildQuestionTextClean,
  cleanOcrText,
  terminateWorker,
} = require('./pdfQuestionExtractor');

const GRADE9_KEYS = {
  1: 'B', 2: 'E', 3: 'E', 4: 'D', 5: 'C', 6: 'B', 7: 'D', 8: 'B',
  9: 'A', 10: 'C', 11: 'C', 12: 'E', 13: 'C', 14: 'E', 15: 'C', 16: 'C',
  17: 'C', 18: 'D', 19: 'D', 20: 'D', 21: 'B',
};

const PAGE_SPLITS = {
  '5-sinif': [4, 4, 4, 4, 3, 2],
  '6-sinif': [3, 3, 3, 3, 3, 2, 2, 2],
  '7-sinif': [4, 4, 4, 4, 3, 2],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');
const PY_SCRIPT = path.join(__dirname, 'extractPdfRegionText.py');

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

function loadPdfTextBySequence(slug) {
  const manifestPath = path.join(DATA_ROOT, slug, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return {};
  try {
    const raw = execFileSync('python', [PY_SCRIPT, manifestPath], {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(raw);
  } catch {
    return {};
  }
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
  const built = body.join('\n').trim();
  return built || buildQuestionTextFromExtractor(rawText);
}

function pickBestMergedOptions(existingOpts, merged) {
  const existing = (existingOpts || []).map((o, i) => ({
    letter: String.fromCharCode(65 + i),
    text: String(o.text || o || '').trim(),
  }));
  const mergedFilled = merged.filter((o) => o.text).length;
  const existingFilled = existing.filter((o) => o.text).length;
  if (mergedFilled >= 2 && mergedFilled >= existingFilled) return merged;
  if (existingFilled >= 2) return existing;
  return mergeOptionSources(existing, merged);
}

function toOptionDocs(merged) {
  return merged.map((o) => ({
    text: o.text,
    image: '',
    imageKey: '',
    imageProvider: '',
  }));
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });

  const pdfTextCache = {};
  const questions = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' })
    .sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let updated = 0;
  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex;
    const slug = slugFromClass(q.classLevel);
    const letter = q.classLevel === '9. Sınıf' ? (GRADE9_KEYS[seq] || '') : (q.assessmentMeta?.answerLetter || '');

    let ocrText = '';
    let pdfBlock = null;

    if (slug === '9-sinif') {
      if (!pdfTextCache[slug]) pdfTextCache[slug] = loadPdfTextBySequence(slug);
      pdfBlock = pdfTextCache[slug][String(seq)] || pdfTextCache[slug][seq];
    }

    const crop = cropPathForSequence(q.classLevel, seq);
    if (crop) {
      const prep = crop.replace('.png', '-fin.png');
      await sharp(crop).resize({ width: 1400 }).normalize().sharpen().png().toFile(prep);
      const ocr = await ocrImage(prep);
      ocrText = ocr.fullText;
    }

    const existingOpts = (q.options || []).map((o) => ({ text: o.text || '' }));
    const pdfOpts = pdfBlock?.options
      ? Object.entries(pdfBlock.options).map(([letter, text]) => ({ letter, text }))
      : [];
    const merged = mergeOptionSources(
      pdfOpts,
      pdfBlock?.fullText || '',
      ocrText,
      q.correctAnswer,
      existingOpts,
      parseOptionsFromText(ocrText),
    );

    const hasOpts = merged.filter((o) => o.text).length >= 2;
    const existingOptCount = (q.options || []).filter((o) => String(o.text || '').trim()).length;
    if (!hasOpts && existingOptCount < 2 && !pdfBlock?.text) continue;
    const finalMerged = pickBestMergedOptions(existingOpts, merged);

    let text = cleanOcrText(buildQuestionText(pdfBlock?.text || q.text || ocrText));
    if (text.length < 20) text = buildQuestionTextClean(ocrText) || cleanOcrText(q.text) || q.text;

    let correctAnswer = resolveCorrectAnswer(finalMerged, {
      letter,
      currentAnswer: q.correctAnswer,
    });
    if (!correctAnswer) correctAnswer = String(q.correctAnswer || '').trim();

    const optTexts = finalMerged.map((o) => o.text);
    const enriched = await enrichParsedQuestionAsync({
      text,
      questionText: text,
      ocrPreview: (pdfBlock?.fullText || ocrText).slice(0, 2500),
      options: optTexts,
      correctAnswer,
      classLevel: q.classLevel,
      difficulty: q.difficulty,
    });

    if ((!correctAnswer || correctAnswer === 'A') && enriched.correctAnswer) {
      correctAnswer = enriched.correctAnswer;
    }
    correctAnswer = resolveCorrectAnswer(finalMerged, { letter, currentAnswer: correctAnswer });
    if (!correctAnswer) correctAnswer = String(q.correctAnswer || optTexts.find(Boolean) || '').trim();

    const solution = enriched.solution || q.solution || '';

    const candidate = {
      ...q.toObject(),
      text: text.length > 15 ? text : q.text,
      options: toOptionDocs(finalMerged),
      correctAnswer,
      solution: solution.length > 40 ? solution : q.solution,
    };
    const beforeQ = assessQuestion(q);
    const afterQ = assessQuestion(candidate);
    const score = (a) => {
      let s = 0;
      if (a.severity === 'kritik') s += 100;
      else if (a.severity === 'orta') s += 10;
      else if (a.severity === 'dusuk') s += 1;
      s += a.issues.length;
      return s;
    };
    if (score(afterQ) > score(beforeQ) && beforeQ.severity !== 'kritik') continue;

    await Question.updateOne(
      { _id: q._id },
      {
        $set: {
          text: candidate.text,
          options: candidate.options,
          correctAnswer: candidate.correctAnswer,
          solution: candidate.solution,
          topic: enriched.topic || q.topic,
          learningOutcome: enriched.learningOutcome || q.learningOutcome,
          'assessmentMeta.answerLetter': letter || q.assessmentMeta?.answerLetter,
        },
      },
    );
    updated += 1;
  }

  await terminateWorker();
  console.log(JSON.stringify({ updated }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
