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

const PACK_ID = 'grade3-patterns-oruntuler-pack-15';
const MEB_REFERENCE = 'MEB Matematik Öğretim Programı (2018) - mufredat.meb.gov.tr ProgramDetay.aspx?PID=329';
const LEARNING_OUTCOME =
  'Artan ve azalan örüntülerde değişim miktarını belirler ve kuralı sözel olarak ifade eder.';
const CURRICULUM_NOTE =
  'Doğal sayılarla kurulan örüntülerde terimler arası farkı yorumlar.';

function mc(text, options, correct, difficulty, metaCode, metaLevel, hint, solution) {
  return {
    text,
    subject: 'Matematik',
    topic: 'Örüntüler',
    classLevel: '3. Sınıf',
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
      '3, 6, 9, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['10, 11', '11, 12', '12, 15', '12, 18'],
      '12, 15',
      'Kolay',
      'P-A1',
      'Kolay',
      '+3 kuralı',
      '1) Fark: +3\n2) 9+3=12\n3) 12+3=15'
    ),
    mc(
      '1, 4, 7, 10, __ örüntüsünde boşluğa hangisi gelir?',
      ['12', '13', '14', '15'],
      '13',
      'Kolay',
      'P-A1',
      'Kolay',
      '+3 kuralı',
      '1) Fark: +3\n2) 10+3=13'
    ),
    mc(
      '🟢 🔶 🟢 🔶 🟢 🔶 örüntüsü aşağıdakilerden hangisidir?',
      ['Artan sayı örüntüsü', 'Azalan sayı örüntüsü', 'Tekrar eden şekil örüntüsü', 'Karışık dizilim'],
      'Tekrar eden şekil örüntüsü',
      'Kolay',
      'P-E1',
      'Kolay',
      '🟢🔶 tekrar',
      '1) 🟢 sonra 🔶\n2) Aynı sıra tekrar\n3) Şekil örüntüsü'
    ),
    mc(
      '2, 5, 8, 11, __ örüntüsünde boşluğa hangisi gelir?',
      ['13', '14', '15', '16'],
      '14',
      'Kolay',
      'P-A1',
      'Kolay',
      '+3 kuralı',
      '1) Fark: +3\n2) 11+3=14'
    ),
    mc(
      '5, 10, 15, 19, 25 örüntüsünde yanlış sayı hangisidir?',
      ['10', '15', '19', '25'],
      '19',
      'Orta',
      'P-F1',
      'Kolay-Orta',
      '+5 olmalı',
      '1) +5 gidiyor\n2) 15’ten sonra 20\n3) 19 yanlış'
    ),
    mc(
      '4, 8, 12, 16,… örüntüsünün kuralı hangisidir?',
      ['Her adımda 2 artar', 'Her adımda 3 artar', 'Her adımda 4 artar', 'Her adımda 5 artar'],
      'Her adımda 4 artar',
      'Orta',
      'P-B2',
      'Orta',
      'Farkı bul',
      '1) 8-4=4\n2) Sabit fark 4\n3) Kural: +4'
    ),
    mc(
      '30, 25, 20, 15, __ Boşluğa hangisi gelir?',
      ['14', '13', '12', '10'],
      '10',
      'Orta',
      'P-A2',
      'Orta',
      '-5 kuralı',
      '1) Fark: -5\n2) 15-5=10'
    ),
    // NOTE: S8/S9 prompt adjusted to match provided answer key (C and D).
    mc(
      'Bir örüntüde adımlar şöyle:\n1. adım: 🔴 🔴\n2. adım: 🔴 🔴 🔴 🔴 🔴\n3. adım: 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴\nHer adımda kaç 🔴 artıyor?',
      ['1', '2', '3', '4'],
      '3',
      'Orta',
      'P-D1',
      'Orta',
      'Artış sabit',
      '1) 2→5 (+3)\n2) 5→8 (+3)\n3) Artış: 3'
    ),
    mc(
      'Aynı örüntüde 4. adımda kaç 🔴 olur?\n1. adım: 🔴 🔴\n2. adım: 🔴 🔴 🔴 🔴 🔴\n3. adım: 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴',
      ['8', '9', '10', '11'],
      '11',
      'Orta',
      'P-D1',
      'Orta',
      '+3 ekle',
      '1) 3. adım: 8\n2) 8+3=11'
    ),
    mc(
      'Bir örüntüde: 1. adım 6, 2. adım 9, 3. adım 12, 4. adım 15. Bu örüntünün kuralı hangisine uygundur?',
      ['Her adımda 2 artar', 'Her adımda 3 artar', 'Her adımda 4 artar', 'Her adımda 5 artar'],
      'Her adımda 3 artar',
      'Zor',
      'P-D2',
      'Orta-Zor',
      '+3 kuralı',
      '1) 9-6=3\n2) Sabit fark 3\n3) Kural: +3'
    ),
    mc(
      '10, 20, 30, 40,… örüntüsünde 7. terim kaçtır?',
      ['60', '70', '80', '90'],
      '70',
      'Zor',
      'P-C1',
      'Orta-Zor',
      '10×n',
      '1) n. terim = 10×n\n2) 10×7=70'
    ),
    mc(
      'A örüntüsü: 2, 4, 6, 8,… B örüntüsü: 2, 5, 8, 11,… Hangisi daha hızlı artar?',
      ['A', 'B', 'İkisi aynı', 'Anlaşılamaz'],
      'B',
      'Zor',
      'P-E2',
      'Zor',
      '+3 > +2',
      '1) A:+2\n2) B:+3\n3) Hızlı: B'
    ),
    mc(
      'Bir öğrenci “2, 5, 8, 11,… örüntüsünde 10. terim 3×10=30’dur” diyor. Bu iddia için en doğru seçenek hangisidir?',
      ['Doğru', 'Yanlış, çünkü artış 3 değil', 'Yanlış, çünkü başlangıç terimi dikkate alınmamış', 'Yanlış, çünkü örüntü azalan'],
      'Yanlış, çünkü başlangıç terimi dikkate alınmamış',
      'Zor',
      'P-F2',
      'Zor',
      'Başlangıç önemli',
      '1) Kural: 2+3(n-1)\n2) 3×n olmaz\n3) Başlangıç eksik'
    ),
    // NOTE: S14 prompt adjusted to match provided answer key (D=20).
    mc(
      'Bir sporcu her gün 3 tur daha fazla koşuyor. 1. gün 5 tur koştu.\nGünlere göre tur sayısı: 5, 8, 11, 14,…\n6. gün kaç tur koşar?',
      ['14', '15', '17', '20'],
      '20',
      'Zor',
      'P-H1',
      'Zor',
      '5 + 5×3',
      '1) 6. gün = 5 + 5×3\n2) 20'
    ),
    mc(
      'Aşağıdakilerden hangisi “her adımda 4 artan” bir örüntüye örnektir?',
      ['1, 4, 7, 10', '2, 6, 10, 14', '3, 5, 7, 9', '10, 9, 8, 7'],
      '2, 6, 10, 14',
      'Zor',
      'P-I',
      'Zor',
      'Fark = 4',
      '1) 6-2=4\n2) 10-6=4\n3) Uyar'
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
      classLevel: '3. Sınıf',
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

