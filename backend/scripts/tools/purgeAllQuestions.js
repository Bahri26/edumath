/**
 * Tüm soru içeriğini sıfırlar:
 *   - Question  → tamamı silinir
 *   - Exercise  → tamamı silinir
 *   - Exam      → questions/submissions sıfırlanır (sınav metadata'sı kalır)
 *   - Lesson    → quiz dizisi sıfırlanır (ders metadata'sı kalır)
 *   - LearningEvent → soru kaynaklı olaylar (hint vs.) silinir
 * Ayrıca soru görseli klasörlerini boşaltır:
 *   uploads/seed-math-bank, uploads/generated, uploads/pattern-templates
 *
 * KULLANIM:
 *   node scripts/purgeAllQuestions.js                  # interaktif teyit ister
 *   node scripts/purgeAllQuestions.js --yes            # teyitsiz çalışır
 *   node scripts/purgeAllQuestions.js --yes --keep-files  # dosyalara dokunma
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const argv = process.argv.slice(2);
const AUTO_YES = argv.includes('--yes') || argv.includes('-y');
const KEEP_FILES = argv.includes('--keep-files');

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB || undefined;

if (!MONGO_URI) {
  console.error('HATA: MONGODB_URI .env içinde tanımlı değil.');
  process.exit(1);
}

const Question = require('../../models/Question');
const Exam = require('../../models/Exam');
const Exercise = require('../../models/Exercise');
const Lesson = require('../../models/Lesson');
const LearningEvent = require('../../models/LearningEvent');

const UPLOAD_DIRS = [
  path.join(__dirname, '..', '..', 'uploads', 'seed-math-bank'),
  path.join(__dirname, '..', '..', 'uploads', 'generated'),
  path.join(__dirname, '..', '..', 'uploads', 'pattern-templates'),
];

const askConfirm = () =>
  new Promise((resolve) => {
    if (AUTO_YES) return resolve(true);
    process.stdout.write(
      '\nBu işlem GERİ ALINAMAZ. Tüm soruları silmek için "EVET" yazın: '
    );
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (input) => {
      resolve(String(input).trim().toUpperCase() === 'EVET');
    });
  });

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR');

const purgeFolder = (dir) => {
  if (!fs.existsSync(dir)) return { dir, removed: 0, kept: 0, error: null };
  let removed = 0;
  let kept = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      try {
        if (entry.isDirectory()) {
          fs.rmSync(p, { recursive: true, force: true });
        } else {
          fs.unlinkSync(p);
        }
        removed++;
      } catch (err) {
        kept++;
        console.warn(`  ! silinemedi: ${entry.name} (${err.message})`);
      }
    }
  } catch (err) {
    return { dir, removed, kept, error: err.message };
  }
  return { dir, removed, kept, error: null };
};

(async () => {
  console.log('--- TÜM SORULARI SİLME ARACI ---');
  console.log(`Mongo URI    : ${MONGO_URI.replace(/:[^:@/]+@/, ':***@')}`);
  console.log(`DB           : ${MONGO_DB || '(URI içindeki DB)'}`);
  console.log(`Dosya silme  : ${KEEP_FILES ? 'HAYIR (sadece DB)' : 'EVET'}`);

  const ok = await askConfirm();
  if (!ok) {
    console.log('İptal edildi.');
    process.exit(0);
  }

  await mongoose.connect(MONGO_URI, MONGO_DB ? { dbName: MONGO_DB } : {});
  console.log(`\nBağlantı kuruldu: ${mongoose.connection.name}`);

  // Önce sayıları al (raporlamak için)
  const [qBefore, exBefore, exerBefore, lessonBefore, hintBefore] = await Promise.all([
    Question.countDocuments({}),
    Exam.countDocuments({}),
    Exercise.countDocuments({}),
    Lesson.countDocuments({}),
    LearningEvent.countDocuments({ type: 'hint' }),
  ]);

  console.log('\nMevcut sayılar:');
  console.log(`  Question     : ${fmt(qBefore)}`);
  console.log(`  Exam         : ${fmt(exBefore)} (sorular ve gönderimler temizlenecek)`);
  console.log(`  Exercise     : ${fmt(exerBefore)} (tamamen silinecek)`);
  console.log(`  Lesson       : ${fmt(lessonBefore)} (quiz dizisi sıfırlanacak)`);
  console.log(`  HintEvents   : ${fmt(hintBefore)} (silinecek)`);

  const results = {};
  results.questions = await Question.deleteMany({});
  results.exercises = await Exercise.deleteMany({});
  results.examReset = await Exam.updateMany(
    {},
    { $set: { questions: [], submissions: [] } }
  );
  results.lessonReset = await Lesson.updateMany({}, { $set: { quiz: [] } });
  results.hintEvents = await LearningEvent.deleteMany({ type: 'hint' });

  console.log('\nVeritabanı sonucu:');
  console.log(`  Silinen Question        : ${fmt(results.questions.deletedCount)}`);
  console.log(`  Silinen Exercise        : ${fmt(results.exercises.deletedCount)}`);
  console.log(
    `  Sıfırlanan Exam         : ${fmt(results.examReset.modifiedCount)} / ${fmt(results.examReset.matchedCount)}`
  );
  console.log(
    `  Sıfırlanan Lesson quiz  : ${fmt(results.lessonReset.modifiedCount)} / ${fmt(results.lessonReset.matchedCount)}`
  );
  console.log(`  Silinen Hint olayları   : ${fmt(results.hintEvents.deletedCount)}`);

  if (!KEEP_FILES) {
    console.log('\nGörsel klasörleri temizleniyor:');
    for (const dir of UPLOAD_DIRS) {
      const res = purgeFolder(dir);
      const rel = path.relative(path.join(__dirname, '..'), dir);
      if (res.error) {
        console.log(`  ! ${rel} → HATA: ${res.error}`);
      } else {
        console.log(`  - ${rel} → silinen: ${fmt(res.removed)}, atlanan: ${fmt(res.kept)}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('\nTAMAMLANDI. Bağlantı kapatıldı.');
  process.exit(0);
})().catch((err) => {
  console.error('SCRIPT HATASI:', err);
  process.exit(1);
});
