/**
 * Orta/düşük öncelikli PDF sorularını cilalar: OCR temizliği, şık/cevap, çözüm adımları.
 * CONFIRM_PATTERN_PDF_POLISH=YES node scripts/import/polishPatternPdfQuestions.js
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const sharp = require('sharp');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const { enrichParsedQuestionAsync } = require('../../services/patternQuestionSolver');
const { assessQuestion, isGenericSolution } = require('./patternPdfQuality');
const {
  ocrImage,
  mergeOptionSources,
  resolveCorrectAnswer,
  optionText,
  buildQuestionTextClean,
  cleanOcrText,
  terminateWorker,
} = require('./pdfQuestionExtractor');

const CONFIRM = 'YES';
const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');

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
    text: optionText(o.text || o),
    image: '',
    imageKey: '',
    imageProvider: '',
  })).filter((o) => o.text && !o.text.startsWith('[object'));
}

function pickBestText(current, ocrRaw, ocrClean) {
  const candidates = [
    cleanOcrText(current),
    ocrClean,
    buildQuestionTextClean(ocrRaw),
  ].filter((t) => t && t.length >= 20);
  candidates.sort((a, b) => {
    const score = (t) => {
      let s = Math.min(t.length, 400);
      if (/[|¦©]/.test(t)) s -= 80;
      if ((t.match(/[A-E]\)/g) || []).length > 2) s -= 40;
      if (/örüntü sorusu \d+$/i.test(t)) s -= 100;
      return s;
    };
    return score(b) - score(a);
  });
  return candidates[0] || cleanOcrText(current) || current;
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_POLISH || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_PDF_POLISH=${CONFIRM} node scripts/import/polishPatternPdfQuestions.js`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });

  const questions = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' })
    .sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let updated = 0;
  let skipped = 0;

  for (const q of questions) {
    const before = assessQuestion(q);
    if (q.assessmentMeta?.repairedAt) {
      skipped += 1;
      continue;
    }
    const needsWork = before.issues.some((i) => [
      'metin-gurultu', 'cozum-jenerik', 'metin-kisa', 'anahtar-uyumsuz', 'cevap-zayif',
    ].includes(i));

    if (!needsWork) {
      skipped += 1;
      continue;
    }

    const seq = q.assessmentMeta?.sequenceIndex;
    const letter = q.classLevel === '9. Sınıf'
      ? (GRADE9_KEYS[seq] || q.assessmentMeta?.answerLetter || '')
      : (q.assessmentMeta?.answerLetter || '');

    let ocrRaw = '';
    const crop = cropPathForSequence(q.classLevel, seq);
    if (crop) {
      const prep = crop.replace('.png', '-polish.png');
      await sharp(crop).resize({ width: 1500 }).normalize().sharpen().png().toFile(prep);
      const ocr = await ocrImage(prep);
      ocrRaw = ocr.fullText;
    }

    const existingOpts = (q.options || []).map((o) => ({ text: optionText(o) }));
    const merged = mergeOptionSources(
      ocrRaw,
      existingOpts,
      q.correctAnswer,
    );
    const finalMerged = pickBestMergedOptions(existingOpts, merged);

    const optTexts = finalMerged.map((o) => o.text);
    let text = pickBestText(q.text, ocrRaw, buildQuestionTextClean(ocrRaw));
    if (text.length < 20 && q.text) text = cleanOcrText(q.text);

    let correctAnswer = resolveCorrectAnswer(finalMerged, {
      letter,
      currentAnswer: q.correctAnswer,
    });

    const enriched = await enrichParsedQuestionAsync({
      text,
      questionText: text,
      ocrPreview: ocrRaw.slice(0, 2500),
      options: optTexts,
      correctAnswer,
      solution: q.solution,
      classLevel: q.classLevel,
      difficulty: q.difficulty,
    });

    if (enriched.correctAnswer && !/^[A-E]$/i.test(String(q.correctAnswer || ''))) {
      correctAnswer = resolveCorrectAnswer(finalMerged, {
        letter,
        currentAnswer: enriched.correctAnswer,
      });
    } else if (enriched.correctAnswer && /^[A-E]$/i.test(String(correctAnswer || ''))) {
      const fromSolver = enriched.correctAnswer;
      if (fromSolver && !/^[A-E]$/i.test(fromSolver)) correctAnswer = fromSolver;
    }

    correctAnswer = resolveCorrectAnswer(finalMerged, { letter, currentAnswer: correctAnswer });
    if (!correctAnswer || correctAnswer.trim() === '') {
      correctAnswer = String(q.correctAnswer || optTexts.find(Boolean) || '').trim();
    }
    if (/^[A-E]$/i.test(correctAnswer) && letter) {
      const fromLetter = resolveCorrectAnswer(merged, { letter, currentAnswer: '' });
      if (fromLetter) correctAnswer = fromLetter;
    }

    const solution = enriched.solution && !isGenericSolution(enriched.solution)
      ? enriched.solution
      : enriched.solution;

    const updates = {
      text: text.length >= 15 ? text : q.text,
      correctAnswer,
      solution,
      topic: enriched.topic || q.topic,
      learningOutcome: enriched.learningOutcome || q.learningOutcome,
      'assessmentMeta.answerLetter': letter || q.assessmentMeta?.answerLetter,
      'assessmentMeta.polishedAt': new Date().toISOString(),
      'assessmentMeta.enrichEngine': enriched.engine || q.assessmentMeta?.enrichEngine,
    };
    const newOpts = toOptionDocs(finalMerged);
    if (newOpts.filter((o) => o.text).length >= 2) {
      updates.options = newOpts;
    }

    await Question.updateOne({ _id: q._id }, { $set: updates });
    updated += 1;

    const after = assessQuestion({ ...q.toObject(), ...updates, options: updates.options });
    console.log(`  ✓ ${q.classLevel} #${seq} ${before.issues.join('+')} → ${after.issues.join('+') || 'ok'}`);
  }

  await terminateWorker();

  const remaining = [];
  const all = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' });
  for (const q of all) {
    const a = assessQuestion(q);
    if (a.needsReview) remaining.push({ cls: q.classLevel, seq: q.assessmentMeta?.sequenceIndex, issues: a.issues });
  }

  console.log(JSON.stringify({ updated, skipped, remainingReview: remaining.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
