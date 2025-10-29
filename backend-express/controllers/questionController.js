// backend-express/controllers/questionController.js (TAMAMLANMIŞ HALİ)

const Question = require('../models/Question'); // Güncellenmiş Soru modelimiz

/**
 * @desc    Yeni bir soru oluşturur (Sadece Öğretmen)
 * @route   POST /api/questions
 * @access  Private (Teacher)
 */
const createQuestion = async (req, res) => {
  try {
    // 1. Frontend'den gelen TÜM verileri al
    const {
      subject, classLevel, topic, learningOutcome, questionType,
      text,
      optionA, optionB, optionC, optionD, correctAnswerTest,
      correctAnswerDY,
      correctAnswerBosluk
    } = req.body;

    // 2. Soru Tipine göre verileri işle
    let options = [];
    let correctAnswer;

    if (questionType === 'test') {
      options = [optionA, optionB, optionC, optionD];
      if (correctAnswerTest === 'A') correctAnswer = optionA;
      else if (correctAnswerTest === 'B') correctAnswer = optionB;
      else if (correctAnswerTest === 'C') correctAnswer = optionC;
      else if (correctAnswerTest === 'D') correctAnswer = optionD;
    } else if (questionType === 'dogru-yanlis') {
      options = ['Doğru', 'Yanlış'];
      correctAnswer = correctAnswerDY;
    } else if (questionType === 'bosluk-doldurma') {
      correctAnswer = correctAnswerBosluk;
    } else {
      return res.status(400).json({ message: 'Geçersiz soru tipi.' });
    }

    // 3. Yeni Soruyu oluştur ve kaydet
    const newQuestion = new Question({
      createdBy: req.user._id, // 'protect' middleware'inden gelir
      subject, classLevel, topic, learningOutcome, questionType, text,
      options: options.length > 0 ? options : undefined,
      correctAnswer
    });

    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);

  } catch (error) {
    console.error('Soru oluşturma hatası:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * @desc    Giriş yapmış öğretmenin tüm sorularını listeler
 * @route   GET /api/questions
 * @access  Private (Teacher)
 */
const getMyQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ createdBy: req.user._id })
                                    .sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (error) {
    console.error('Soruları listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};


// --- YENİ EKLENEN FONKSİYONLAR ---

/**
 * @desc    Bir soruyu günceller
 * @route   PUT /api/questions/:id
 * @access  Private (Teacher)
 */
const updateQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user._id;

    // 1. Soruyu veritabanında bul
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı.' });
    }

    // 2. YETKİLENDİRME: Bu soruyu, giriş yapan kullanıcı mı oluşturmuş?
    if (question.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Yetkisiz işlem. Bu soruyu siz oluşturmamışsınız.' });
    }

    // 3. 'createQuestion' ile aynı veri işleme mantığını uygula
    // (Güncelleme işlemi de tüm form verisini almalı)
    const {
      subject, classLevel, topic, learningOutcome, questionType,
      text,
      optionA, optionB, optionC, optionD, correctAnswerTest,
      correctAnswerDY,
      correctAnswerBosluk
    } = req.body;

    let options = [];
    let correctAnswer;

    if (questionType === 'test') {
      options = [optionA, optionB, optionC, optionD];
      if (correctAnswerTest === 'A') correctAnswer = optionA;
      // ... (diğer B, C, D kontrolleri)
      else if (correctAnswerTest === 'B') correctAnswer = optionB;
      else if (correctAnswerTest === 'C') correctAnswer = optionC;
      else if (correctAnswerTest === 'D') correctAnswer = optionD;
    } else if (questionType === 'dogru-yanlis') {
      options = ['Doğru', 'Yanlış'];
      correctAnswer = correctAnswerDY;
    } else if (questionType === 'bosluk-doldurma') {
      correctAnswer = correctAnswerBosluk;
    }

    // 4. Veritabanında güncelle
    const updatedData = {
      subject, classLevel, topic, learningOutcome, questionType, text,
      options: options.length > 0 ? options : undefined,
      correctAnswer
    };

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId, 
      updatedData, 
      { new: true, runValidators: true } // 'new: true' güncellenmiş halini döndürür
    );

    res.status(200).json(updatedQuestion);

  } catch (error) {
    console.error('Soru güncelleme hatası:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};


/**
 * @desc    Bir soruyu siler
 * @route   DELETE /api/questions/:id
 * @access  Private (Teacher)
 */
const deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user._id;

    // 1. Soruyu bul
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı.' });
    }

    // 2. YETKİLENDİRME: Bu soruyu, giriş yapan kullanıcı mı oluşturmuş?
    if (question.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Yetkisiz işlem. Bu soruyu siz oluşturmamışsınız.' });
    }

    // 3. Soruyu sil
    await Question.findByIdAndDelete(questionId);

    res.status(200).json({ message: 'Soru başarıyla silindi.', id: questionId });

  } catch (error) {
    console.error('Soru silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};


// --- GÜNCELLENEN EXPORTS ---
module.exports = {
  createQuestion,
  getMyQuestions,
  updateQuestion,
  deleteQuestion
};