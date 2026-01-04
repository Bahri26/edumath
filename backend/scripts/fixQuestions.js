// backend/scripts/fixQuestions.js
// Bu script, eksik options veya correctAnswer alanı olan eski soruları düzeltir.
// Çalıştırmak için: node scripts/fixQuestions.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGO_URI;

async function fixQuestions() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB bağlantısı kuruldu.');

  // Eksik options veya correctAnswer alanı olan soruları bul
  const questions = await Question.find({
    $or: [
      { options: { $exists: false } },
      { correctAnswer: { $exists: false } },
      { options: { $size: 0 } }
    ]
  });

  console.log(`${questions.length} sorunlu soru bulundu.`);

  for (const q of questions) {
    // Sınıf seviyesine göre şık sayısı belirle
    let expectedCount = 5; // default lise
    if (q.classLevel) {
      if (["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf"].includes(q.classLevel)) expectedCount = 3;
      else if (["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"].includes(q.classLevel)) expectedCount = 4;
      else expectedCount = 5;
    }
    // Eğer options yoksa veya boşsa, örnek şıklar ekle
    if (!q.options || q.options.length === 0) {
      q.options = Array(expectedCount).fill(0).map((_, i) => ({ text: String.fromCharCode(65+i) + ' şıkkı', image: '' }));
    } else {
      // Eğer eski formatta string ise, objeye çevir
      if (typeof q.options[0] === 'string') {
        q.options = q.options.map(opt => ({ text: opt, image: '' }));
      }
      // Eksik şıkları tamamla
      while (q.options.length < expectedCount) {
        q.options.push({ text: '', image: '' });
      }
      // Fazla şıkları kırp
      if (q.options.length > expectedCount) {
        q.options = q.options.slice(0, expectedCount);
      }
    }
    // Eğer correctAnswer yoksa, ilk şıkkı doğru kabul et
    if (!q.correctAnswer) {
      q.correctAnswer = q.options[0]?.text || '';
    }
    await q.save();
    console.log(`Düzeltildi: ${q._id}`);
  }

  console.log('Tüm sorunlu sorular düzeltildi.');
  process.exit(0);
}

fixQuestions().catch(e => { console.error(e); process.exit(1); });