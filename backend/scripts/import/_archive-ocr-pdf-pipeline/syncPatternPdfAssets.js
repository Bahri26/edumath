/**
 * Tüm PDF sorularına kırpım görseli yükler ve şık metinlerini doldurur.
 * CONFIRM_PATTERN_PDF_SYNC=YES node scripts/import/syncPatternPdfAssets.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { uploadBuffer } = require('../../services/storageService');
const { enrichParsedQuestionAsync } = require('../../services/patternQuestionSolver');
const {
  ocrImage,
  mergeOptionSources,
  resolveCorrectAnswer,
  buildQuestionTextClean,
  cleanOcrText,
  optionText,
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

/** OCR yetersiz kalan sorular — manuel metin/şık */
const CURATED = {
  '5. Sınıf': {
    13: {
      text: 'Görselde verilen şekil örüntüsünün 1., 2. ve 3. adımları gösterilmiştir. (13–16. sorular bu örüntüye göre cevaplanacaktır.)',
      options: ['2n', '3n − 1', '4n', 'n + 3'],
      correctAnswer: '4n',
    },
    14: {
      text: 'Yukarıdaki örüntüdeki kare sayısını veren kural aşağıdakilerden hangisi olabilir?',
      options: ['n²', '4n', '2n + 2', 'n(n + 1)'],
      correctAnswer: 'n²',
    },
    15: {
      text: 'Şekil örüntüsünün çevre uzunluğunu adım sayısına göre veren kural aşağıdakilerden hangisi olabilir? (Görsele bakınız.)',
      options: ['3 × (Adım Sayısı)', '2 × (Adım Sayısı) + 1', '5 × (Adım Sayısı) − 2', '4 × (Adım Sayısı) + 2'],
      correctAnswer: '2 × (Adım Sayısı) + 1',
    },
    16: {
      text: 'Örüntüdeki birim sayısını adım sayısına göre veren kural aşağıdakilerden hangisi olabilir? (Görsele bakınız.)',
      options: ['2 × (Adım Sayısı) + 1', '40 × (Adım Sayısı)', '20 × (Adım Sayısı) + 20', '60 × (Adım Sayısı) − 20'],
      correctAnswer: '2 × (Adım Sayısı) + 1',
    },
    17: {
      text: 'Üçüncü adımları eşit olan iki örüntü görselde verilmiştir. Örüntüler eşit adımları üst üste gelecek şekilde birleştirildiğinde kurdele örüntüsü oluşur. Hangi şekil kurdele örüntüsü değildir?',
      options: ['Şekil I', 'Şekil II', 'Şekil III', 'Şekil IV'],
      correctAnswer: 'Şekil III',
    },
    18: {
      text: 'Görselde verilen sayı/şekil örüntüsü ile ilgili soruyu cevaplayınız.',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
    },
    19: {
      text: 'Derin, renkleri farklı kartonlardan üçgen ve daire keserek ilk üç adımı görselde verilen şekil örüntüsünü oluşturmuştur. Buna göre 4. adımda kaç adet üçgen vardır?',
      options: ['4', '5', '6', '7'],
      correctAnswer: '5',
    },
    20: {
      text: 'Kibrit çöpleri ile oluşturulan bir şekil örüntüsünün ilk üç adımı görselde verilmiştir. Buna göre bu örüntü ile ilgili aşağıdakilerden hangisi yanlıştır?',
      options: [
        'Örüntüdeki kibrit çöpü sayısını veren kural "4 × (Adım Sayısı) + 1" dir.',
        'Örüntünün 6. adımında kullanılan kibrit çöpü sayısı bir doğal sayının karesine eşittir.',
        'Örüntünün ilk beş adımını oluşturmak için 65 kibrit çöpü kullanılır.',
        'Her adımda bir önceki adıma göre kibrit çöpü sayısı beşer beşer artmıştır.',
      ],
      correctAnswer: 'Her adımda bir önceki adıma göre kibrit çöpü sayısı beşer beşer artmıştır.',
    },
    21: {
      text: 'Kutularla oluşturulan bir şekil örüntüsünün ilk üç adımı görselde verilmiştir. Buna göre 4. adımda kaç kutu kullanılır?',
      options: ['8', '10', '12', '14'],
      correctAnswer: '10',
    },
  },
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

/** 13–16. sorular aynı sayfada ortak görsel kullanır */
function imageCropForQuestion(classLevel, sequenceIndex) {
  if (classLevel === '5. Sınıf' && sequenceIndex >= 13 && sequenceIndex <= 16) {
    const shared = path.join(DATA_ROOT, '5-sinif', 'crops', 'p4-s1.png');
    if (fs.existsSync(shared)) return shared;
  }
  return cropPathForSequence(classLevel, sequenceIndex);
}

async function uploadCrop(cropPath, classLevel, seq) {
  const buffer = fs.readFileSync(cropPath);
  const safeClass = classLevel.replace(/\s+/g, '-').toLowerCase();
  return uploadBuffer(buffer, {
    originalName: `${safeClass}-pattern-q${seq}.png`,
    mimeType: 'image/png',
    prefix: 'questions/pattern-pdf',
    extension: '.png',
  });
}

function toOptionDocs(texts) {
  return texts.map((text) => ({
    text: String(text || '').trim(),
    image: '',
    imageKey: '',
    imageProvider: '',
  }));
}

function pickOptionTexts(merged, minCount = 4) {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const texts = letters.map((L) => {
    const hit = merged.find((o) => o.letter === L);
    return hit?.text || '';
  });
  while (texts.length < minCount) texts.push('');
  return texts.slice(0, 5);
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_SYNC || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_PDF_SYNC=${CONFIRM} node scripts/import/syncPatternPdfAssets.js`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const questions = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' })
    .sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let synced = 0;
  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex;
    const letter = q.classLevel === '9. Sınıf' ? (GRADE9_KEYS[seq] || '') : '';
    const curated = CURATED[q.classLevel]?.[seq];
    const crop = imageCropForQuestion(q.classLevel, seq);

    let ocrText = '';
    if (crop) {
      const prep = crop.replace('.png', '-sync.png');
      await sharp(crop).resize({ width: 1800 }).normalize().sharpen().png().toFile(prep);
      const ocr = await ocrImage(prep);
      ocrText = ocr.fullText;
    }

    const existingOpts = (q.options || []).map((o) => optionText(o));
    const merged = mergeOptionSources(ocrText, existingOpts, q.correctAnswer);
    let optTexts = pickOptionTexts(merged);

    let text = curated?.text || cleanOcrText(buildQuestionTextClean(ocrText) || q.text);
    if (text.length < 20 && q.text && !curated) text = cleanOcrText(q.text);

    if (curated) {
      optTexts = curated.options.concat(Array(5).fill('')).slice(0, 5);
      text = curated.text;
    } else if (optTexts.filter(Boolean).length < 2 && existingOpts.filter(Boolean).length >= 2) {
      optTexts = existingOpts.concat(Array(5).fill('')).slice(0, 5);
    } else if (optTexts.filter(Boolean).length < 2) {
      optTexts = ['A', 'B', 'C', 'D', 'E'].slice(0, q.classLevel === '9. Sınıf' ? 5 : 4);
    }

    let correctAnswer = curated?.correctAnswer
      || resolveCorrectAnswer(
        optTexts.map((t, i) => ({ letter: String.fromCharCode(65 + i), text: t })),
        { letter, currentAnswer: q.correctAnswer },
      )
      || q.correctAnswer
      || optTexts.find(Boolean)
      || 'A';

    const enriched = await enrichParsedQuestionAsync({
      text,
      questionText: text,
      ocrPreview: ocrText.slice(0, 2500),
      options: optTexts.filter(Boolean),
      correctAnswer,
      classLevel: q.classLevel,
      difficulty: q.difficulty,
    });

    const updates = {
      text: text.length >= 15 ? text : q.text,
      options: toOptionDocs(optTexts),
      correctAnswer: enriched.correctAnswer || correctAnswer,
      solution: enriched.solution || q.solution,
      visualPrompt: crop ? 'PDF diyagram / şekil örüntüsü — görsele bakınız' : q.visualPrompt,
      'assessmentMeta.syncedAt': new Date().toISOString(),
    };

    if (crop) {
      try {
        const uploaded = await uploadCrop(crop, q.classLevel, seq);
        updates.image = uploaded.url;
        updates.imageKey = uploaded.key;
        updates.imageProvider = uploaded.provider;
      } catch (err) {
        console.warn(`  görsel atlandı #${seq}:`, err.message);
      }
    }

    await Question.updateOne({ _id: q._id }, { $set: updates });
    synced += 1;
    const optCount = optTexts.filter(Boolean).length;
    console.log(`  ✓ ${q.classLevel} #${seq} · ${optCount} şık · ${updates.image ? 'görsel' : '—'}`);
  }

  await terminateWorker();
  console.log(JSON.stringify({ synced }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
