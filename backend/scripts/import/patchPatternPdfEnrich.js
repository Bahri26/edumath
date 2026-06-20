/**
 * Zayıf PDF içe aktarım sorularını kırpılmış görsel + ML ile yeniden zenginleştirir.
 * Kullanım: CONFIRM_PATTERN_PDF_PATCH=YES node scripts/import/patchPatternPdfEnrich.js
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const { enrichParsedQuestionAsync } = require('../../services/patternQuestionSolver');
const { assessQuestion } = require('./patternPdfQuality');
const { resolveCorrectAnswer } = require('./pdfQuestionExtractor');

const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');
const CONFIRM = 'YES';

function cropPathForQuestion(classLevel, meta) {
  const slug = classLevel.replace('. Sınıf', '-sinif').replace('.', '-sinif');
  const page = meta?.pageNumber;
  const slice = meta?.sliceIndex || meta?.sequenceIndex;
  if (!page || !slice) return null;
  const p = path.join(DATA_ROOT, slug, 'crops', `p${page}-s${slice}.png`);
  return fs.existsSync(p) ? p : null;
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_PATCH || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_PDF_PATCH=${CONFIRM} node scripts/import/patchPatternPdfEnrich.js`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri, { dbName: (process.env.MONGODB_DB || 'Edumath').trim() });

  const questions = await Question.find({
    'assessmentMeta.importSource': 'pattern-pdf-pack',
  }).sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let patched = 0;
  for (const q of questions) {
    const before = assessQuestion(q);
    if (!before.issues.some((i) => [
      'cevap-zayif', 'cozum-jenerik', 'metin-gurultu', 'metin-kisa', 'anahtar-uyumsuz',
    ].includes(i))) {
      continue;
    }

    const options = (q.options || []).map((o) => String(o.text || '').trim());
    const answerLetter = q.assessmentMeta?.answerLetter || '';
    const crop = cropPathForQuestion(q.classLevel, q.assessmentMeta);

    const enriched = await enrichParsedQuestionAsync({
      text: q.text,
      questionText: q.text,
      ocrPreview: q.text,
      options,
      correctAnswer: resolveCorrectAnswer(
        options.map((t, i) => ({ letter: String.fromCharCode(65 + i), text: t })),
        { letter: answerLetter, currentAnswer: q.correctAnswer },
      ) || q.correctAnswer,
      topic: q.topic,
      difficulty: q.difficulty,
      classLevel: q.classLevel,
      solution: q.solution,
    });

    const updates = {};
    if (enriched.solution && before.issues.includes('cozum-jenerik')) {
      updates.solution = enriched.solution;
    }
    if (before.issues.includes('cevap-zayif') || before.issues.includes('anahtar-uyumsuz')) {
      const letterAnswer = resolveCorrectAnswer(
        options.map((t, i) => ({ letter: String.fromCharCode(65 + i), text: t })),
        { letter: answerLetter, currentAnswer: enriched.correctAnswer || q.correctAnswer },
      );
      if (letterAnswer) updates.correctAnswer = letterAnswer;
    }
    if (enriched.topic && !String(q.topic || '').startsWith('Örüntüler')) {
      updates.topic = enriched.topic;
    }

    if (Object.keys(updates).length) {
      updates['assessmentMeta.enrichEngine'] = enriched.engine || 'patch';
      await Question.updateOne({ _id: q._id }, { $set: updates });
      patched += 1;
      console.log(`  güncellendi: ${q.classLevel} #${q.assessmentMeta?.sequenceIndex}`, Object.keys(updates).join(', '));
    }
  }

  console.log(JSON.stringify({ patched, total: questions.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
