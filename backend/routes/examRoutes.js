const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const User = require('../models/User');
const Student = require('../models/Student');

// 1. TÜM SINAVLARI GETİR
router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 1.a. ÖĞRENCİ: Sınıfa göre aktif sınavları getir
router.get('/by-class', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    // Önce kullanıcı profilinden sınıfı al, yoksa Student tablosundan dene
    let grade = null;
    const user = await User.findById(req.user.id).select('grade role');
    if (user && user.grade) {
      grade = user.grade;
    } else {
      const student = await Student.findOne({ userId: req.user.id }).select('grade');
      grade = student?.grade || null;
    }

    if (!grade) {
      return res.status(400).json({ message: 'Öğrenci sınıf bilgisi bulunamadı.' });
    }

    const now = new Date();
    const windowFilter = {
      $and: [
        { $or: [{ startAt: { $exists: false } }, { startAt: null }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: { $exists: false } }, { endAt: null }, { endAt: { $gte: now } }] }
      ]
    };
    const exams = await Exam.find({ status: 'active', classLevel: grade, ...windowFilter }).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. SINAV DETAYI GETİR
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: "Sınav bulunamadı" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. MANUEL SINAV OLUŞTUR (TEACHER) - SÜRÜKLE BIRAK
router.post('/', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { name, description, classLevel, duration, questions, startAt, endAt } = req.body;
    
    if (!name || !questions || questions.length !== 21) {
      return res.status(400).json({ message: 'Sınav adı ve 21 soru gerekli' });
    }

    // Veritabanındaki soruları çek
    const questionIds = questions.map(q => q._id || q);
    const questionsData = await Question.find({ _id: { $in: questionIds } });
    
    if (questionsData.length !== 21) {
      return res.status(400).json({ message: 'Tüm sorular bulunamadı' });
    }

    // Determine subject based on teacher's approved branch
    let subject = undefined;
    try {
      const teacher = await User.findById(req.user.id).select('branch branchApproval role');
      if (teacher && teacher.role === 'teacher' && teacher.branch && teacher.branchApproval === 'approved') {
        subject = teacher.branch;
      }
    } catch {}

    const newExam = await Exam.create({
      title: name,
      description: description || '',
      classLevel,
      duration,
      questions: questionIds,
      createdBy: req.user.id,
      ...(subject ? { subject } : {}),
      status: 'active',
      ...(startAt ? { startAt: new Date(startAt) } : {}),
      ...(endAt ? { endAt: new Date(endAt) } : {})
    });

    res.status(201).json({ success: true, message: 'Sınav oluşturuldu', data: newExam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. OTOMATİK SINAV OLUŞTUR (TEACHER) - KONU FİLTRESİ EKLENDİ 🚨
router.post('/auto-generate', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { title, duration, classLevel, subject, startAt, endAt } = req.body;
    // Sadece ilgili sınıf ve branş için 7 kolay, 7 orta, 7 zor soru seç
    const matchStage = { classLevel };
    if (subject) matchStage.subject = { $regex: subject, $options: 'i' };

    const easyQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Kolay' } },
      { $sample: { size: 7 } }
    ]);
    const mediumQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Orta' } },
      { $sample: { size: 7 } }
    ]);
    const hardQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Zor' } },
      { $sample: { size: 7 } }
    ]);

    if (easyQuestions.length < 7 || mediumQuestions.length < 7 || hardQuestions.length < 7) {
      return res.status(400).json({
        message: `Her zorluk seviyesinden 7'şer soru bulunamadı! (Kolay: ${easyQuestions.length}, Orta: ${mediumQuestions.length}, Zor: ${hardQuestions.length})`
      });
    }

    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    const questionIds = allQuestions.map(q => q._id);

    const newExam = new Exam({
      title,
      duration: duration || 25,
      classLevel: classLevel || '9. Sınıf',
      questions: questionIds,
      status: 'active',
      createdBy: req.user.id,
      ...(subject ? { subject } : {}),
      ...(startAt ? { startAt: new Date(startAt) } : {}),
      ...(endAt ? { endAt: new Date(endAt) } : {})
    });
    await newExam.save();
    res.status(201).json(newExam);
  } catch (err) {
    res.status(500).json({ message: "Sınav oluşturulurken hata: " + err.message });
  }
});

// 4. SINAVI SİL
router.delete('/:id', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    if (String(exam.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bu sınavı silme yetkiniz yok' });
    }
    await exam.deleteOne();
    res.json({ message: 'Sınav silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4.5. SINAV GÜNCELLE (Süre, başlık, açıklama, durum)
router.put('/:id', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const allowed = ['title', 'description', 'duration', 'status'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    let exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    if (String(exam.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bu sınavı güncelleme yetkiniz yok' });
    }
    exam = await Exam.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. SINAV SONUCUNU KAYDET VE ANALİZ ET
router.post('/:id/submit', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { answers } = req.body;
    // Soruları 'subject' (konu) verisiyle birlikte çekiyoruz
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });

    // Tekrar sınav kontrolü (öğrencinin daha önce gönderimi var mı?)
    const exists = (exam.results || []).some(r => String(r.studentId) === String(req.user.id));
    if (exists) return res.status(400).json({ message: 'Bu sınavı zaten tamamladınız.' });

    let correctCount = 0;
    let weakTopicsSet = new Set();
    const topicCounts = new Map();

    exam.questions.forEach(q => {
      // Eğer cevap yanlışsa veya boşsa, o sorunun konusunu 'zayıf konu' olarak ekle
      if (answers[q._id] !== q.correctAnswer) {
        if (q.subject) { 
           weakTopicsSet.add(q.subject);
           topicCounts.set(q.subject, (topicCounts.get(q.subject) || 0) + 1);
        }
      } else {
        correctCount++;
      }
    });

    const totalQuestions = exam.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const wrongCount = totalQuestions - correctCount;

    // Sonuç objesine weakTopics'i de ekliyoruz
    const studentName = (await User.findById(req.user.id).select('name'))?.name || 'Öğrenci';
    const topicStats = Array.from(topicCounts.entries()).map(([topic, wrong]) => ({ topic, wrong }));
    exam.results.push({ 
      studentId: req.user.id, 
      studentName, 
      score, 
      correctCount, 
      wrongCount,
      topicStats,
      weakTopics: Array.from(weakTopicsSet)
    });
    
    await exam.save();

    res.json({ 
      message: "Sınav tamamlandı", 
      score,
      topicStats,
      weakTopics: Array.from(weakTopicsSet) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Öğrencinin bir sınava ait sonucu
router.get('/:id/my-result', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    const my = (exam.results || []).find(r => String(r.studentId) === String(req.user.id));
    if (!my) return res.status(404).json({ message: 'Sonuç bulunamadı' });
    res.json(my);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;