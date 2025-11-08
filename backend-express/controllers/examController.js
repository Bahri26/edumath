const Exam = require('../models/Exam');// backend-express/controllers/examController.js

const Result = require('../models/Result');

const Question = require('../models/Question');const Exam = require('../models/Exam');

const Result = require('../models/Result'); // Öğrencinin sınavı daha önce çözüp çözmediğini kontrol etmek için

exports.getAllExams = async (req, res) => {const Question = require('../models/Question'); // Soru modelini dahil edin

  try {const mongoose = require('mongoose');

    const exams = await Exam.find({ creator: req.user.id })

      .populate('questions', 'title difficulty points')// Utility fonksiyonu: Diziyi rastgele karıştırmak için (Fisher-Yates Algoritması)

      .populate('associatedClass', 'name')const shuffleArray = (array) => {

      .sort({ createdAt: -1 });    for (let i = array.length - 1; i > 0; i--) {

    res.json(exams);        const j = Math.floor(Math.random() * (i + 1));

  } catch (error) {        [array[i], array[j]] = [array[j], array[i]];

    res.status(500).json({ message: 'Sınavlar getirilirken hata oluştu.', error: error.message });    }

  }    return array;

};};



exports.getExamById = async (req, res) => {// POST /api/exams

  try {exports.createExam = async (req, res) => {

    const exam = await Exam.findById(req.params.id)    const { title, description, duration, category, passMark, associatedClass } = req.body;

      .populate('questions')    const creator = req.user.id; // authMiddleware'dan gelen kullanıcı ID'si

      .populate('creator', 'firstName lastName email')

      .populate('associatedClass', 'name gradeLevel');    // Temel alan kontrolü

    if (!exam) {    if (!title || !duration || !category) {

      return res.status(404).json({ message: 'Sınav bulunamadı.' });        return res.status(400).json({ message: 'Başlık, süre ve kategori zorunludur.' });

    }    }

    res.json(exam);

  } catch (error) {    try {

    res.status(500).json({ message: 'Sınav getirilirken hata oluştu.', error: error.message });        // --- 7 Kolay, 7 Orta, 7 Zor Kuralını Uygulama ---

  }        const difficultyLevels = ['Kolay', 'Orta', 'Zor'];

};        const numPerDifficulty = 7;

        const allQuestions = [];

exports.createExam = async (req, res) => {

  try {        // Promise.all ile üç farklı sorguyu eş zamanlı olarak çalıştır

    const examData = { ...req.body, creator: req.user.id };        const questionPromises = difficultyLevels.map(async (difficulty) => {

    const exam = new Exam(examData);            // MongoDB'den rastgele 7 soru çekme

    await exam.save();            // $sample aggregation'ı ile rastgelelik sağlanır, find().limit() de kullanılabilir.

    res.status(201).json({ message: 'Sınav başarıyla oluşturuldu.', exam });            const questions = await Question.aggregate([

  } catch (error) {                { $match: { category: category, difficulty: difficulty } },

    res.status(500).json({ message: 'Sınav oluşturulurken hata oluştu.', error: error.message });                { $sample: { size: numPerDifficulty } }

  }            ]);

};

            // Eğer yeterli soru yoksa hata dönebilir veya eksik sorularla devam edilebilir.

exports.updateExam = async (req, res) => {            if (questions.length < numPerDifficulty) {

  try {                console.warn(`UYARI: ${category} kategorisinde, ${difficulty} seviyesinde yeterli (${numPerDifficulty}) soru bulunamadı. Sadece ${questions.length} soru eklendi.`);

    const exam = await Exam.findById(req.params.id);            }

    if (!exam) {            return questions;

      return res.status(404).json({ message: 'Sınav bulunamadı.' });        });

    }

    if (exam.creator.toString() !== req.user.id) {        // Tüm sorgu sonuçlarını bekle

      return res.status(403).json({ message: 'Bu sınavı güncelleme yetkiniz yok.' });        const results = await Promise.all(questionPromises);

    }        

    const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });        // Sonuçları tek bir diziye birleştir ve ID'lerini al

    res.json({ message: 'Sınav başarıyla güncellendi.', exam: updatedExam });        let finalQuestionIDs = results.flat().map(q => q._id);

  } catch (error) {

    res.status(500).json({ message: 'Sınav güncellenirken hata oluştu.', error: error.message });        // Toplam 21 soru kuralı kontrolü

  }        if (finalQuestionIDs.length < 21) {

};            return res.status(400).json({ message: `Sınav oluşturmak için ${category} kategorisinde yeterli soru (${finalQuestionIDs.length} / 21) bulunamadı. Eksik seviyeleri kontrol edin.` });

        }

