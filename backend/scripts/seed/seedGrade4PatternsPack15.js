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
      `Teacher user not found: ${email}. First run "npm run setup:ilkokul" (or create/approve a Matematik teacher) then rerun this seed.`
    );
  }
  return teacher;
}

const PACK_ID = 'grade4-patterns-oruntuler-pack-15';
const MEB_REFERENCE = 'MEB Matematik Öğretim Programı (2018) - mufredat.meb.gov.tr ProgramDetay.aspx?PID=329';
const LEARNING_OUTCOME =
  'Sayı örüntülerinin kuralını tablo, sözel ifade ve örnek terimler üzerinden geneller.';
const CURRICULUM_NOTE =
  'Kural bulma ve istenen terimi belirleme becerisi güçlendirilir.';

function mc(text, options, correct, difficulty, metaCode, metaLevel, hint, solution) {
  return {
    text,
    subject: 'Matematik',
    topic: 'Örüntüler',
    classLevel: '4. Sınıf',
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
      '6, 12, 18, 24, __ örüntüsünde boşluğa hangisi gelir?',
      ['28', '30', '32', '36'],
      '30',
      'Kolay',
      'P-A1',
      'Kolay',
      '+6 kuralı',
      '1) Fark: +6\n2) 24+6=30'
    ),
    mc(
      '12, 15, 18, 21, __ örüntüsünde boşluğa hangisi gelir?',
      ['22', '23', '24', '25'],
      '24',
      'Kolay',
      'P-A1',
      'Kolay',
      '+3 kuralı',
      '1) Fark: +3\n2) 21+3=24'
    ),
    mc(
      '5, 10, 15, 20, __ örüntüsünde boşluğa hangisi gelir?',
      ['22', '24', '25', '30'],
      '25',
      'Kolay',
      'P-A1',
      'Kolay',
      '+5 kuralı',
      '1) Fark: +5\n2) 20+5=25'
    ),
    mc(
      '🔵 🟡 🔵 🟡 🔵 __ örüntüsünde boşluğa hangisi gelir?',
      ['🔵', '🟡', '🟢', '🔴'],
      '🟡',
      'Kolay',
      'P-E1',
      'Kolay',
      '🔵🟡 tekrar',
      '1) 🔵 sonra 🟡\n2) 🔵’den sonra 🟡 gelir'
    ),
    mc(
      '20, 18, 16, 14, __ örüntüsünde boşluğa hangisi gelir?',
      ['13', '12', '11', '10'],
      '12',
      'Kolay',
      'P-A2',
      'Kolay',
      '-2 kuralı',
      '1) Fark: -2\n2) 14-2=12'
    ),
    mc(
      '3, 6, 9, 12, 14, 18 örüntüsünde yanlış sayı hangisidir?',
      ['6', '12', '14', '18'],
      '14',
      'Orta',
      'P-F1',
      'Kolay-Orta',
      '+3 olmalı',
      '1) +3 gidiyor\n2) 12’den sonra 15\n3) 14 yanlış'
    ),
    mc(
      '4, 8, 12, 16,… örüntüsünün kuralı hangisidir?',
      ['Her adımda 2 artar', 'Her adımda 3 artar', 'Her adımda 4 artar', 'Her adımda 5 artar'],
      'Her adımda 4 artar',
      'Orta',
      'P-B1',
      'Orta',
      'Farkı bul',
      '1) 8-4=4\n2) Sabit fark 4\n3) Kural: +4'
    ),
    mc(
      '9, 18, 27, 36,… örüntüsünde 6. terim kaçtır?',
      ['45', '54', '63', '72'],
      '54',
      'Orta',
      'P-C1',
      'Orta',
      '9×n',
      '1) n. terim = 9×n\n2) 9×6=54'
    ),
    mc(
      '50, 45, 40, 35, __ örüntüsünde boşluğa hangisi gelir?',
      ['34', '33', '32', '30'],
      '30',
      'Orta',
      'P-A2',
      'Orta',
      '-5 kuralı',
      '1) Fark: -5\n2) 35-5=30'
    ),
    mc(
      '2, 5, 10, 17, __ örüntüsünde boşluğa hangisi gelir?',
      ['24', '26', '27', '28'],
      '26',
      'Orta',
      'P-D1',
      'Orta',
      'Artışlar 3,5,7,9',
      '1) Farklar: +3, +5, +7\n2) 17+9=26'
    ),
    mc(
      'Bir örüntüde adımlar: 1. adım 4, 2. adım 8, 3. adım 12, 4. adım 16. Bu örüntünün kuralı hangisidir?',
      ['Her adımda 2 artar', 'Her adımda 3 artar', 'Her adımda 4 artar', 'Her adımda 5 artar'],
      'Her adımda 4 artar',
      'Orta',
      'P-D2',
      'Orta',
      '+4 kuralı',
      '1) 8-4=4\n2) Sabit fark 4\n3) Kural: +4'
    ),
    mc(
      '7, 14, 21, 28,… örüntüsünde 8. terim kaçtır?',
      ['49', '56', '63', '70'],
      '56',
      'Zor',
      'P-C1',
      'Orta-Zor',
      '7×n',
      '1) n. terim = 7×n\n2) 7×8=56'
    ),
    mc(
      'A örüntüsü: 3, 6, 9, 12,… B örüntüsü: 3, 7, 11, 15,… Hangisi daha hızlı artar?',
      ['A', 'B', 'İkisi aynı', 'Anlaşılamaz'],
      'B',
      'Zor',
      'P-E2',
      'Zor',
      '+4 > +3',
      '1) A:+3\n2) B:+4\n3) Hızlı: B'
    ),
    mc(
      'Bir öğrenci “6, 12, 18, 24,… örüntüsünde 10. terim 6+10=16’dır” diyor. Bu iddia için en doğru seçenek hangisidir?',
      ['Doğru', 'Yanlış, çünkü artış 6 değil', 'Yanlış, çünkü kural 6×n olmalı', 'Yanlış, çünkü örüntü azalan'],
      'Yanlış, çünkü kural 6×n olmalı',
      'Zor',
      'P-F2',
      'Zor',
      '6×n kuralı',
      '1) Doğru kural: 6×n\n2) 10. terim = 60\n3) Öğrenci yanlış'
    ),
    mc(
      'Bir bahçıvan her hafta 5 fidan daha fazla dikiyor. 1. hafta 10, 2. hafta 15, 3. hafta 20 fidan dikti. 6. hafta kaç fidan diker?',
      ['25', '30', '35', '40'],
      '35',
      'Zor',
      'P-H1',
      'Zor',
      '10+5(n-1)',
      '1) Her hafta +5\n2) 6. hafta = 10+5×5\n3) 35 fidan'
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
      classLevel: '4. Sınıf',
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

module.exports = { buildQuestions, PACK_ID };
