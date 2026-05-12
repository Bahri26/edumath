const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Question = require('../../models/Question');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function getMongoConfig() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
  return { uri, dbName };
}

async function requireTeacher() {
  const email = process.env.SEED_TEACHER_EMAIL || 'teacher@edumath.local';
  const teacher = await User.findOne({ email }).select('_id email role branch branchApproval status');
  if (!teacher) {
    throw new Error(
      `Teacher user not found: ${email}. First run "npm run seed:patterns" (or create/approve a Matematik teacher) then rerun this seed.`
    );
  }
  return teacher;
}

const PACK_ID = 'grade2-patterns-oruntuler-pack-15';
const MEB_REFERENCE = 'MEB Matematik Öğretim Programı (2018) - mufredat.meb.gov.tr ProgramDetay.aspx?PID=329';
const LEARNING_OUTCOME =
  'Sayı ve şekil örüntülerinde kuralı açıklar, eksik veya sonraki öğeyi belirler.';
const CURRICULUM_NOTE =
  'Ritmik sayma ile şekil örüntüsünü ilişkilendirir; artış miktarını sözel ifade eder.';

function mc(text, options, correct, difficulty, metaCode, metaLevel, hint, solution) {
  return {
    text,
    subject: 'Matematik',
    topic: 'Örüntüler',
    classLevel: '2. Sınıf',
    difficulty,
    type: 'multiple-choice',
    source: 'Manuel',
    learningOutcome: LEARNING_OUTCOME,
    mebReference: MEB_REFERENCE,
    curriculumNote: CURRICULUM_NOTE,
    options: options.map((t) => ({ text: t })),
    correctAnswer: correct,
    solution: solution || '',
    assessmentMeta: {
      packId: PACK_ID,
      code: metaCode,
      level: metaLevel,
      hint: hint || '',
    },
  };
}

