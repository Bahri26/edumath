/**
 * Görsel ağırlıklı PDF sorularını onarır: temiz metin + kırpılmış PNG görsel yükler.
 * CONFIRM_PATTERN_PDF_REPAIR=YES node scripts/import/repairPatternPdfVisualQuestions.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { uploadBuffer } = require('../../services/storageService');

const CONFIRM = 'YES';
const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');

const PAGE_SPLITS = {
  '5-sinif': [4, 4, 4, 4, 3, 2],
  '6-sinif': [3, 3, 3, 3, 3, 2, 2, 2],
  '7-sinif': [4, 4, 4, 4, 3, 2],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

/** sequenceIndex → manuel metin/şık (OCR güvenilmez görsel sorular) */
const CURATED = {
  '5. Sınıf': {
    15: {
      text: 'Şekil örüntüsünün çevre uzunluğunu adım sayısına göre veren kural aşağıdakilerden hangisi olabilir? (Görsele bakınız.)',
      options: ['3 × (Adım Sayısı)', '2 × (Adım Sayısı) + 1', '5 × (Adım Sayısı) − 2', '4 × (Adım Sayısı) + 2'],
      correctAnswer: '2 × (Adım Sayısı) + 1',
      solution: '1. Görseldeki örüntüde her adımda çevreye eklenen miktarı inceleyin.\n2. Adım sayısı n iken çevre ifadesini bulun.\n3. Şıklarla eşleşen kuralı seçin.',
      visualPrompt: 'PDF şekil örüntüsü — çevre kuralı',
    },
    16: {
      text: 'Örüntüdeki birim sayısını adım sayısına göre veren kural aşağıdakilerden hangisi olabilir? (Görsele bakınız.)',
      options: ['2 × (Adım Sayısı) + 1', '40 × (Adım Sayısı)', '20 × (Adım Sayısı) + 20', '60 × (Adım Sayısı) − 20'],
      correctAnswer: '2 × (Adım Sayısı) + 1',
      solution: '1. İlk birkaç adımdaki birim sayılarını listeleyin.\n2. n. adım için genel kuralı kurun.\n3. Doğru cevap A) 2 × (Adım Sayısı) + 1 şıkkıdır.',
      visualPrompt: 'PDF şekil örüntüsü — cebirsel kural',
    },
    17: {
      text: 'Üçüncü adımları eşit olan iki örüntü görselde verilmiştir. Örüntüler eşit adımları üst üste gelecek şekilde birleştirildiğinde kurdele örüntüsü oluşur. Buna göre hangi şekil kurdele örüntüsü değildir?',
      options: ['Şekil I', 'Şekil II', 'Şekil III', 'Şekil IV'],
      correctAnswer: 'Şekil III',
      solution: '1. Kurdele örüntüsünde iki örüntünün eşit adımları üst üste gelmelidir.\n2. Seçenekleri görselle karşılaştırın.\n3. Bu koşulu sağlamayan şekli işaretleyin.',
      visualPrompt: 'PDF kurdele örüntüsü — iki görsel birleşimi',
    },
    18: {
      text: 'Görselde verilen sayı/şekil örüntüsü ile ilgili soruyu cevaplayınız. (Görsele bakınız.)',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      solution: '1. Görseldeki örüntü kuralını belirleyin.\n2. İstenen adım veya terim için kuralı uygulayın.\n3. Sonucu şıklarla eşleştirin.',
      visualPrompt: 'PDF örüntü — sayı/şekil dizisi',
    },
    19: {
      text: 'Derin, renkleri farklı kartonlardan üçgen ve daire keserek ilk üç adımı görselde verilen şekil örüntüsünü oluşturmuştur. Buna göre 4. adımda kaç adet üçgen vardır?',
      options: ['4', '5', '6', '7'],
      correctAnswer: '5',
      solution: '1. Her adımda üçgen sayısındaki artış kuralını inceleyin.\n2. 4. adım için kuralı uygulayın.\n3. Doğru cevap 5 adet üçgendir.',
      visualPrompt: 'PDF üçgen-daire şekil örüntüsü',
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
      solution: '1. Görselden kibrit çöpü sayısı kuralını çıkarın.\n2. Her ifadeyi kurala göre doğrulayın.\n3. Kurala uymayan (yanlış) ifadeyi seçin.',
      visualPrompt: 'PDF kibrit çöpü şekil örüntüsü',
    },
    21: {
      text: 'Kutularla oluşturulan bir şekil örüntüsünün ilk üç adımı görselde verilmiştir. Buna göre 4. adımda kaç kutu kullanılır?',
      options: ['8', '10', '12', '14'],
      correctAnswer: '10',
      solution: '1. Görseldeki kutu sayısı artışını inceleyin.\n2. 4. adım için kuralı uygulayın.\n3. Doğru cevabı şıklarla eşleştirin.',
      visualPrompt: 'PDF kutu şekil örüntüsü',
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

function isBrokenText(text) {
  const t = String(text || '').trim();
  if (t.length < 25) return true;
  if (/^[\d\sXX]+$/i.test(t)) return true;
  if (/^il\s*$/im.test(t)) return true;
  if (/38\s+38\s+XX/i.test(t)) return true;
  if (/Bi JL|Ük I|Verititiiptil|üçaen|olustiir/i.test(t)) return true;
  if (/^[A-D]\)[^\n]{0,5}$/i.test(t) && t.length < 40) return true;
  return false;
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

function toOptionDocs(options) {
  return options.map((text) => ({
    text,
    image: '',
    imageKey: '',
    imageProvider: '',
  }));
}

async function repairOne(q, curated) {
  const seq = q.assessmentMeta?.sequenceIndex;
  const crop = cropPathForSequence(q.classLevel, seq);
  const fix = curated || null;
  const needsTextFix = fix || isBrokenText(q.text);

  if (!needsTextFix && !crop) return false;

  const updates = {};

  if (fix) {
    updates.text = fix.text;
    updates.options = toOptionDocs(fix.options);
    updates.correctAnswer = fix.correctAnswer;
    updates.solution = fix.solution;
    updates.visualPrompt = fix.visualPrompt || 'PDF diyagram / şekil örüntüsü';
  } else if (isBrokenText(q.text)) {
    updates.text = `${q.classLevel} örüntü sorusu ${seq}. Görselde verilen örüntüye göre cevaplayınız.`;
    updates.visualPrompt = 'PDF diyagram / şekil örüntüsü';
  }

  if (crop) {
    try {
      const uploaded = await uploadCrop(crop, q.classLevel, seq);
      updates.image = uploaded.url;
      updates.imageKey = uploaded.key;
      updates.imageProvider = uploaded.provider;
    } catch (err) {
      console.warn(`  görsel yüklenemedi ${q.classLevel} #${seq}:`, err.message);
    }
  }

  if (!Object.keys(updates).length) return false;

  updates['assessmentMeta.repairedAt'] = new Date().toISOString();
  await Question.updateOne({ _id: q._id }, { $set: updates });
  return true;
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_REPAIR || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_PDF_REPAIR=${CONFIRM} node scripts/import/repairPatternPdfVisualQuestions.js`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });

  const questions = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' })
    .sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let repaired = 0;
  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex;
    const classCurated = CURATED[q.classLevel] || {};
    const fix = classCurated[seq];
    const shouldFix = fix || isBrokenText(q.text) || (q.difficulty === 'Zor' && q.classLevel === '5. Sınıf' && seq >= 15);

    if (!shouldFix) continue;

    const ok = await repairOne(q, fix);
    if (ok) {
      repaired += 1;
      console.log(`  ✓ ${q.classLevel} #${seq} ${q.difficulty}`);
    }
  }

  console.log(JSON.stringify({ repaired, total: questions.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
