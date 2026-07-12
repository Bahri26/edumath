/**
 * Tüm egzersizleri siler; 1–12 için tip başına 1 egzersiz oluşturur (öğretmen başına 48).
 * Önce: npm run seed:exercise-types
 *
 * Çalıştır: npm run seed:exercises-by-grade
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Question = require('../../models/Question');
const Exercise = require('../../models/Exercise');
const {
  PACK_ID,
  TYPE_LABELS,
  GRADE_META,
  classLevel,
} = require('./seedExerciseTypesContent');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const DEMO_TAG = '[exercise-types-v1]';
const TYPES = ['multiple-choice', 'true-false', 'fill-blank', 'matching'];

function getMongoConfig() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
  return { uri, dbName };
}

async function resolveTeachers() {
  const single = (process.env.SEED_TEACHER_EMAIL || '').trim();
  if (single) {
    const teacher = await User.findOne({ email: single }).select('_id email name role');
    if (teacher) return [teacher];
  }

  const emails = [
    'bahadir26@hotmail.com',
    'bahadirteacher@edumath.local',
    'emre@gmail.com',
    'teacher@edumath.local',
  ];
  const byEmail = await User.find({ email: { $in: emails } }).select('_id email name role');
  const byRole = await User.find({ role: 'teacher' }).select('_id email name role').limit(100);
  const map = new Map();
  for (const u of [...byEmail, ...byRole]) map.set(String(u._id), u);
  const all = [...map.values()];
  if (all.length > 0) return all;

  throw new Error('No teacher user found. Run npm run seed:login-users first.');
}

async function createExercisesForTeacher(teacher) {
  const created = [];

  for (let grade = 1; grade <= 12; grade += 1) {
    const level = classLevel(grade);
    const topic = GRADE_META[grade].topic;

    for (const type of TYPES) {
      const questions = await Question.find({
        'assessmentMeta.packId': PACK_ID,
        classLevel: level,
        type,
      })
        .select('_id difficulty')
        .lean();

      if (questions.length === 0) {
        console.warn(`Skip ${level} ${type}: no questions`);
        continue;
      }

      const questionIds = questions.map((q) => q._id);
      const difficulties = [...new Set(questions.map((q) => q.difficulty).filter(Boolean))];

      const exercise = await Exercise.create({
        name: `${level} — ${TYPE_LABELS[type]}`,
        description: `${DEMO_TAG} ${topic} · ${TYPE_LABELS[type]} alıştırması`,
        classLevel: level,
        subject: 'Matematik',
        topic,
        difficulty: difficulties.length ? difficulties : ['Kolay'],
        questions: questionIds,
        totalQuestions: questionIds.length,
        createdBy: teacher._id,
        gameMode: 'practice',
        playTransform: 'game_show',
        pointsPerQuestion: 10,
        isActive: true,
      });

      created.push({
        id: String(exercise._id),
        name: exercise.name,
        questions: questionIds.length,
        type,
      });
    }
  }

  return created;
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 20000 });

  try {
    const poolCount = await Question.countDocuments({ 'assessmentMeta.packId': PACK_ID });
    if (poolCount < 240) {
      console.error(`Önce soruları yükleyin: npm run seed:exercise-types (${poolCount}/240)`);
      process.exit(1);
    }

    const wiped = await Exercise.deleteMany({});
    const teachers = await resolveTeachers();
    const summary = [];

    for (const teacher of teachers) {
      const created = await createExercisesForTeacher(teacher);
      summary.push({ teacher: teacher.email, exercises: created.length });
    }

    console.log(
      JSON.stringify(
        {
          db: dbName,
          questionPack: PACK_ID,
          exercisesDeleted: wiped.deletedCount,
          teachers: summary,
          expectedPerTeacher: 48,
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

module.exports = { main, createExercisesForTeacher, DEMO_TAG, PACK_ID };