exports.deleteExam = async (req, res) => {        

  try {        // Soruları karıştır (Rastgele görünmesi için)

    const exam = await Exam.findById(req.params.id);        finalQuestionIDs = shuffleArray(finalQuestionIDs);

    if (!exam) {

      return res.status(404).json({ message: 'Sınav bulunamadı.' });

    }        // Yeni Sınavı oluşturma

    if (exam.creator.toString() !== req.user.id) {        const newExam = new Exam({

      return res.status(403).json({ message: 'Bu sınavı silme yetkiniz yok.' });            title,

    }            description,

    await Exam.findByIdAndDelete(req.params.id);            duration,

    res.json({ message: 'Sınav başarıyla silindi.' });            category,

  } catch (error) {            passMark,

    res.status(500).json({ message: 'Sınav silinirken hata oluştu.', error: error.message });            associatedClass: associatedClass || null,

  }            creator,

};            questions: finalQuestionIDs // 21 (veya mevcut) soru ID'si

        });

exports.publishExam = async (req, res) => {

  try {        const createdExam = await newExam.save();

    const exam = await Exam.findById(req.params.id);        

    if (!exam) {        // Başarılı yanıt

      return res.status(404).json({ message: 'Sınav bulunamadı.' });        res.status(201).json(createdExam);

    }

    if (exam.creator.toString() !== req.user.id) {    } catch (error) {

      return res.status(403).json({ message: 'Bu sınavı yayınlama yetkiniz yok.' });        console.error('Sınav oluşturma hatası:', error);

    }        res.status(500).json({ message: 'Sınav oluşturulurken sunucu hatası oluştu.' });

    await exam.publish();    }

    res.json({ message: 'Sınav başarıyla yayınlandı.', exam });};

  } catch (error) {

    res.status(500).json({ message: 'Sınav yayınlanırken hata oluştu.', error: error.message });// GET /api/exams

  }exports.getExams = async (req, res) => {

};    try {

        // Kullanıcının oluşturduğu veya yetkili olduğu sınavları listele

exports.closeExam = async (req, res) => {        // Tüm sınavları getirirken sadece gerekli alanları (title, category vb.) getirebiliriz.

  try {        const exams = await Exam.find()

    const exam = await Exam.findById(req.params.id);            .select('title description duration category creator associatedClass')

    if (!exam) {            .populate('creator', 'username email') // Oluşturan kullanıcı bilgilerini ekle

      return res.status(404).json({ message: 'Sınav bulunamadı.' });            .sort({ createdAt: -1 });

    }

    if (exam.creator.toString() !== req.user.id) {        res.status(200).json(exams);

      return res.status(403).json({ message: 'Bu sınavı kapatma yetkiniz yok.' });

    }    } catch (error) {

    await exam.close();        console.error('Sınav listeleme hatası:', error);

    res.json({ message: 'Sınav başarıyla kapatıldı.', exam });        res.status(500).json({ message: 'Sınavlar listelenirken sunucu hatası oluştu.' });

  } catch (error) {    }

    res.status(500).json({ message: 'Sınav kapatılırken hata oluştu.', error: error.message });};

  }

};// GET /api/exams/:id - Tek bir sınavın detaylarını getirir (sorular hariç)