function buildQuestions() {
  return [
    mc(
      '2, 4, 6, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['7, 8', '8, 10', '6, 6', '5, 7'],
      '8, 10',
      'Kolay',
      'P-A1',
      'Kolay',
      '+2 kuralı',
      '1) Fark: +2\n2) 6+2=8\n3) 8+2=10'
    ),
    mc(
      '5, 10, 15, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['16, 17', '18, 21', '20, 25', '25, 35'],
      '20, 25',
      'Kolay',
      'P-A1',
      'Kolay',
      '+5 kuralı',
      '1) Fark: +5\n2) 15+5=20\n3) 20+5=25'
    ),
    mc(
      '20, 18, 16, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['15, 14', '14, 12', '13, 11', '12, 9'],
      '14, 12',
      'Kolay',
      'P-A1',
      'Kolay',
      '-2 kuralı',
      '1) Fark: -2\n2) 16-2=14\n3) 14-2=12'
    ),
    mc(
      '🟥 🔵 🟥 🔵 🟥 🔵 örüntüsü aşağıdakilerden hangisidir?',
      ['Azalan sayı örüntüsü', 'Artan sayı örüntüsü', 'Tekrar eden şekil örüntüsü', 'Karışık dizilim'],
      'Tekrar eden şekil örüntüsü',
      'Kolay',
      'P-E1',
      'Kolay',
      '🟥🔵 tekrar',
      '1) 🟥 sonra 🔵\n2) Aynı sıra tekrar\n3) Şekil örüntüsü'
    ),
    mc(
      '🔺 🔺 🔵 🔺 🔺 🔵 🔺 🔺 🔵 örüntüsünde sıradaki iki şekil hangisidir?',
      ['🔵 🔵', '🔺 🔺', '🔺 🔵', '🔵 🔺'],
      '🔺 🔺',
      'Kolay',
      'P-A1',
      'Kolay',
      '🔺🔺🔵 döngü',
      '1) Döngü: 🔺🔺🔵\n2) Tekrar eder\n3) Sonraki: 🔺 🔺'
    ),
    mc(
      '3, 6, 9, 12, 14, 18 örüntüsünde yanlış sayı hangisidir?',
      ['12', '14', '18', '9'],
      '14',
      'Orta',
      'P-F1',
      'Kolay-Orta',
      '+3 olmalı',
      '1) +3 gidiyor\n2) 12’den sonra 15\n3) 14 yanlış'
    ),
    mc(
      'Ayşe her gün kumbarasına 2 TL atıyor. 1. gün 2 TL, 2. gün 4 TL, 3. gün 6 TL oluyor. 5. gün kaç TL olur?',
      ['8', '10', '12', '14'],
      '10',
      'Orta',
      'P-H1',
      'Orta',
      '+2 her gün',
      '1) 1.gün 2\n2) 5.gün = 2×5\n3) 10 TL'
    ),
    mc(
      'Saat 09:00’dan itibaren her 5 dakikada bir zil çalıyor: 09:00, 09:05, 09:10, __, __ Boşluklara hangisi gelir?',
      ['09:12, 09:14', '09:15, 09:20', '09:20, 09:25', '09:30, 09:35'],
      '09:15, 09:20',
      'Orta',
      'P-H1',
      'Orta',
      '+5 dk',
      '1) 09:10+5=09:15\n2) 09:15+5=09:20'
    ),
    mc(
      '30, 25, 20, 15, __ örüntüsünde boşluğa hangisi gelir?',
      ['12', '10', '11', '9'],
      '10',
      'Orta',
      'P-A2',
      'Orta',
      '-5 kuralı',
      '1) Fark: -5\n2) 15-5=10'
    ),
    mc(
      'A örüntüsü: 2, 4, 6, 8,… B örüntüsü: 3, 6, 9, 12,… Hangisi daha hızlı artar?',
      ['A', 'B', 'İkisi aynı', 'Anlaşılamaz'],
      'B',
      'Orta',
      'P-E2',
      'Orta',
      '+3 > +2',
      '1) A:+2\n2) B:+3\n3) Hızlı: B'
    ),
    mc(
      '1, 6, 11, 16,… örüntüsünün kuralı hangisidir?',
      ['Her adımda 1 artar', 'Her adımda 3 artar', 'Her adımda 5 artar', 'Her adımda 10 artar'],
      'Her adımda 5 artar',
      'Orta',
      'P-B1',
      'Orta',
      'Farkı bul',
      '1) 6-1=5\n2) Sabit fark 5\n3) Kural: +5'
    ),
    mc(
      'Bir örüntüde adımlar şöyle: 1. adım: 🔴, 2. adım: 🔴 🔴, 3. adım: 🔴 🔴 🔴. Buna göre 5. adımda kaç 🔴 olur?',
      ['3', '4', '5', '6'],
      '5',
      'Zor',
      'P-D1',
      'Orta-Zor',
      'n. adım = n 🔴',
      '1) 1→1, 2→2, 3→3\n2) 5. adım → 5'
    ),
    mc(
      'Bir öğrenci “2, 4, 6, 8, … örüntüsünün 10. terimi 2+10=12’dir” diyor. Bu öğrenci hangi terimi doğru bulur?',
      ['1. terim', '2. terim', '3. terim', 'Hiçbiri'],
      'Hiçbiri',
      'Zor',
      'P-F2',
      'Zor',
      'Kural 2×n değil.',
      '1) Doğru: 2×n\n2) Öğrenci: 2+n\n3) Bu kural doğru değil → Hiçbiri'
    ),
    mc(
      'Aşağıdakilerden hangisi tekrar eden örüntüdür?',
      ['1, 3, 6, 10', '10, 8, 6, 4', '🟢 🔶 🟢 🔶 🟢 🔶', '2, 5, 8, 11'],
      '🟢 🔶 🟢 🔶 🟢 🔶',
      'Zor',
      'P-E3',
      'Zor',
      'Aynı sıra tekrar',
      '1) 🟢🔶 tekrar ediyor\n2) Doğru: C'
    ),
    mc(
      'Bir otobüste koltuk numaraları 2’şer artıyor: 2, 4, 6, 8, … Bu örüntüde 7. koltuk numarası kaçtır?',
      ['12', '14', '16', '18'],
      '14',
      'Zor',
      'P-H1',
      'Zor',
      '1.koltuk=2, +2',
      '1) 7. koltuk = 2 + 6×2\n2) 14'
    ),
  ];
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });

  try {
    const teacher = await requireTeacher();

    await Question.deleteMany({
      subject: 'Matematik',
      classLevel: '2. Sınıf',
      createdBy: teacher._id,
      'assessmentMeta.packId': PACK_ID,
    });

    const docs = buildQuestions().map((q) => ({
      ...q,
      createdBy: teacher._id,
    }));

    const inserted = await Question.insertMany(docs);

    console.log(JSON.stringify({
      db: dbName,
      teacher: { email: teacher.email, id: String(teacher._id) },
      inserted: inserted.length,
      packId: PACK_ID,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

