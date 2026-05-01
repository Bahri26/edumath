/**
 * Tüm sınav, egzersiz ve soruları siler; her sınıf için 7 Kolay + 7 Orta + 7 Zor
 * **yalnızca Örüntüler** konusunda, görselleri metinle uyumlu SVG matematik sorusu oluşturur.
 *
 * UYARI: Geri alınamaz veri kaybı. Sadece geliştirme / yeniden kurulum için.
 *
 * Çalıştır:
 *   CONFIRM_RESET_QUESTION_BANK=I_UNDERSTAND_DELETE_ALL_QUESTIONS_AND_EXAMS node scripts/resetAndSeedMathQuestionBank.js
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Question = require('../../models/Question');
const Exam = require('../../models/Exam');
const Exercise = require('../../models/Exercise');
const User = require('../../models/User');
const { uploadSvg } = require('../../services/storageService');
const { CLASS_LEVELS, buildPatternQuestionDef } = require('../seedBank/patternOnlyGenerators');

const DESTROY_TOKEN = 'I_UNDERSTAND_DELETE_ALL_QUESTIONS_AND_EXAMS';

async function main() {
  if (String(process.env.CONFIRM_RESET_QUESTION_BANK || '').trim() !== DESTROY_TOKEN) {
    console.error(
      'Bu işlem tüm Exams, Exercises ve Questions kayıtlarını siler.\n' +
        `Devam etmek için ortam değişkeni ayarlayın:\n` +
        `  CONFIRM_RESET_QUESTION_BANK=${DESTROY_TOKEN}\n` +
        'Sonra: node scripts/resetAndSeedMathQuestionBank.js'
    );
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI tanımlı değil.');
    process.exit(1);
  }
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();

  await mongoose.connect(uri, { dbName });

  const [exercisesDel, examsDel, questionsDel] = await Promise.all([
    Exercise.deleteMany({}),
    Exam.deleteMany({}),
    Question.deleteMany({}),
  ]);

  console.log(
    JSON.stringify(
      {
        deletedCounts: {
          exercises: exercisesDel.deletedCount,
          exams: examsDel.deletedCount,
          questions: questionsDel.deletedCount,
        },
      },
      null,
      2
    )
  );

  let teacherDoc = await User.findOne({
    email: String(process.env.SEED_TEACHER_EMAIL || '').trim(),
  }).select('_id');
  if (!teacherDoc) {
    teacherDoc = await User.findOne({ role: 'teacher' }).sort({ createdAt: 1 }).select('_id');
  }
  const createdBy = teacherDoc?._id || null;

  const difficulties = ['Kolay', 'Orta', 'Zor'];
  let svgIndex = 0;
  let inserted = 0;

  for (const classLevel of CLASS_LEVELS) {
    for (const difficulty of difficulties) {
      for (let slot = 0; slot < 7; slot += 1) {
        const def = buildPatternQuestionDef(classLevel, difficulty, slot);
        const uploaded = await uploadSvg(def.svg, 'seed-pattern-bank', `bank-${svgIndex}-${classLevel}-${difficulty}-s${slot}.svg`);
        svgIndex += 1;

        await Question.create({
          text: def.text,
          topic: def.topic || 'Matematik',
          learningOutcome: def.learningOutcome || '',
          subject: 'Matematik',
          classLevel,
          difficulty,
          type: 'multiple-choice',
          interactiveType: 'none',
          interactionData: null,
          visualPrompt: '',
          correctAnswer: String(def.correctAnswer),
          solution: def.solution || '',
          options: (def.options || []).map((txt) => ({
            text: String(txt),
            image: '',
            imageKey: '',
            imageProvider: '',
          })),
          image: uploaded.url,
          imageKey: uploaded.key,
          imageProvider: uploaded.provider,
          source: 'Manuel',
          createdBy: createdBy || undefined,
        });

        inserted += 1;
        if (inserted % 50 === 0) {
          console.log(`... ${inserted} soru eklendi`);
        }
      }
    }
  }

  console.log(JSON.stringify({ done: true, insertedTotal: inserted, perClass: 21, classes: CLASS_LEVELS.length }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
