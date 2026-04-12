// Seed sample questions for quick testing
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Question = require('../models/Question');

const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Edumath';
const mongoDbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath';

async function run() {
  try {
    await mongoose.connect(mongoURI, { dbName: mongoDbName, serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const samples = [
      {
        text: 'Bir sayı dizisinde ardışık iki sayının toplamı 10 ise, ilk sayı 4 ise ikinci sayı kaçtır?',
        subject: 'Matematik',
        classLevel: '9. Sınıf',
        difficulty: 'Kolay',
        type: 'multiple-choice',
        correctAnswer: '6',
        solution: '4 + x = 10 => x = 6',
        options: [
          { text: '5' }, { text: '6' }, { text: '7' }, { text: '8' }, { text: '9' }
        ],
        source: 'Manuel'
      },
      {
        text: 'x^2 - 9 = 0 denkleminin kökleri nedir?',
        subject: 'Matematik',
        classLevel: '9. Sınıf',
        difficulty: 'Orta',
        type: 'multiple-choice',
        correctAnswer: 'x = 3 ve x = -3',
        solution: 'x^2 - 9 = (x-3)(x+3) => x=3,-3',
        options: [
          { text: 'x = 0 ve x = 9' },
          { text: 'x = 3 ve x = -3' },
          { text: 'x = 9 ve x = -9' },
          { text: 'x = 1 ve x = -1' },
          { text: 'Hiçbiri' }
        ],
        source: 'Manuel'
      },
      {
        text: 'Bir doğruya paralel olan başka bir doğru açıları nasıl etkiler?',
        subject: 'Matematik',
        classLevel: '9. Sınıf',
        difficulty: 'Zor',
        type: 'multiple-choice',
        correctAnswer: 'Eş açılar oluşur',
        solution: 'Paralel doğrular kesenle eş açılar oluşturur.',
        options: [
          { text: 'Eş açılar oluşur' },
          { text: 'Açı daralır' },
          { text: 'Açı genişler' },
          { text: 'Açı değişmez' },
          { text: 'Açı kaybolur' }
        ],
        source: 'Manuel'
      }
    ];

    const inserted = await Question.insertMany(samples);
    console.log(`Inserted ${inserted.length} sample questions.`);

    const countBySubject = await Question.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('Counts by subject:', countBySubject);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
