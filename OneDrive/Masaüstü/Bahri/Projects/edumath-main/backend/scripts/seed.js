const mongoose = require('mongoose');
const { Course, Unit, Lesson } = require('../models/Course');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/edumath');

  // Temizle
  await Promise.all([
    Course.deleteMany({}),
    User.deleteMany({}),
    UserProgress.deleteMany({})
  ]);

  // Kurslar
  const mathCourse = new Course({
    title: 'İlkokul Matematik: Örüntüler',
    description: 'İlkokul seviyesinde örüntüler ve mantık dersleri.',
    category: 'Matematik',
    level: 'beginner',
    units: [
      {
        title: 'Örüntüye Giriş',
        order: 1,
        lessons: [
          { title: 'Örüntü Nedir?', type: 'math-interactive', difficulty: 'easy', xpReward: 10, order: 1, content: { question: 'Aşağıdaki şekil örüntüsünü tamamlayınız.' } },
          { title: 'Sayı Örüntüleri: Tren Vagonları', type: 'math-interactive', difficulty: 'easy', xpReward: 15, order: 2, content: { question: 'Bir trenin vagon sayısı her durakta 2 artıyor. 1. durakta 3 vagon varsa, 4. durakta kaç vagon olur?', hint: 'Her durakta 2 ekle.' } }
        ]
      }
    ]
  });

  const javaCourse = new Course({
    title: 'AP Computer Science A: Java',
    description: 'Java programlamaya giriş ve temel kavramlar.',
    category: 'Yazılım',
    level: 'beginner',
    units: [
      {
        title: 'Java Temelleri',
        order: 1,
        lessons: [
          { title: 'Introduction', type: 'coding-java', difficulty: 'easy', xpReward: 10, order: 1 },
          { title: 'Variables', type: 'coding-java', difficulty: 'easy', xpReward: 20, order: 2 },
          { title: 'Loops', type: 'coding-java', difficulty: 'medium', xpReward: 25, order: 3 }
        ]
      }
    ]
  });

  await mathCourse.save();
  await javaCourse.save();

  // Kullanıcı
  const ahmet = new User({
    name: 'Ahmet Öğrenci',
    email: 'ahmet@edumath.com',
    password: '123456',
    role: 'student',
    xp: 120,
    streak: 3,
    level: '2',
    diamonds: 5,
    enrolledCourses: [mathCourse._id, javaCourse._id]
  });
  await ahmet.save();

  // UserProgress
  // Java kursunda hiç başlamamış
  const javaUnitId = javaCourse.units[0]._id;
  const javaLessonId = javaCourse.units[0].lessons[0]._id;
  await UserProgress.create({
    user: ahmet._id,
    course: javaCourse._id,
    unit: javaUnitId,
    lesson: javaLessonId,
    status: 'locked',
    completionPercentage: 0,
    lastPosition: {},
    updatedAt: new Date()
  });

  // Matematik kursunda 1. ünitenin 2. dersinde in-progress
  const mathUnitId = mathCourse.units[0]._id;
  const mathLessonId = mathCourse.units[0].lessons[1]._id;
  await UserProgress.create({
    user: ahmet._id,
    course: mathCourse._id,
    unit: mathUnitId,
    lesson: mathLessonId,
    status: 'in-progress',
    completionPercentage: 0,
    lastPosition: {},
    updatedAt: new Date()
  });

  console.log('Seed tamamlandı!');
  mongoose.disconnect();
}

seed();
