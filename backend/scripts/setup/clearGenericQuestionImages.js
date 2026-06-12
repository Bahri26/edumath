/** Metin-only sorulardan gereksiz varsayılan görselleri temizler. */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Question = require('../../models/Question');

const GENERIC_IMAGES = [
  '/uploads/patterns/grade2-4-patterns.svg',
  '/uploads/patterns/grade4-step3.svg',
  '/uploads/patterns/grade1-easy.svg',
  '/uploads/patterns/grade1-medium.svg',
  '/uploads/patterns/grade1-hard.svg',
  'uploads/patterns/grade2-4-patterns.svg',
  'uploads/patterns/grade4-step3.svg',
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'Edumath' });
  const res = await Question.updateMany(
    {
      classLevel: { $in: ['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'] },
      image: { $in: GENERIC_IMAGES },
    },
    { $set: { image: '', imageKey: '', imageProvider: '' } },
  );
  console.log('Temizlenen soru:', res.modifiedCount);
  await mongoose.disconnect();
})();
