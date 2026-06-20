/**
 * 1. Sınıf — her soru çeşidinden 5'er AI etiketli örnek (toplam 25).
 * Çalıştır: npm run seed:grade1-exercise-types-ai
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Question = require('../../models/Question');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const PACK_ID = 'grade1-exercise-types-ai-25';
const MEB_REFERENCE = 'MEB Matematik Öğretim Programı (2018) — 1. sınıf örüntüler';
const LEARNING_OUTCOME =
  'Tekrarlayan nesne, şekil ve sayı örüntülerini fark eder; örüntüyü aynı kuralla sürdürür.';

function getMongoConfig() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
  return { uri, dbName };
}

async function requireTeacher() {
  const email = (process.env.SEED_TEACHER_EMAIL || '').trim();
  if (email) {
    const teacher = await User.findOne({ email }).select('_id email');
    if (teacher) return teacher;
  }
  const fallback = await User.findOne({ role: 'teacher', branchApproval: 'approved' }).select('_id email');
  if (fallback) return fallback;
  const any = await User.findOne({ role: 'teacher' }).select('_id email');
  if (any) return any;
  throw new Error('Teacher not found. Run npm run seed:login-users first.');
}

function base(extra) {
  return {
    subject: 'Matematik',
    topic: 'Örüntüler',
    classLevel: '1. Sınıf',
    difficulty: 'Kolay',
    source: 'AI',
    learningOutcome: LEARNING_OUTCOME,
    mebReference: MEB_REFERENCE,
    assessmentMeta: { packId: PACK_ID, generator: 'seed-grade1-types' },
    ...extra,
  };
}

function buildMultipleChoice() {
  const items = [
    ['2, 4, 6, __ örüntüsünde boşluğa hangisi gelir?', ['7', '8', '5', '6'], '8'],
    ['🔴 🔵 🔴 🔵 örüntüsü hangi türdür?', ['Tekrarlayan şekil', 'Azalan sayı', 'Rastgele', 'Kare sayı'], 'Tekrarlayan şekil'],
    ['1, 3, 5, __ örüntüsünde sıradaki sayı?', ['6', '7', '4', '8'], '7'],
    ['10, 9, 8, __ örüntüsünde sıradaki sayı?', ['7', '9', '6', '8'], '7'],
    ['🟡 🟢 🟡 🟢 🟡 __', ['🟢', '🟡', '🔴', '🔵'], '🟢'],
  ];
  return items.map(([text, opts, correct], i) =>
    base({
      text,
      type: 'multiple-choice',
      interactiveType: 'none',
      options: opts.map((t) => ({ text: t })),
      correctAnswer: correct,
      solution: `Doğru cevap: ${correct}`,
      assessmentMeta: { packId: PACK_ID, code: `MC-${i + 1}` },
    }),
  );
}

function buildTrueFalse() {
  const items = [
    ['2, 4, 6, 8 sayıları her adımda 2 artan bir örüntüdür.', 'Doğru'],
    ['🔴 🔵 🔴 🔵 dizisi tekrarlayan bir örüntüdür.', 'Doğru'],
    ['5, 4, 3, 2 dizisi her adımda 2 azalmaktadır.', 'Yanlış'],
    ['1, 1, 1, 1 dizisinde kural yoktur.', 'Yanlış'],
    ['3, 6, 9, 12 dizisi her adımda 3 artmaktadır.', 'Doğru'],
  ];
  return items.map(([text, correct], i) =>
    base({
      text,
      type: 'true-false',
      interactiveType: 'none',
      options: [{ text: 'Doğru' }, { text: 'Yanlış' }],
      correctAnswer: correct,
      solution: correct === 'Doğru' ? 'İfade doğrudur.' : 'İfade yanlıştır.',
      assessmentMeta: { packId: PACK_ID, code: `TF-${i + 1}` },
    }),
  );
}

function buildFillBlank() {
  const items = [
    ['2, 4, 6, __', '8'],
    ['1, 3, 5, __', '7'],
    ['10, 9, 8, __', '7'],
    ['5, 5, 5, __', '5'],
    ['🔴 🔵 🔴 🔵 🔴 __', '🔵'],
  ];
  return items.map(([text, correct], i) =>
    base({
      text,
      type: 'fill-blank',
      interactiveType: 'none',
      options: [],
      correctAnswer: correct,
      solution: `Boşluğa ${correct} gelir.`,
      assessmentMeta: { packId: PACK_ID, code: `FB-${i + 1}` },
    }),
  );
}

function buildMatching() {
  const sets = [
    {
      prompts: [
        { id: 'a', label: '2, 4, 2, 4, ...' },
        { id: 'b', label: '1, 3, 5, 7, ...' },
      ],
      options: ['Tekrarlayan örüntü', 'Artan sayı örüntüsü'],
      correctPairs: { a: 'Tekrarlayan örüntü', b: 'Artan sayı örüntüsü' },
    },
    {
      prompts: [
        { id: 'a', label: '🔴 🔵 🔴 🔵' },
        { id: 'b', label: '🟡 🟢 🟡 🟢' },
      ],
      options: ['Renk örüntüsü', 'Sayı örüntüsü'],
      correctPairs: { a: 'Renk örüntüsü', b: 'Renk örüntüsü' },
    },
    {
      prompts: [
        { id: 'a', label: '10, 9, 8, ...' },
        { id: 'b', label: '2, 4, 6, ...' },
      ],
      options: ['Azalan örüntü', 'Artan örüntü'],
      correctPairs: { a: 'Azalan örüntü', b: 'Artan örüntü' },
    },
    {
      prompts: [
        { id: 'a', label: '⭐ ⭐ 🌙 ⭐ ⭐ 🌙' },
        { id: 'b', label: '5, 5, 5, 5' },
      ],
      options: ['Tekrarlayan örüntü', 'Sabit sayı'],
      correctPairs: { a: 'Tekrarlayan örüntü', b: 'Sabit sayı' },
    },
    {
      prompts: [
        { id: 'a', label: '3, 6, 9, ...' },
        { id: 'b', label: '1, 2, 3, 4, ...' },
      ],
      options: ['+3 artan', '+1 artan'],
      correctPairs: { a: '+3 artan', b: '+1 artan' },
    },
  ];
  return sets.map((set, i) =>
    base({
      text: `Eşleştirme ${i + 1}: ${set.prompts.map((p) => p.label).join(' ve ')} örüntülerini türleriyle eşleştirin.`,
      type: 'matching',
      interactiveType: 'matching',
      interactionData: set,
      options: [],
      correctAnswer: '__interactive_matching__',
      solution: `Eşleştirmeler: ${JSON.stringify(set.correctPairs)}`,
      topic: 'Örüntüler — Sınıflama (eşleştirme)',
      assessmentMeta: { packId: PACK_ID, code: `MT-${i + 1}` },
    }),
  );
}

function buildSequence() {
  const specs = [
    {
      text: '2, 4, 6, 8 sayı örüntüsünü çözerken adımları sıraya koyun.',
      items: [
        { id: 'rule', label: 'Örüntüdeki kuralı bul' },
        { id: 'predict', label: 'Eksik terimi tahmin et' },
        { id: 'verify', label: 'Sonucu kontrol et' },
      ],
      correctOrder: ['rule', 'predict', 'verify'],
    },
    {
      text: '🔴 🔵 tekrar örüntüsünde adımları doğru sıraya dizin.',
      items: [
        { id: 'rule', label: 'Tekrar kuralını fark et' },
        { id: 'delta', label: 'Renk sırasını say' },
        { id: 'predict', label: 'Sıradaki rengi yaz' },
      ],
      correctOrder: ['rule', 'delta', 'predict'],
    },
    {
      text: '10, 9, 8 azalan örüntüsü için çözüm adımlarını sıralayın.',
      items: [
        { id: 'delta', label: 'Azalış farkını bul' },
        { id: 'rule', label: 'Kuralı yaz' },
        { id: 'predict', label: 'Devamını tamamla' },
      ],
      correctOrder: ['delta', 'rule', 'predict'],
    },
    {
      text: '🟡 🟢 renk örüntüsünde sonraki rengi bulmak için adımları dizin.',
      items: [
        { id: 'rule', label: 'Renk sırasını gör' },
        { id: 'predict', label: 'Sonraki rengi seç' },
      ],
      correctOrder: ['rule', 'predict'],
    },
    {
      text: '3, 6, 9 artan örüntüsünü çözmek için adımları sıraya koyun.',
      items: [
        { id: 'find', label: 'Örüntüyü incele' },
        { id: 'check', label: '+3 kuralını doğrula' },
        { id: 'apply', label: 'Kuralı uygula' },
      ],
      correctOrder: ['find', 'check', 'apply'],
    },
  ];
  return specs.map((spec, i) =>
    base({
      text: spec.text,
      type: 'sequence',
      interactiveType: 'sequence',
      interactionData: { items: spec.items, correctOrder: spec.correctOrder },
      options: [],
      correctAnswer: '__interactive_sequence__',
      solution: `Doğru sıra: ${spec.correctOrder.join(' → ')}`,
      topic: 'Örüntüler — Çözüm adımları (sıralama)',
      assessmentMeta: { packId: PACK_ID, code: `SQ-${i + 1}` },
    }),
  );
}

function buildQuestions() {
  return [
    ...buildMultipleChoice(),
    ...buildTrueFalse(),
    ...buildFillBlank(),
    ...buildMatching(),
    ...buildSequence(),
  ];
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });

  try {
    const teacher = await requireTeacher();
    await Question.deleteMany({ 'assessmentMeta.packId': PACK_ID });

    const docs = buildQuestions().map((q) => ({ ...q, createdBy: teacher._id }));
    const inserted = await Question.insertMany(docs);

    const byType = inserted.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});

    console.log(
      JSON.stringify(
        {
          db: dbName,
          packId: PACK_ID,
          inserted: inserted.length,
          byType,
          teacher: teacher.email,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { buildQuestions, PACK_ID, main };
