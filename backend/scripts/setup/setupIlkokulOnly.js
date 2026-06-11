/**
 * İlkokul (1–4. Sınıf) soru bankasını kurar; 5–12. sınıf sorularını siler.
 * CONFIRM_ILKOKUL_ONLY=YES node scripts/setup/setupIlkokulOnly.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');

const Question = require('../../models/Question');
const Exam = require('../../models/Exam');
const Exercise = require('../../models/Exercise');
const User = require('../../models/User');
const { seedCurriculum, seedUsers } = require('../seed/seedPatternsCurriculum');

const CONFIRM = 'YES';
const ILKOKUL = ['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'];

function runSeed(relativeScript) {
  const scriptPath = path.join(__dirname, '..', 'seed', relativeScript);
  execSync(`node "${scriptPath}"`, {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'inherit',
    env: process.env,
  });
}

async function main() {
  if (String(process.env.CONFIRM_ILKOKUL_ONLY || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_ILKOKUL_ONLY=${CONFIRM} node scripts/setup/setupIlkokulOnly.js`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'Edumath',
  });

  const teacherEmail = process.env.SEED_TEACHER_EMAIL || 'teacher@edumath.local';
  let teacher = await User.findOne({ email: teacherEmail }).select('_id email');
  if (!teacher) {
    console.log('Öğretmen yok — kullanıcılar oluşturuluyor...');
    const seeded = await seedUsers();
    teacher = seeded.teacher;
  }

  console.log('=== 1) Tüm soruları ve sınavları temizle (1–4 yeniden kurulacak) ===');
  const delAllQuestions = await Question.deleteMany({});
  const delAllExams = await Exam.deleteMany({});
  const delExercises = await Exercise.deleteMany({ classLevel: { $nin: ILKOKUL } });

  console.log(JSON.stringify({
    deletedAllQuestions: delAllQuestions.deletedCount,
    deletedAllExams: delAllExams.deletedCount,
    deletedExercisesOutside: delExercises.deletedCount,
  }, null, 2));

  console.log('\n=== 2) 1–4. sınıf MEB curriculum (21/sınıf) ===');
  const curriculumStats = await seedCurriculum(teacher._id, { classLevels: ILKOKUL });
  console.log(JSON.stringify(curriculumStats, null, 2));

  await mongoose.disconnect();

  console.log('\n=== 3) Ek paket sorular (+15/sınıf) ===');
  runSeed('seedGrade1PatternsEmoji15.js');
  runSeed('seedGrade2PatternsPack15.js');
  runSeed('seedGrade3PatternsPack15.js');
  runSeed('seedGrade4PatternsPack15.js');

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'Edumath',
  });

  const summary = await Question.aggregate([
    { $match: { classLevel: { $in: ILKOKUL } } },
    {
      $group: {
        _id: { classLevel: '$classLevel', packId: '$assessmentMeta.packId' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.classLevel': 1 } },
  ]);

  const total = await Question.countDocuments({ classLevel: { $in: ILKOKUL } });
  const remainingOutside = await Question.countDocuments({ classLevel: { $nin: ILKOKUL } });
  const examCount = await Exam.countDocuments({ classLevel: { $in: ILKOKUL } });

  console.log('\n=== Sonuç ===');
  console.log(JSON.stringify({ totalIlkokul: total, remainingOutside, examsIlkokul: examCount, breakdown: summary }, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
