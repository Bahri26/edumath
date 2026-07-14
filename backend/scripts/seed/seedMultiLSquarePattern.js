/**
 * Çoklu soru örneği: L-kare şekil örüntüsü (ortak kök + 3 MCQ).
 * npm run seed:multi-l-pattern
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Question = require('../../models/Question');
const Exercise = require('../../models/Exercise');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const PACK_ID = 'multi-l-square-pattern-5cm';
const GROUP_ID = 'l-square-pattern-5cm';
const DEMO_TAG = '[multi:l-square-5cm]';
const IMAGE = '/uploads/patterns/l-square-pattern-5cm.svg';
const CLASS_LEVEL = '5. Sınıf';
const TOPIC = 'Şekil örüntüleri';

const SHARED_STEM =
  'Kenar uzunluğu 5 cm olan karelerle oluşturulmuş bir şekil örüntüsünün ilk üç adımı görselde verilmiştir.';
const SHARED_PROMPT = 'Aşağıdaki soruları yukarıdaki bilgilere göre cevaplayınız.';

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
  throw new Error('Teacher not found.');
}

async function resolveTeachers() {
  const single = (process.env.SEED_TEACHER_EMAIL || '').trim();
  if (single) {
    const teacher = await User.findOne({ email: single }).select('_id email name role');
    if (teacher) return [teacher];
  }
  const byRole = await User.find({ role: 'teacher' }).select('_id email name role').limit(100);
  if (byRole.length) return byRole;
  return [await requireTeacher()];
}

function buildQuestions(teacherId) {
  const items = [
    {
      groupIndex: 1,
      questionLine: 'Bu örüntüdeki kare sayısını veren kural aşağıdakilerden hangisi olabilir?',
      options: [
        '3 × (Adım Sayısı)',
        '2 × (Adım Sayısı) + 1',
        '5 × (Adım Sayısı) − 2',
        '(Adım Sayısı) + 2',
      ],
      correctAnswer: '2 × (Adım Sayısı) + 1',
      solution: '1., 2., 3. adımlarda kare sayıları 3, 5, 7’dir. Bu dizi 2n + 1 kuralına uyar.',
    },
    {
      groupIndex: 2,
      questionLine: 'Bu örüntüdeki şeklin çevre uzunluğunu veren kural aşağıdakilerden hangisi olabilir?',
      options: [
        '2 × (Adım Sayısı) + 1',
        '40 × (Adım Sayısı)',
        '20 × (Adım Sayısı) + 20',
        '60 × (Adım Sayısı) − 20',
      ],
      correctAnswer: '20 × (Adım Sayısı) + 20',
      solution:
        'Birim çevre 4n + 4’tür; kenar 5 cm olduğundan çevre (4n + 4)×5 = 20n + 20 cm olur.',
    },
    {
      groupIndex: 3,
      questionLine: 'Bu örüntünün 40. adımındaki şeklin çevre uzunluğu kaç cm’dir?',
      options: ['81', '800', '820', '1000'],
      correctAnswer: '820',
      solution: '20 × 40 + 20 = 820 cm.',
    },
  ];

  return items.map((item) => ({
    text: `${SHARED_STEM}\n\n${item.questionLine}`,
    image: IMAGE,
    imageKey: '',
    imageProvider: 'local',
    subject: 'Matematik',
    topic: TOPIC,
    classLevel: CLASS_LEVEL,
    difficulty: 'Orta',
    type: 'multiple-choice',
    interactiveType: 'none',
    options: item.options.map((text) => ({ text })),
    correctAnswer: item.correctAnswer,
    solution: item.solution,
    source: 'exercise-seed',
    createdBy: teacherId,
    learningOutcome: 'Şekil örüntüsünde kare sayısı ve çevre kuralını bulur; kuralı uygular.',
    mebReference: 'MEB Matematik — Şekil örüntüleri',
    assessmentMeta: {
      packId: PACK_ID,
      groupId: GROUP_ID,
      groupIndex: item.groupIndex,
      groupSize: 3,
      sharedStem: SHARED_STEM,
      sharedImage: IMAGE,
      sharedPrompt: SHARED_PROMPT,
      code: `L5CM-Q${item.groupIndex}`,
      parseLayout: {
        introText: SHARED_STEM,
        questionLine: item.questionLine,
      },
    },
  }));
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });

  try {
    const owner = await requireTeacher();
    await Question.deleteMany({ 'assessmentMeta.packId': PACK_ID });
    await Exercise.deleteMany({
      description: { $regex: DEMO_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') },
    });

    const docs = buildQuestions(owner._id);
    const inserted = await Question.insertMany(docs);
    const questionIds = inserted
      .sort((a, b) => a.assessmentMeta.groupIndex - b.assessmentMeta.groupIndex)
      .map((q) => q._id);

    const teachers = await resolveTeachers();
    const created = [];
    for (const teacher of teachers) {
      const exercise = await Exercise.create({
        name: `${CLASS_LEVEL} — Çoklu soru: L şekil örüntüsü`,
        description: `${DEMO_TAG} Ortak görsel + 3 çoktan seçmeli`,
        classLevel: CLASS_LEVEL,
        subject: 'Matematik',
        topic: TOPIC,
        difficulty: ['Orta'],
        questions: questionIds,
        totalQuestions: questionIds.length,
        createdBy: teacher._id,
        gameMode: 'practice',
        playTransform: 'classic',
        pointsPerQuestion: 10,
        isActive: true,
      });
      created.push({ teacher: teacher.email, id: String(exercise._id) });
    }

    console.log(
      JSON.stringify(
        {
          db: dbName,
          packId: PACK_ID,
          questions: inserted.length,
          exercises: created,
          image: IMAGE,
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

module.exports = { main, PACK_ID, GROUP_ID, buildQuestions };
