// backend-express/controllers/examController.js (temiz sürüm)
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');

function shuffleArray(arr = []) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET /api/exams
// If authenticated as teacher and no ?all=true, scope to exams created by that teacher
exports.getExams = async (req, res) => {
  try {
    const { subject, classLevel, search, all } = req.query;
    const filter = {};

    if (subject) filter.category = subject;
    if (classLevel) filter.associatedClass = classLevel;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Teacher scoping (unless explicitly requesting all)
    const user = req.user;
    const isTeacher = user?.isTeacher || user?.roles?.isTeacher;
    if (isTeacher && !all) {
      filter.creator = user._id || user.id;
    }

    const exams = await Exam.find(filter)
      .select('title description duration category creator associatedClass createdAt questions passMark isPublished startDate endDate')
      .populate('creator', 'firstName lastName')
      .populate('questions', '_id')
      .sort({ createdAt: -1 });

    // Aggregate results for metrics
    const examIds = exams.map(e => e._id);
    const results = await Result.find({ exam: { $in: examIds } }).select('exam score');
    const metricsMap = new Map();
    results.forEach(r => {
      const key = r.exam.toString();
      const current = metricsMap.get(key) || { attempts: 0, totalScore: 0 };
      current.attempts += 1;
      if (typeof r.score === 'number') current.totalScore += r.score;
      metricsMap.set(key, current);
    });

    const now = new Date();
    const formatted = exams.map(exam => {
      const m = metricsMap.get(exam._id.toString()) || { attempts: 0, totalScore: 0 };
      const avgScore = m.attempts > 0 ? Math.round(m.totalScore / m.attempts) : 0;
      const isActive = exam.isPublished && exam.startDate && exam.endDate && new Date(exam.startDate) <= now && new Date(exam.endDate) >= now;
      return {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        subject: exam.category,
        classLevel: exam.associatedClass,
        passMark: exam.passMark,
        questionCount: exam.questions?.length || 0,
        attempts: m.attempts,
        avgScore,
        status: isActive ? 'aktif' : (exam.isPublished ? 'planlı' : 'taslak'),
        createdBy: exam.creator ? `${exam.creator.firstName} ${exam.creator.lastName}` : 'Bilinmiyor',
        createdAt: exam.createdAt
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Sınav listeleme hatası:', error);
    res.status(500).json({ message: 'Sınavlar listelenirken sunucu hatası oluştu.' });
  }
};

// GET /api/exams/:id
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('creator', 'firstName lastName');
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı.' });
    res.status(200).json(exam);
  } catch (error) {
    console.error('Sınav detayı getirme hatası:', error);
    if (error.kind === 'ObjectId') return res.status(400).json({ message: 'Geçersiz Sınav ID formatı.' });
    res.status(500).json({ message: 'Sınav getirilirken bir hata oluştu.' });
  }
};

// POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const { title, description, duration, subject, category, passMark, classLevel, associatedClass, questions = [] } = req.body;
    
    const finalSubject = subject || category;
    const finalClass = classLevel || associatedClass;
    
    if (!title || !duration || !finalSubject) {
      return res.status(400).json({ message: 'Başlık, süre ve kategori zorunludur.' });
    }

    const exam = new Exam({
      title,
      description: description || '',
      duration,
      category: finalSubject,
      passMark: passMark ?? 50,
      associatedClass: finalClass || null,
      creator: req.user?.id || req.user?._id || null,
      questions,
    });

    await exam.save();
    
    const formatted = {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      subject: exam.category,
      classLevel: exam.associatedClass,
      passMark: exam.passMark,
      questionCount: exam.questions?.length || 0,
      createdAt: exam.createdAt
    };
    
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Sınav oluşturma hatası:', error);
    res.status(500).json({ message: 'Sınav oluşturulurken sunucu hatası oluştu.' });
  }
};

// GET /api/exams/:id/start
exports.startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate({
      path: 'questions',
      select: 'text options questionType difficulty points',
      model: 'Question',
    });
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı.' });

    const studentId = req.user?._id || req.user?.id;
    if (studentId) {
      const existing = await Result.findOne({ examId: exam._id, studentId });
      if (existing && exam.allowRetake === false) {
        return res.status(403).json({ message: 'Bu sınavı daha önce tamamladınız. Tekrar çözemezsiniz.' });
      }
    }

    const qs = Array.isArray(exam.questions) ? exam.questions : [];
    const finalQuestions = exam.shuffleQuestions ? shuffleArray(qs) : qs;

    const safeQuestions = finalQuestions.map((q) => ({
      id: q._id,
      text: q.text ?? q.question,
      options: q.options,
      questionType: q.questionType,
      difficulty: q.difficulty,
      points: q.points,
    }));

    return res.status(200).json({
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      category: exam.category,
      questions: safeQuestions,
    });
  } catch (error) {
    console.error('Sınav başlatma hatası:', error);
    if (error.kind === 'ObjectId') return res.status(400).json({ message: 'Geçersiz Sınav ID formatı.' });
    res.status(500).json({ message: 'Sınav başlatılırken bir sunucu hatası oluştu.' });
  }
};

// PUT /api/exams/:examId/questions
exports.updateQuestionsForExam = async (req, res) => {
  const { examId } = req.params;
  const { questionIds, questions } = req.body;
  const userId = req.user?.id || req.user?._id;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı.' });

    if (userId && exam.creator && exam.creator.toString() !== String(userId)) {
      return res.status(403).json({ message: 'Bu sınava soru ekleme yetkiniz yok.' });
    }

    exam.questions = questionIds || questions || [];
    await exam.save();

    res.status(200).json({
      message: 'Sınav soruları başarıyla güncellendi.',
      questionCount: exam.questions.length,
      examId: exam._id,
    });
  } catch (error) {
    console.error('Soru seçme/güncelleme hatası:', error);
    res.status(500).json({ message: 'Sınav soruları güncellenirken sunucu hatası oluştu.' });
  }
};

// DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı.' });
    
    const userId = req.user?.id || req.user?._id;
    if (userId && exam.creator && exam.creator.toString() !== String(userId)) {
      return res.status(403).json({ message: 'Bu sınavı silme yetkiniz yok.' });
    }
    
    await Exam.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Sınav başarıyla silindi.' });
  } catch (error) {
    console.error('Sınav silme hatası:', error);
    res.status(500).json({ message: 'Sınav silinirken hata oluştu.' });
  }
};

// PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const { title, description, duration, subject, category, passMark, classLevel, associatedClass } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı.' });
    
    const userId = req.user?.id || req.user?._id;
    if (userId && exam.creator && exam.creator.toString() !== String(userId)) {
      return res.status(403).json({ message: 'Bu sınavı düzenleme yetkiniz yok.' });
    }
    
    if (title) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (duration) exam.duration = duration;
    if (subject || category) exam.category = subject || category;
    if (passMark !== undefined) exam.passMark = passMark;
    if (classLevel !== undefined || associatedClass !== undefined) {
      exam.associatedClass = classLevel || associatedClass;
    }
    
    await exam.save();
    
    const formatted = {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      subject: exam.category,
      classLevel: exam.associatedClass,
      passMark: exam.passMark,
      questionCount: exam.questions?.length || 0,
      createdAt: exam.createdAt
    };
    
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Sınav güncelleme hatası:', error);
    res.status(500).json({ message: 'Sınav güncellenirken hata oluştu.' });
  }
};

module.exports = exports;