exports.getExamById = async (req, res) => {

exports.getExamStatistics = async (req, res) => {    try {

  try {        const exam = await Exam.findById(req.params.id)

    const exam = await Exam.findById(req.params.id);            .select('-questions') // Soruları göndermeye gerek yok, sadece meta-veri

    if (!exam) {            .populate('creator', 'firstName lastName');

      return res.status(404).json({ message: 'Sınav bulunamadı.' });

    }        if (!exam) {

    await exam.updateStatistics();            return res.status(404).json({ message: 'Sınav bulunamadı.' });

    res.json({ statistics: exam.statistics, totalQuestions: exam.questions.length, status: exam.status });        }

  } catch (error) {

    res.status(500).json({ message: 'İstatistikler alınırken hata oluştu.', error: error.message });        // Soru sayısını manuel olarak ekleyelim

  }        const examWithQuestionCount = exam.toObject();

};        const sourceExam = await Exam.findById(req.params.id).select('questions');

        examWithQuestionCount.questionCount = sourceExam.questions.length;

exports.startExam = async (req, res) => {

  try {        res.status(200).json(examWithQuestionCount);

    const exam = await Exam.findById(req.params.id).populate('questions');

    if (!exam) {    } catch (error) {

      return res.status(404).json({ message: 'Sınav bulunamadı.' });        console.error('Sınav detayı getirme hatası:', error);

    }        if (error.kind === 'ObjectId') {

    if (!exam.isPublished || !exam.isActive) {            return res.status(400).json({ message: 'Geçersiz Sınav ID formatı.' });

      return res.status(403).json({ message: 'Bu sınav şu anda aktif değil.' });        }

    }        res.status(500).json({ message: 'Sınav detayları getirilirken bir hata oluştu.' });

    const now = new Date();    }

    if (exam.startDate && now < exam.startDate) {};

      return res.status(403).json({ message: 'Sınav henüz başlamadı.' });

    }/**

    if (exam.endDate && now > exam.endDate) { * @desc    Bir öğrencinin sınavı başlatması için sınav sorularını getirir

      return res.status(403).json({ message: 'Sınav süresi doldu.' }); * @route   GET /api/exams/:id/start

    } * @access  Private (Student)

    const previousAttempts = await Result.countDocuments({ examId: req.params.id, studentId: req.user.id }); */

    if (!exam.allowRetake && previousAttempts > 0) {exports.startExam = async (req, res) => {

      return res.status(403).json({ message: 'Bu sınavı daha önce çözdünüz.' });    const { id: examId } = req.params;

    }    const studentId = req.user._id;

    if (previousAttempts >= exam.maxAttempts) {

      return res.status(403).json({ message: 'Maksimum deneme sayısına ulaştınız.' });    try {

    }        // 1. Öğrencinin bu sınavı daha önce tamamlayıp tamamlamadığını kontrol et

    let questions = exam.questions;        const existingResult = await Result.findOne({ examId, studentId });

    if (exam.shuffleQuestions) {        if (existingResult) {

      questions = [...questions].sort(() => Math.random() - 0.5);            return res.status(403).json({ message: 'Bu sınavı daha önce tamamladınız. Tekrar çözemezsiniz.' });

    }        }

    res.json({

      exam: {        // 2. Sınavı ve sorularını getir

        id: exam._id,        const exam = await Exam.findById(examId)

        title: exam.title,            .populate({

        description: exam.description,                path: 'questions',

        duration: exam.duration,                // Güvenlik: Öğrenciye doğru cevabı ve gereksiz bilgileri GÖNDERME!

        totalPoints: exam.totalPoints,                select: 'text options questionType difficulty' 

        questions: questions.map(q => ({ id: q._id, question: q.question, options: q.options, points: q.points }))            });

      },

      attemptNumber: previousAttempts + 1        if (!exam) {

    });            return res.status(404).json({ message: 'Sınav bulunamadı.' });

  } catch (error) {        }

    res.status(500).json({ message: 'Sınav başlatılırken hata oluştu.', error: error.message });

  }        // 3. Soruları karıştır

};        const shuffledQuestions = shuffleArray(exam.questions);



module.exports = exports;        // 4. Öğrenciye sadece gerekli bilgileri gönder

        res.status(200).json({
            _id: exam._id,
            title: exam.title,
            description: exam.description,
            duration: exam.duration,
            category: exam.category,
            questions: shuffledQuestions
        });

    } catch (error) {
        console.error('Sınav başlatma hatası:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Geçersiz Sınav ID formatı.' });
        }
        res.status(500).json({ message: 'Sınav başlatılırken bir sunucu hatası oluştu.' });
    }
};

// PUT /api/exams/:examId/questions ---
exports.updateQuestionsForExam = async (req, res) => {
    const { examId } = req.params;
    // Frontend'den gönderilen yeni soru ID'leri dizisi
    const { questionIds } = req.body; 
    const userId = req.user.id; // Öğretmen ID'si

    try {
        const exam = await Exam.findById(examId);

        if (!exam) {
            return res.status(404).json({ message: 'Sınav bulunamadı.' });
        }
        
        // YETKİLENDİRME KONTROLÜ (Bu sınavı gerçekten bu öğretmen mi oluşturdu?)
        if (exam.creator.toString() !== userId) {
            return res.status(403).json({ message: 'Bu sınava soru ekleme yetkiniz yok.' });
        }

        // Exam modelindeki questions dizisini, gelen ID'ler ile tamamen değiştir
        exam.questions = questionIds;
        await exam.save();
        
        res.status(200).json({ 
            message: 'Sınav soruları başarıyla güncellendi.',
            questionCount: exam.questions.length,
            examId: exam._id
        });

    } catch (error) {
        console.error('Soru seçme/güncelleme hatası:', error);
        res.status(500).json({ message: 'Sınav soruları güncellenirken sunucu hatası oluştu.' });
    }
}