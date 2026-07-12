/**
 * 1–12. sınıf egzersiz soru paketi (4 tip × 5 = 20/sınıf, toplam 240).
 * Soru bankasına dokunmaz; yalnızca exercise-types pack + eski grade1 demo pack.
 *
 * Çalıştır: npm run seed:exercise-types
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Question = require('../../models/Question');
const {
  PACK_ID,
  OLD_PACK_IDS,
  buildAllQuestions,
} = require('./seedExerciseTypesContent');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

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

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });

  try {
    const teacher = await requireTeacher();

    const deleted = await Question.deleteMany({
      $or: [
        { 'assessmentMeta.packId': { $in: OLD_PACK_IDS } },
        { source: 'exercise-seed', 'assessmentMeta.packId': PACK_ID },
      ],
    });

    const docs = buildAllQuestions().map((q) => ({ ...q, createdBy: teacher._id }));
    if (docs.length !== 240) {
      throw new Error(`Expected 240 questions, got ${docs.length}`);
    }

    const inserted = await Question.insertMany(docs);
    const byGrade = {};
    const byType = {};
    for (const q of inserted) {
      byGrade[q.classLevel] = (byGrade[q.classLevel] || 0) + 1;
      byType[q.type] = (byType[q.type] || 0) + 1;
    }

    console.log(
      JSON.stringify(
        {
          db: dbName,
          packId: PACK_ID,
          deletedOld: deleted.deletedCount,
          inserted: inserted.length,
          byGrade,
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

module.exports = { main, PACK_ID };
