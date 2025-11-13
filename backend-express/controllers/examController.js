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
exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .select('title description duration category creator associatedClass createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json(exams);
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
    const { title, description, duration, category, passMark, associatedClass, questions = [] } = req.body;
    if (!title || !duration || !category) {
      return res.status(400).json({ message: 'Başlık, süre ve kategori zorunludur.' });
    }

    const exam = new Exam({
      title,
      description: description || '',
      duration,
      category,
      passMark: passMark ?? null,
      associatedClass: associatedClass || null,
      creator: req.user?.id || req.user?._id || null,
      questions,
    });

    await exam.save();
    res.status(201).json({ message: 'Sınav başarıyla oluşturuldu.', exam });
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
  const { questionIds } = req.body;
  const userId = req.user?.id || req.user?._id;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı.' });

    if (userId && exam.creator && exam.creator.toString() !== String(userId)) {
      return res.status(403).json({ message: 'Bu sınava soru ekleme yetkiniz yok.' });
    }

    exam.questions = questionIds || [];
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

module.exports = exports;
