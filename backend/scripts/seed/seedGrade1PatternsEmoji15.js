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

const PACK_ID = 'grade1-patterns-oruntuler-emoji-15';
const MEB_REFERENCE = 'MEB Matematik Öğretim Programı (2018) - mufredat.meb.gov.tr ProgramDetay.aspx?PID=329';
const LEARNING_OUTCOME =
  'Tekrarlayan nesne, şekil ve sayı örüntülerini fark eder; örüntüyü aynı kuralla sürdürür.';
const CURRICULUM_NOTE =
  'Somut materyallerle tekrar eden örüntüyü bulma ve eksik öğeyi tamamlama odaklıdır.';

function mc(text, options, correct, difficulty, metaCode, metaLevel, hint, solution) {
  return {
    text,
    subject: 'Matematik',
    topic: 'Örüntüler',
    classLevel: '1. Sınıf',
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
      code: metaCode, // e.g. P-A1
      level: metaLevel, // e.g. Kolay / Orta / Zor / Kolay-Orta
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
      '10, 9, 8, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['7, 6', '9, 10', '8, 8', '6, 7'],
      '7, 6',
      'Kolay',
      'P-A1',
      'Kolay',
      '-1 kuralı',
      '1) Fark: -1\n2) 8-1=7\n3) 7-1=6'
    ),
    mc(
      '🔴 🔵 🔴 🔵 🔴 🔵 örüntüsü aşağıdakilerden hangisidir?',
      ['Azalan sayı örüntüsü', 'Artan sayı örüntüsü', 'Tekrar eden şekil örüntüsü', 'Rastgele dizilim'],
      'Tekrar eden şekil örüntüsü',
      'Kolay',
      'P-E1',
      'Kolay',
      '🔴🔵 tekrar',
      '1) 🔴 sonra 🔵\n2) Aynı sıra tekrar\n3) Şekil örüntüsü'
    ),
    mc(
      'ABAB biçiminde giden örüntüde “A=🟥, B=🔵” ise devamı hangisi olur? 🟥 🔵 🟥 🔵 __ __',
      ['🟥 🔵', '🔵 🟥', '🟥 🟥', '🔵 🔵'],
      '🟥 🔵',
      'Kolay',
      'P-A1',
      'Kolay',
      'ABAB devam',
      '1) A=🟥, B=🔵\n2) ABAB\n3) Sonraki: 🟥 🔵'
    ),
    mc(
      '1, 3, 5, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['6, 7', '7, 9', '5, 5', '2, 4'],
      '7, 9',
      'Kolay',
      'P-A1',
      'Kolay',
      '+2 kuralı',
      '1) Fark: +2\n2) 5+2=7\n3) 7+2=9'
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
      '4, 7, 10, 13, 16 örüntüsünün kuralı hangisine uygundur?',
      ['Her adımda 1 artar', 'Her adımda 2 artar', 'Her adımda 3 artar', 'Her adımda 4 artar'],
      'Her adımda 3 artar',
      'Orta',
      'P-B1',
      'Orta',
      'Farkı bul',
      '1) 7-4=3\n2) Sabit fark 3\n3) Kural: +3'
    ),
    mc(
      '20, 18, 16, 14, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['13, 12', '12, 10', '11, 9', '15, 14'],
      '12, 10',
      'Orta',
      'P-A1',
      'Orta',
      '-2 kuralı',
      '1) Fark: -2\n2) 14-2=12\n3) 12-2=10'
    ),
    mc(
      '5, 10, 15, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['20, 25', '18, 21', '16, 17', '25, 30'],
      '20, 25',
      'Orta',
      'P-A1',
      'Orta',
      '+5 kuralı',
      '1) Fark: +5\n2) 15+5=20\n3) 20+5=25'
    ),
    mc(
      'Aşağıdaki örüntülerden hangisi azalan örüntüdür?',
      ['2, 4, 6, 8', '9, 7, 5, 3', '🟢 🔶 🟢 🔶', '1, 3, 6, 10'],
      '9, 7, 5, 3',
      'Orta',
      'P-E1',
      'Orta',
      'Azalanı seç',
      '1) Azalan: küçülür\n2) 9,7,5,3 -2\n3) Doğru: B'
    ),
    mc(
      '1, 4, 7, 10, __ örüntüsünde boşluğa hangisi gelir?',
      ['11', '12', '13', '14'],
      '13',
      'Orta',
      'P-A1',
      'Orta',
      '+3 kuralı',
      '1) Fark: +3\n2) 10+3=13'
    ),
    mc(
      '🔺 🔺 🔵 🔵 🔺 🔺 🔵 🔵 örüntüsünün devamında sıradaki iki şekil hangisidir?',
      ['🔺 🔺', '🔵 🔵', '🔺 🔵', '🔵 🔺'],
      '🔵 🔵',
      'Orta',
      'P-F1',
      'Orta',
      '🔺🔺🔵🔵 döngü',
      '1) Döngü: 🔺🔺🔵🔵\n2) Tekrar eder\n3) Sıradaki: 🔵 🔵'
    ),
    mc(
      '2, 5, 8, 11, __, __ örüntüsünde boşluklara hangisi gelir?',
      ['12, 13', '13, 16', '14, 17', '15, 18'],
      '14, 17',
      'Zor',
      'P-A1',
      'Zor',
      '+3 kuralı',
      '1) Fark: +3\n2) 11+3=14\n3) 14+3=17'
    ),
    mc(
      'Aşağıdakilerden hangisi “Her adımda 4 azalır” kuralına uygun bir örüntüdür?',
      ['20, 16, 12, 8', '20, 17, 14, 11', '20, 15, 10, 5', '20, 18, 16, 14'],
      '20, 16, 12, 8',
      'Zor',
      'P-B1',
      'Zor',
      '-4 olmalı',
      '1) Fark -4\n2) 20→16→12→8\n3) Doğru: A'
    ),
    mc(
      'A örüntüsü: 2, 4, 6, 8,… B örüntüsü: 3, 6, 9, 12,… Hangisi daha hızlı artar?',
      ['A', 'B', 'İkisi aynı', 'Anlaşılamaz'],
      'B',
      'Zor',
      'P-E2',
      'Zor',
      '+3 > +2',
      '1) A:+2\n2) B:+3\n3) Hızlı: B'
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
      classLevel: '1. Sınıf',
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

