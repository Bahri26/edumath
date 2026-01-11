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

    const exams = await Exam.find({ status: 'active', classLevel: grade }).sort({ createdAt: -1 });
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
    const { name, description, classLevel, duration, questions } = req.body;
    
    if (!name || !questions || questions.length !== 21) {
      return res.status(400).json({ message: 'Sınav adı ve 21 soru gerekli' });
    }

    // Veritabanındaki soruları çek
    const questionIds = questions.map(q => q._id || q);
    const questionsData = await Question.find({ _id: { $in: questionIds } });
    
    if (questionsData.length !== 21) {
      return res.status(400).json({ message: 'Tüm sorular bulunamadı' });
    }

    const newExam = await Exam.create({
      title: name,
      description: description || '',
      classLevel,
      duration,
      questions: questionIds,
      createdBy: req.user.id,
      status: 'active'
    });

    res.status(201).json({ success: true, message: 'Sınav oluşturuldu', data: newExam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. OTOMATİK SINAV OLUŞTUR (TEACHER) - KONU FİLTRESİ EKLENDİ 🚨
router.post('/auto-generate', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    // Frontend'den gelen 'subject' (konu) parametresini alıyoruz
    const { title, duration, classLevel, subject } = req.body;

    // Filtre objesi oluştur
    const matchStage = {};
    
    // 1. Sınıf Filtresi
    if (classLevel && classLevel !== 'Tümü') {
        matchStage.classLevel = classLevel;
    }

    // 2. 🚨 KONU FİLTRESİ (Regex ile esnek arama: "Örüntü" yazsa bile "Örüntüler"i bulur)
    if (subject) {
        // 'text' içinde veya 'subject' alanında arama yapabiliriz. 
        // Veri modelinde konu 'subject' alanında tutuluyorsa:
        matchStage.subject = { $regex: subject, $options: 'i' }; 
    }

    // 1. Kolay Sorular (7 Adet)
    const easyQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Kolay' } },
      { $sample: { size: 7 } }
    ]);

    // 2. Orta Sorular (7 Adet)
    const mediumQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Orta' } },
      { $sample: { size: 7 } }
    ]);

    // 3. Zor Sorular (7 Adet)
    const hardQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Zor' } },
      { $sample: { size: 7 } }
    ]);

    // Hepsini birleştir
    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    
    // Yeterli soru var mı kontrolü
    if (allQuestions.length === 0) {
      return res.status(400).json({ 
        message: `Kriterlere uygun soru bulunamadı! "${classLevel}" seviyesinde ve "${subject}" konusunda Havuza soru eklemelisiniz.` 
      });
    }

    const questionIds = allQuestions.map(q => q._id);

    const newExam = new Exam({
      title,
      duration: duration || 25,
      classLevel: classLevel || '9. Sınıf',
      questions: questionIds,
      status: 'active',
      createdBy: req.user.id
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
router.post('/:id/submit', async (req, res) => {
  try {
    const { studentId, studentName, answers } = req.body;
    // Soruları 'subject' (konu) verisiyle birlikte çekiyoruz
    const exam = await Exam.findById(req.params.id).populate('questions');

    let correctCount = 0;
    let weakTopicsSet = new Set(); // Tekrar eden konuları engellemek için Set kullanıyoruz

    exam.questions.forEach(q => {
      // Eğer cevap yanlışsa veya boşsa, o sorunun konusunu 'zayıf konu' olarak ekle
      if (answers[q._id] !== q.correctAnswer) {
        if (q.subject) { 
           weakTopicsSet.add(q.subject); // Örn: "Sayı Örüntüleri"
        }
      } else {
        correctCount++;
      }
    });

    const totalQuestions = exam.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const wrongCount = totalQuestions - correctCount;

    // Sonuç objesine weakTopics'i de ekliyoruz
    exam.results.push({ 
      studentId, 
      studentName, 
      score, 
      correctCount, 
      wrongCount,
      weakTopics: Array.from(weakTopicsSet) // Set'i Array'e çevir
    });
    
    await exam.save();

    res.json({ 
      message: "Sınav tamamlandı", 
      score, 
      weakTopics: Array.from(weakTopicsSet) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;