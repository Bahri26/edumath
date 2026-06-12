/**
 * 1–4. sınıf için 20 dk Ölçme ve Değerlendirme sınavları oluşturur; diğer sınavları siler.
 * CONFIRM_ILKOKUL_EXAMS=YES node scripts/setup/setupIlkokulExams.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const Exam = require('../../models/Exam');
const Question = require('../../models/Question');
const User = require('../../models/User');

const CONFIRM = 'YES';
const ILKOKUL = ['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'];
const DURATION_MIN = 20;
const PER_DIFFICULTY = 7;
const DIFFICULTIES = ['Kolay', 'Orta', 'Zor'];

async function sampleQuestions(classLevel) {
  const ids = [];
  for (const difficulty of DIFFICULTIES) {
    const batch = await Question.aggregate([
      {
        $match: {
          classLevel,
          subject: 'Matematik',
          topic: 'Örüntüler',
          difficulty,
        },
      },
      { $sample: { size: PER_DIFFICULTY } },
      { $project: { _id: 1 } },
    ]);
    if (batch.length < PER_DIFFICULTY) {
      throw new Error(
        `${classLevel} ${difficulty}: yeterli soru yok (${batch.length}/${PER_DIFFICULTY})`,
      );
    }
    ids.push(...batch.map((q) => q._id));
  }
  return ids;
}

async function main() {
  if (String(process.env.CONFIRM_ILKOKUL_EXAMS || '').trim() !== CONFIRM) {
    console.error(`Devam: CONFIRM_ILKOKUL_EXAMS=${CONFIRM} node scripts/setup/setupIlkokulExams.js`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'Edumath',
  });

  const teacherEmail = process.env.SEED_TEACHER_EMAIL || 'teacher@edumath.local';
  const teacher = await User.findOne({ email: teacherEmail }).select('_id email');
  if (!teacher) {
    throw new Error(`Öğretmen bulunamadı: ${teacherEmail}`);
  }

  const deleted = await Exam.deleteMany({});
  console.log(`Silinen sınav: ${deleted.deletedCount}`);

  const created = [];
  for (const classLevel of ILKOKUL) {
    const questionIds = await sampleQuestions(classLevel);
    const questions = await Question.find({ _id: { $in: questionIds } })
      .select('learningOutcome')
      .lean();
    const learningOutcomes = Array.from(
      new Set(questions.map((q) => q.learningOutcome).filter(Boolean)),
    );

    const title = `${classLevel} Ölçme ve Değerlendirme Sınavı`;
    const exam = await Exam.create({
      title,
      description: `${classLevel} Matematik Örüntüler konusu — 7 kolay, 7 orta, 7 zor soru (${DURATION_MIN} dakika).`,
      subject: 'Matematik',
      topic: 'Örüntüler',
      classLevel,
      duration: DURATION_MIN,
      questions: questionIds,
      createdBy: teacher._id,
      status: 'active',
      examType: 'ilkokul-olcme-degerlendirme',
      learningOutcomes,
    });

    created.push({
      id: String(exam._id),
      title: exam.title,
      classLevel: exam.classLevel,
      duration: exam.duration,
      questionCount: questionIds.length,
    });
    console.log(`✓ ${title} — ${questionIds.length} soru, ${DURATION_MIN} dk`);
  }

  const verify = await Exam.find().select('title classLevel duration').lean();
  console.log('\n=== Sınav listesi ===');
  verify.forEach((e) => {
    console.log(`  ${e.title} | ${e.duration} dk`);
  });

  console.log(JSON.stringify({ created, totalExams: verify.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
