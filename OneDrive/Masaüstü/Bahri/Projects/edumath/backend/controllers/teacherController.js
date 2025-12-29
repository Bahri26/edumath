// Öğretmenin oluşturduğu sınavları getir
exports.getMyExams = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const exams = await Exam.find({
      $or: [
        { createdBy: teacherId },
        { createdBy: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Sınavlar alınamadı', error: err.message });
  }
};
// 📷 Görüntüden Soruya Dönüştürme (Tesseract.js ile OCR)
const Tesseract = require('tesseract.js');
const fs = require('fs');
exports.convertImageToQuestion = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'Görsel dosyası bulunamadı.' });
    }
    // Görseli oku
    const imagePath = req.file.path;
    // Tesseract ile OCR işlemi
    const { data: { text } } = await Tesseract.recognize(imagePath, 'tur');
    // Geçici dosyayı sil
    fs.unlink(imagePath, () => {});
    if (!text || text.trim().length < 3) {
      return res.status(422).json({ message: 'Resim okunamadı. Lütfen tekrar deneyin.' });
    }
    // Soru kökü ve şıkları ayırma
    // 1. Soru kökü ve açıklama kısmı (şıklar gelene kadar)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let questionStem = '';
    let choices = [];
    let choiceRegex = /^[A-DÇŞÖÜIİabcçşöüıi]\)/i;
    let inChoices = false;
    for (let line of lines) {
      if (choiceRegex.test(line)) {
        inChoices = true;
        choices.push(line);
      } else if (inChoices && choices.length > 0) {
        // Şıklar başladıktan sonra gelen satırlar, bir önceki şıkkın devamı olabilir
        choices[choices.length - 1] += ' ' + line;
      } else {
        questionStem += (questionStem ? ' ' : '') + line;
      }
    }
    // Şıkları A, B, C, D olarak ayır
    const parsedChoices = [];
    for (let c of choices) {
      const match = c.match(/^([A-DÇŞÖÜIİabcçşöüıi])[\)\.]\s*(.*)$/i);
      if (match) {
        parsedChoices.push({ label: match[1].toUpperCase(), text: match[2].trim() });
      } else {
        // Şık formatı bozuksa düz ekle
        parsedChoices.push({ label: '', text: c });
      }
    }
    res.json({
      question: questionStem,
      choices: parsedChoices
    });
  } catch (err) {
    res.status(500).json({ message: 'Görselden metin okunamadı.', error: err.message });
  }
};
const User = require('../models/User');
const Student = require('../models/Student');
const Question = require('../models/Question');
const Survey = require('../models/Survey');
const Exam = require('../models/Exam');
const mongoose = require('mongoose');

// ✅ 1. ÖĞRETMENİN İSTATİSTİKLERİNİ GETIR
exports.getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Toplam öğrenci sayısı
    const totalStudents = await Student.countDocuments({ teacherId });
    
    // Toplam sorular
    const totalQuestions = await Question.countDocuments({ createdBy: teacherId });
    
    // Toplam anketler
    const totalSurveys = await Survey.countDocuments({ createdBy: teacherId });
    
    // Sınıf ortalaması (Exam sonuçlarından hesapla)
    const exams = await Exam.find({ createdBy: teacherId });
    let classAverage = 0;
    if (exams.length > 0) {
      const totalScore = exams.reduce((sum, exam) => {
        const avgScore = exam.submissions && exam.submissions.length > 0
          ? exam.submissions.reduce((s, sub) => s + (sub.score || 0), 0) / exam.submissions.length
          : 0;
        return sum + avgScore;
      }, 0);
      classAverage = (totalScore / exams.length).toFixed(1);
    }

    // En aktif konu (En çok soru oluşturulan)
    const topTopics = await Question.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(teacherId) } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topTopic = topTopics.length > 0 ? topTopics[0]._id : 'Belirtilmedi';

    // Aktif sınavlar
    const activeExams = await Exam.countDocuments({ 
      createdBy: teacherId, 
      status: 'active' 
    });

    res.json({
      totalStudents,
      totalQuestions,
      totalSurveys,
      classAverage,
      topTopic,
      activeExams,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: 'İstatistikler alınamadı', error: err.message });
  }
};

