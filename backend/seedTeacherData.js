// run: node seedTeacherData.js
const mongoose = require('mongoose');

const uri = 'mongodb+srv://bahrikoc1996_db_user:CfYuCeSRuT5c1M22@cluster0.zylekzm.mongodb.net/edumathDB';
const teacherId = '695bfb9bf4102f1b9a00fbfd';

async function seed() {
  await mongoose.connect(uri);


  // 1. Öğretmen ve öğrenci user'ı ekle (varsa atla)
  const teacherUser = await mongoose.connection.db.collection('users').findOneAndUpdate(
    { _id: mongoose.Types.ObjectId(teacherId) },
    { $setOnInsert: {
      _id: mongoose.Types.ObjectId(teacherId),
      name: 'Bahri Öğretmen',
      email: 'bahri.teacher@example.com',
      password: '$2b$10$testtesttesttesttesttesttesttesttesttesttesttesttesttesttestte',
      role: 'teacher',
      branch: 'Matematik',
      branchApproval: 'approved',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    } },
    { upsert: true, returnDocument: 'after' }
  );

  const studentUser = await mongoose.connection.db.collection('users').insertOne({
    name: 'Ali Veli',
    email: 'aliveli@example.com',
    password: '$2b$10$testtesttesttesttesttesttesttesttesttesttesttesttesttesttestte',
    role: 'student',
    grade: '7. Sınıf',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 2. Öğrenci kaydı (Student koleksiyonu)
  const student = await mongoose.connection.db.collection('students').insertOne({
    userId: studentUser.insertedId,
    teacherId: mongoose.Types.ObjectId(teacherId),
    grade: '7. Sınıf',
    averageScore: 85,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 3. Matematik/Örüntüler konulu soru ekle
  await mongoose.connection.db.collection('questions').insertOne({
    text: 'Bir örüntüde 2, 4, 6, 8, ... sayı dizisinin 10. terimi kaçtır?',
    subject: 'Matematik',
    topic: 'Örüntüler',
    classLevel: '7. Sınıf',
    difficulty: 'Orta',
    type: 'multiple-choice',
    options: [
      { text: '18' },
      { text: '20' },
      { text: '22' },
      { text: '24' }
    ],
    correctAnswer: '20',
    solution: 'Her terim 2 artıyor. 10. terim = 2 + (10-1)*2 = 20',
    source: 'Manuel',
    createdBy: mongoose.Types.ObjectId(teacherId),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 4. Sınav ekle
  await mongoose.connection.db.collection('exams').insertOne({
    title: 'Matematik - Örüntüler Sınavı',
    createdBy: mongoose.Types.ObjectId(teacherId),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    submissions: [
      { studentId: student.insertedId, score: 90 }
    ]
  });

  // 5. Anket ekle
  await mongoose.connection.db.collection('surveys').insertOne({
    title: 'Örüntüler Konu Anketi',
    createdBy: mongoose.Types.ObjectId(teacherId),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Örnek veriler başarıyla eklendi!');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
