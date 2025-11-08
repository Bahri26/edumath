// backend-express/controllers/resultController.js (HATASIZ VE GÜNCEL SON HAL)

const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const mongoose = require('mongoose');

// Sınav Gönderimi ve Puanlama Fonksiyonu
const submitExam = async (req, res) => {
    const { examId, answers, completionTime } = req.body;
    const studentId = req.user.id; 

    if (!examId || !answers || !answers.length) {
        return res.status(400).json({ message: 'Sınav ID ve cevaplar zorunludur.' });
    }
    
    try {
        const exam = await Exam.findById(examId);
        const questions = await Question.find({ _id: { $in: exam.questions } });
        
        const correctAnswersMap = questions.reduce((map, q) => {
            map[q._id.toString()] = q.correctAnswer;
            return map;
        }, {});

        // Skor Hesaplama (Önceki mantık aynı kalır)
        let correctCount = 0;
        let wrongCount = 0;
        const totalQuestions = exam.questions.length;
        const processedAnswers = [];

        answers.forEach(submitted => {
            const questionId = submitted.questionId.toString();
            const submittedAnswer = submitted.submittedAnswer;
            const correctAnswer = correctAnswersMap[questionId];
            
            let isCorrect = false;

            if (correctAnswer && submittedAnswer === correctAnswer) {
                isCorrect = true;
                correctCount++;
            } else if (submittedAnswer !== null && submittedAnswer !== "" && correctAnswer) {
                wrongCount++;
            }

            processedAnswers.push({
                questionId: questionId,
                submittedAnswer: submittedAnswer,
                isCorrect: isCorrect
            });
        });

        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = scorePercentage >= exam.passMark;

        // Sonucu Kaydetme
        const newResult = new Result({
            examId: examId,
            studentId: studentId,
            score: scorePercentage,
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            answers: processedAnswers,
            completionTime: completionTime || 0,
            passed: passed
        });

        const savedResult = await newResult.save();

        res.status(201).json({
            message: 'Sınav başarıyla tamamlandı ve puanlandı.',
            result: savedResult,
            summary: { score: scorePercentage, passed: passed, correctCount: correctCount, totalQuestions: totalQuestions }
        });

    } catch (error) {
        console.error('Sınav puanlama hatası:', error);
        res.status(500).json({ message: 'Sınav sonuçları kaydedilirken bir hata oluştu.' });
    }
};

// GET /api/results/:examId (Öğretmen Raporu)
const getExamResults = async (req, res) => {
    const { examId } = req.params;
    
    try {
        const exam = await Exam.findById(examId).select('title passMark');
        if (!exam) {
            return res.status(404).json({ message: 'Sonuçları istenen sınav bulunamadı.' });
        }

        const results = await Result.find({ examId: examId })
            .populate('studentId', 'firstName lastName email classId')
            .sort({ score: -1 });

        const totalSubmissions = results.length;
        const passedCount = results.filter(r => r.passed).length;
        const avgScore = totalSubmissions > 0 
            ? results.reduce((sum, r) => sum + r.score, 0) / totalSubmissions
            : 0;
            
        res.status(200).json({
            examTitle: exam.title,
            passMark: exam.passMark,
            stats: { totalSubmissions, passedCount, avgScore: Math.round(avgScore) },
            studentResults: results
        });

    } catch (error) {
        console.error('Sınav sonuçlarını getirme hatası:', error);
        res.status(500).json({ message: 'Sonuçlar listelenirken sunucu hatası oluştu.' });
    }
};

/**
 * @desc    Giriş yapmış öğrencinin tüm sınav sonuçlarını getirir (Karne sayfası için)
 * @route   GET /api/results/my-results
 * @access  Private (Student)
 */
const getMyResults = async (req, res) => {
    const studentId = req.user._id;

    try {
        // Öğrencinin ID'sine göre tüm sonuçları bul
        const myResults = await Result.find({ studentId: studentId })
            // Her sonucun ilişkili olduğu sınavın bilgilerini de getir
            .populate({
                path: 'examId',
                select: 'title category passMark' // Sadece gerekli alanları seç
            })
            // En yeniden eskiye doğru sırala
            .sort({ createdAt: -1 });

        res.status(200).json(myResults);

    } catch (error) {
        console.error('Öğrenci sonuçlarını getirme hatası:', error);
        res.status(500).json({ message: 'Sınav sonuçlarınız listelenirken bir hata oluştu.' });
    }
};

// --- KRİTİK DÜZELTME: Tüm fonksiyonları dışa aktar ---
module.exports = {
    submitExam,
    getExamResults,
    getMyResults // Yeni fonksiyonu export et
};