/**
 * Tüm pattern-pdf sorularında yalnızca diyagram görseli yükler + metin/şık düzeltmeleri.
 * CONFIRM_PATTERN_PDF_DIAGRAM=YES node scripts/import/cropPatternPdfDiagramOnly.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Question = require('../../models/Question');
const { uploadBuffer, getStorageStatus } = require('../../services/storageService');
const { extractDiagramBufferFromFile } = require('../../services/questionImageCropService');
const { resolveQuestionRegion } = require('./patternPdfRegionResolver');
const { DATA_ROOT } = require('./patternPdfRegionResolver');
const sharp = require('sharp');

const CONFIRM = 'YES';

/** Tam sayfa koordinatından diyagram (soru dilimi yetersiz kaldığında) */
const PAGE_DIAGRAM_CROPS = {
  '5. Sınıf': {
    3: {
      pageFile: '5-sinif/page-01.png',
      leftRatio: 0,
      topRatio: 0.735,
      widthRatio: 0.46,
      heightRatio: 0.075,
    },
  },
};

/** Manuel metin/şık — OCR güvenilmez veya 2 sütun karışıklığı */
const CURATED = {
  '5. Sınıf': {
    1: {
      text: 'Belirli bir kurala göre dizilmiş sayılar aşağıda verilmiştir. Buna göre turuncu kare ile mavi karenin toplamı aşağıdakilerden hangisidir?',
      options: ['15', '33', '48', '52'],
      correctAnswer: '48',
      solution: '1. Sayılar 6\'şar artmaktadır: 3, 9, 15, 21, 27, 33.\n2. Turuncu kare 15, mavi kare 33\'tür.\n3. 15 + 33 = 48 → C şıkkı.',
    },
    2: {
      text: '15 — 19 — 23 — 25 — 27 — 31 sayı dizisinin bir örüntü oluşturması için hangi sayı çıkarılmalıdır?',
      options: ['15', '23', '25', '31'],
      correctAnswer: '25',
      solution: '1. Dizide 15→19→23 (+4) vardır; 25 sonrası düzensiz.\n2. 25 çıkarılırsa 15, 19, 23, 27, 31 kalır (+4).\n3. Doğru cevap C) 25.',
      skipImage: true,
    },
    3: {
      text: 'Bir kitaplığın rafında bulunan dosyaların numaraları bir örüntü oluşturmaktadır. Buna göre rafta kaç numaralı dosya bulunmaz?',
      options: ['28', '32', '35', '36'],
      correctAnswer: '35',
      solution: '1. Dosya numaraları 4\'er artmaktadır: 12, 16, 20, 24, …, 40.\n2. 28, 32, 36 dizide vardır; 35 yoktur.\n3. Doğru cevap C) 35.',
    },
    4: {
      text: 'İlk üç adımı verilen ve karelerden oluşan şekil örüntüsünde 4. adımda kaç kare kullanılır?',
      options: ['6', '7', '9', '10'],
      correctAnswer: '7',
      solution: '1. Kare sayısı 1, 3, 5, … şeklinde 2\'şer artmaktadır.\n2. 4. adım: 2×4 − 1 = 7 kare.\n3. Doğru cevap B) 7.',
    },
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

function toOptionDocs(texts) {
  return texts.map((text) => ({
    text: String(text || '').trim(),
    image: '',
    imageKey: '',
    imageProvider: '',
  }));
}

async function extractPageDiagram(classLevel, sequenceIndex) {
  const spec = PAGE_DIAGRAM_CROPS[classLevel]?.[sequenceIndex];
  if (!spec) return null;
  const pagePath = path.join(DATA_ROOT, spec.pageFile);
  if (!fs.existsSync(pagePath)) return null;
  const meta = await sharp(pagePath).metadata();
  const left = Math.floor(meta.width * spec.leftRatio);
  const top = Math.floor(meta.height * spec.topRatio);
  const width = Math.floor(meta.width * spec.widthRatio);
  const height = Math.floor(meta.height * spec.heightRatio);
  const buffer = await sharp(pagePath)
    .extract({
      left,
      top,
      width: Math.min(width, meta.width - left),
      height: Math.min(height, meta.height - top),
    })
    .png()
    .toBuffer();
  return { buffer, cropMethod: 'page-coordinate' };
}

async function uploadDiagram(buffer, classLevel, seq) {
  const safeClass = classLevel.replace(/\s+/g, '-').toLowerCase();
  return uploadBuffer(buffer, {
    originalName: `${safeClass}-pattern-q${seq}-diagram.png`,
    mimeType: 'image/png',
    prefix: 'questions/pattern-pdf',
    extension: '.png',
  });
}

async function main() {
  if (String(process.env.CONFIRM_PATTERN_PDF_DIAGRAM || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_PATTERN_PDF_DIAGRAM=${CONFIRM} node scripts/import/cropPatternPdfDiagramOnly.js`);
    process.exit(1);
  }

  const storage = getStorageStatus();
  if (!storage.cloudinaryEnabled && process.env.STORAGE_PROVIDER !== 'local') {
    console.warn('Cloudinary kapalı — STORAGE_PROVIDER=cloudinary önerilir.');
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const questions = await Question.find({ 'assessmentMeta.importSource': 'pattern-pdf-pack' })
    .sort({ classLevel: 1, 'assessmentMeta.sequenceIndex': 1 });

  let uploaded = 0;
  let cleared = 0;
  let curated = 0;

  for (const q of questions) {
    const seq = q.assessmentMeta?.sequenceIndex;
    const fix = CURATED[q.classLevel]?.[seq];
    const region = resolveQuestionRegion(q.classLevel, seq);
    const updates = {
      visualPrompt: 'PDF şekil örüntüsü — görsele bakınız',
      'assessmentMeta.diagramOnlyAt': new Date().toISOString(),
    };

    if (fix) {
      updates.text = fix.text;
      updates.options = toOptionDocs(fix.options);
      updates.correctAnswer = fix.correctAnswer;
      if (fix.solution) updates.solution = fix.solution;
      curated += 1;
    }

    if (fix?.skipImage || region.skipImage) {
      updates.image = '';
      updates.imageKey = '';
      updates.imageProvider = '';
      cleared += 1;
      console.log(`  ○ ${q.classLevel} #${seq} · metin-only (görsel yok)`);
    } else {
      const pageCrop = await extractPageDiagram(q.classLevel, seq);
      const override = region.cropPath?.replace(/\.png$/i, '-diagram.png');
      const source = override && fs.existsSync(override) ? override : region.cropPath;
      const extracted = pageCrop
        || (source ? await extractDiagramBufferFromFile(source, { column: region.column }) : null);
      if (extracted?.buffer) {
        const result = await uploadDiagram(extracted.buffer, q.classLevel, seq);
        updates.image = result.url;
        updates.imageKey = result.key;
        updates.imageProvider = result.provider;
        uploaded += 1;
        console.log(`  ✓ ${q.classLevel} #${seq} · ${extracted.cropMethod} · ${region.column}`);
      } else {
        console.warn(`  ✗ ${q.classLevel} #${seq} · diyagram çıkarılamadı`);
      }
    }

    await Question.updateOne({ _id: q._id }, { $set: updates });
  }

  console.log(JSON.stringify({ total: questions.length, uploaded, cleared, curated }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