// ✅ 2. SINIF RAPORLARINI GETIR (Konu Bazlı Başarı)
exports.getClassReports = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Konu bazlı başarı oranları
    const topicPerformance = await Question.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(teacherId) } },
      { $group: { 
        _id: '$subject', 
        total: { $sum: 1 },
        avgDifficulty: { $avg: { 
          $cond: [
            { $eq: ['$difficulty', 'Kolay'] }, 1,
            { $cond: [{ $eq: ['$difficulty', 'Orta'] }, 2, 3] }
          ]
        }}
      }},
      { $sort: { total: -1 } }
    ]);

    // Öğrenci risk analizi (Düşük başarılı öğrenciler)
    const studentRisks = await Student.find({ teacherId })
      .select('name email averageScore grade')
      .sort({ averageScore: 1 })
      .limit(5);

    // Sınıf başarı trend (Son 7 gün)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Exam.aggregate([
      { $match: { 
        createdBy: new mongoose.Types.ObjectId(teacherId),
        createdAt: { $gte: sevenDaysAgo }
      }},
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        avgScore: { $avg: 72 }, // Mock veri (gerçekte submissions'dan hesaplanır)
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      topicPerformance,
      studentRisks,
      dailyTrend,
      generatedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: 'Raporlar alınamadı', error: err.message });
  }
};

// ✅ 4. ÖĞRETMENİN ANKETLERİNİ GETIR
exports.getMySurveys = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { createdBy: teacherId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const surveys = await Survey.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Survey.countDocuments(filter);

    res.json({
      data: surveys,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ message: 'Anketler alınamadı', error: err.message });
  }
};

// ✅ 5. ÖĞRETMENİN SINIFINDAKİ ÖĞRENCİLERİNİ GETIR (DEDİKE)
exports.getClassStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const students = await Student.find({ teacherId })
      .select('name email grade averageScore status')
      .sort({ averageScore: -1 });

    res.json({
      totalStudents: students.length,
      students,
      classAverage: students.length > 0 
        ? (students.reduce((sum, s) => sum + (s.averageScore || 0), 0) / students.length).toFixed(1)
        : 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Öğrenciler alınamadı', error: err.message });
  }
};

// ✅ 6. ÖĞRENCİ AYRINTI
exports.getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    // Öğrencinin öğretmene ait olduğunu doğrula
    const student = await Student.findOne({ _id: studentId, teacherId });
    if (!student) {
      return res.status(403).json({ message: 'Bu öğrenciye erişim izniniz yok' });
    }

    // Öğrencinin sınav performansı
    const exams = await Exam.find({ createdBy: teacherId });
    const studentPerformance = exams.map(exam => ({
      examName: exam.title,
      score: exam.submissions?.find(s => s.studentId.toString() === studentId)?.score || 0,
      maxScore: 100
    }));

    res.json({
      student,
      performance: studentPerformance,
      averageScore: studentPerformance.length > 0 
        ? (studentPerformance.reduce((sum, p) => sum + p.score, 0) / studentPerformance.length).toFixed(1)
        : 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Öğrenci detayları alınamadı', error: err.message });
  }
};

// ✅ 7. ÖĞRETMENIN SORULARINI GETİR (PAGINATION + FİLTRELEME)
exports.getMyQuestions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log('\n=== 🎓 getMyQuestions BAŞLADI ===');
    console.log('Teacher ID:', teacherId);
    console.log('Query params:', req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty } = req.query;

    const query = { createdBy: teacherId };
    
    if (search) query.text = { $regex: search, $options: 'i' };
    if (subject && subject !== 'Tümü') query.subject = subject;
    if (classLevel && classLevel !== 'Tümü') query.classLevel = classLevel;
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;

    console.log('Sorgu (query):', JSON.stringify(query));

    const total = await Question.countDocuments(query);
    console.log('📊 Toplam bulunan soru sayısı:', total);

    if (total === 0) {
      // Hiç soru yoksa, tümü için kontrol et
      const allCount = await Question.countDocuments({});
      console.log('⚠️  Hiç soru yok! Veritabanında toplam soru sayısı:', allCount);
      if (allCount > 0) {
        const sampleQuestion = await Question.findOne().limit(1);
        console.log('📌 Örnek soru createdBy değeri:', sampleQuestion?.createdBy);
      }
    }

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('✅ Alınan sorular sayısı:', questions.length);
    console.log('=== 🎓 getMyQuestions BİTTİ ===\n');

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page: page,
      total: total,
      data: questions
    });
  } catch (err) {
    console.error('❌ getMyQuestions HATASI:', err);
    res.status(500).json({ message: 'Sorular alınamadı', error: err.message });
  }
};

// ✅ 8. KİPİ ÖZET (Dashboard Başlığı İçin)
exports.getDashboardSummary = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const stats = await exports.getTeacherStats({ user: { id: teacherId } });
    const reports = await exports.getClassReports({ user: { id: teacherId } });

    res.json({
      stats: await stats.json?.() || stats,
      reports: await reports.json?.() || reports
    });
  } catch (err) {
    res.status(500).json({ message: 'Özet alınamadı', error: err.message });
  }
};
