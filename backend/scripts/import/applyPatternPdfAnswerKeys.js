/**
 * 9. sınıf PDF cevap anahtarlarını şık metnine eşler; manifest'ten 5-7 için sayfa OCR anahtarı dener.
 * Kullanım: node scripts/import/applyPatternPdfAnswerKeys.js
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const { resolveCorrectAnswer } = require('./pdfQuestionExtractor');

const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');

const GRADE9_KEYS = {
  1: 'B', 2: 'E', 3: 'E', 4: 'D', 5: 'C', 6: 'B', 7: 'D', 8: 'B',
  9: 'A', 10: 'C', 11: 'C', 12: 'E', 13: 'C', 14: 'E', 15: 'C', 16: 'C',
  17: 'C', 18: 'D', 19: 'D', 20: 'D', 21: 'B',
};

function loadManifestKeys(slug) {
  const manifestPath = path.join(DATA_ROOT, slug, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return {};
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(manifest.answerKeys || {})) {
    out[Number(k)] = String(v).toUpperCase();
  }
  return out;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri, { dbName: (process.env.MONGODB_DB || 'Edumath').trim() });

  let updated = 0;
  const questions = await Question.find({
    'assessmentMeta.importSource': 'pattern-pdf-pack',
  }).sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex;
    if (!seq) continue;

    let letter = q.assessmentMeta?.answerLetter;
    if (q.classLevel === '9. Sınıf') {
      letter = GRADE9_KEYS[seq] || letter;
    }

    if (!letter) continue;

    const options = (q.options || []).map((o, i) => ({
      letter: String.fromCharCode(65 + i),
      text: String(o.text || '').trim(),
    }));

    const fromLetter = resolveCorrectAnswer(options, {
      letter,
      currentAnswer: q.correctAnswer,
    });
    if (!fromLetter || fromLetter.startsWith('[object')) continue;

    const needsUpdate = q.correctAnswer !== fromLetter
      || q.assessmentMeta?.answerLetter !== letter;

    if (needsUpdate) {
      await Question.updateOne(
        { _id: q._id },
        {
          $set: {
            correctAnswer: fromLetter,
            'assessmentMeta.answerLetter': letter,
          },
        }
      );
      updated += 1;
      console.log(`${q.classLevel} #${seq} → ${letter}) ${fromLetter.slice(0, 40)}`);
    }
  }

  console.log(JSON.stringify({ updated }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
