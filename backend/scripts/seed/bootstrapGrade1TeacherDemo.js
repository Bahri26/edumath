/**
 * 1. sınıf demo paketi — sorular + tüm öğretmenler için egzersizler.
 * Tek komut: npm run bootstrap:grade1-demo
 *
 * SEED_TEACHER_EMAIL=tek@mail.com  → sadece o öğretmen için egzersiz
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../../models/User');
const Question = require('../../models/Question');
const Exercise = require('../../models/Exercise');
const { buildQuestions, PACK_ID } = require('./seedGrade1ExerciseTypesAI');
const {
  createDemoExercisesForTeacher,
} = require('./seedGrade1SampleExercises');

function getMongoConfig() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI missing in .env');
  return { uri, dbName };
}

async function resolveQuestionOwner() {
  const email = (process.env.SEED_TEACHER_EMAIL || '').trim();
  if (email) {
    const t = await User.findOne({ email }).select('_id email role');
    if (t) return t;
  }
  const approved = await User.findOne({ role: 'teacher', branchApproval: 'approved' }).select('_id email');
  if (approved) return approved;
  const any = await User.findOne({ role: 'teacher' }).select('_id email');
  if (any) return any;
  throw new Error('No teacher in DB. Run: npm run seed:login-users');
}

const DEFAULT_DEMO_EMAILS = [
  'bahadir26@hotmail.com',
  'bahadirteacher@edumath.local',
  'emre@gmail.com',
  'teacher@edumath.local',
];

async function resolveExerciseTeachers() {
  const single = (process.env.SEED_DEMO_TEACHER_EMAILS || '').trim();
  if (single && !single.includes(',')) {
    const t = await User.findOne({ email: single }).select('_id email name role');
    if (!t) throw new Error(`Teacher not found: ${single}`);
    return [t];
  }

  const fromEnv = single
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const emails = fromEnv.length > 0 ? fromEnv : DEFAULT_DEMO_EMAILS;

  const byEmail = await User.find({ email: { $in: emails } }).select('_id email name role');
  const byRole = await User.find({ role: 'teacher' }).select('_id email name role').limit(100);

  const map = new Map();
  for (const u of [...byEmail, ...byRole]) {
    map.set(String(u._id), u);
  }
  const teachers = [...map.values()];
  if (teachers.length === 0) {
    throw new Error('No teacher accounts. Run: npm run seed:login-users');
  }
  return teachers;
}

async function seedQuestions(owner) {
  await Question.deleteMany({ 'assessmentMeta.packId': PACK_ID });
  const docs = buildQuestions().map((q) => ({ ...q, createdBy: owner._id }));
  const inserted = await Question.insertMany(docs);
  const byType = inserted.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});
  return { inserted: inserted.length, byType, owner: owner.email };
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 20000 });

  try {
    const owner = await resolveQuestionOwner();
    const questionResult = await seedQuestions(owner);

    const teachers = await resolveExerciseTeachers();
    const exerciseResults = [];

    for (const teacher of teachers) {
      const items = await createDemoExercisesForTeacher(teacher);
      const count = await Exercise.countDocuments({ createdBy: teacher._id });
      exerciseResults.push({
        email: teacher.email,
        demoCreated: items.length,
        totalExercises: count,
        demos: items.map((i) => i.name),
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          db: dbName,
          packId: PACK_ID,
          questions: questionResult,
          teachers: exerciseResults,
          hint: 'Sayfayı yenileyin: /teacher/exercises',
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

module.exports = { main };
