/**
 * 1. Sınıf — soru çeşidi başına örnek egzersiz paketleri (5 adet).
 * Önce soru paketi gerekir: npm run seed:grade1-exercise-types-ai
 *
 * Çalıştır: npm run seed:grade1-exercises-demo
 * Prod: SEED_TEACHER_EMAIL=ogretmen@mail.com npm run seed:grade1-exercises-demo
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Question = require('../../models/Question');
const Exercise = require('../../models/Exercise');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const QUESTION_PACK_ID = 'grade1-exercise-types-ai-25';
const DEMO_TAG = '[demo:grade1-types]';

const DEMO_EXERCISES = [
  {
    name: '1. Sınıf — Çoktan seçmeli (AI örnek)',
    type: 'multiple-choice',
    topic: 'Örüntüler',
  },
  {
    name: '1. Sınıf — Doğru / Yanlış (AI örnek)',
    type: 'true-false',
    topic: 'Örüntüler',
  },
  {
    name: '1. Sınıf — Boşluk doldurma (AI örnek)',
    type: 'fill-blank',
    topic: 'Örüntüler',
  },
  {
    name: '1. Sınıf — Eşleştirme (AI örnek)',
    type: 'matching',
    topic: 'Örüntüler — Sınıflama (eşleştirme)',
  },
  {
    name: '1. Sınıf — Sıralama (AI örnek)',
    type: 'sequence',
    topic: 'Örüntüler — Çözüm adımları (sıralama)',
  },
];

function getMongoConfig() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
  return { uri, dbName };
}

async function resolveTeachers() {
  const email = (process.env.SEED_TEACHER_EMAIL || '').trim();
  if (email) {
    const teacher = await User.findOne({ email, role: 'teacher' }).select('_id email name');
    if (!teacher) throw new Error(`Teacher not found: ${email}`);
    return [teacher];
  }

  const allTeachers = await User.find({ role: 'teacher' }).select('_id email name').limit(50);
  if (allTeachers.length > 0) return allTeachers;

  throw new Error('No teacher user found. Run npm run seed:patterns or seed:login-users first.');
}

async function createDemoExercisesForTeacher(teacher) {
  await Exercise.deleteMany({
    createdBy: teacher._id,
    classLevel: '1. Sınıf',
    description: { $regex: `^${DEMO_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
  });

  const created = [];

  for (const spec of DEMO_EXERCISES) {
    const questions = await Question.find({
      'assessmentMeta.packId': QUESTION_PACK_ID,
      classLevel: '1. Sınıf',
      type: spec.type,
    })
      .select('_id difficulty')
      .lean();

    if (questions.length === 0) {
      console.warn(`Skip ${spec.name}: no questions for type ${spec.type}`);
      continue;
    }

    const questionIds = questions.map((q) => q._id);
    const difficulties = [...new Set(questions.map((q) => q.difficulty).filter(Boolean))];

    const exercise = await Exercise.create({
      name: spec.name,
      description: `${DEMO_TAG} AI etiketli soru çeşidi örneği`,
      classLevel: '1. Sınıf',
      subject: 'Matematik',
      topic: spec.topic,
      difficulty: difficulties.length ? difficulties : ['Kolay'],
      questions: questionIds,
      totalQuestions: questionIds.length,
      createdBy: teacher._id,
      gameMode: 'practice',
      playTransform: 'classic',
      pointsPerQuestion: 10,
      isActive: true,
    });

    created.push({
      id: String(exercise._id),
      name: exercise.name,
      questions: questionIds.length,
      type: spec.type,
    });
  }

  return created;
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });

  try {
    const poolCount = await Question.countDocuments({ 'assessmentMeta.packId': QUESTION_PACK_ID });
    if (poolCount < 25) {
      console.error(
        `Önce soru paketini yükleyin: npm run seed:grade1-exercise-types-ai (${poolCount}/25 soru)`,
      );
      process.exit(1);
    }

    const teachers = await resolveTeachers();
    const summary = [];

    for (const teacher of teachers) {
      const created = await createDemoExercisesForTeacher(teacher);
      summary.push({ teacher: teacher.email, exercises: created.length, items: created });
    }

    console.log(
      JSON.stringify(
        {
          db: dbName,
          questionPack: QUESTION_PACK_ID,
          teachers: summary,
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

module.exports = { createDemoExercisesForTeacher, DEMO_EXERCISES, DEMO_TAG, QUESTION_PACK_ID };
