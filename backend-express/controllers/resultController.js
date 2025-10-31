// backend-express/controllers/resultController.js

const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const mongoose = require('mongoose');

// POST /api/results/submit
exports.submitExam = async (req, res) => {
    const { examId, answers, completionTime } = req.body;
    const studentId = req.user.id; // Token'dan alınan öğrenci ID'si (Giriş zorunlu)

    if (!examId || !answers || !answers.length) {
        return res.status(400).json({ message: 'Sınav ID ve cevaplar zorunludur.' });
    }
    
    try {
        // 1. Sınav ve Soruları Çekme
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Sınav bulunamadı.' });
        }
        
        // Sınavın içerdiği tüm soruların tam objelerini (doğru cevapları dahil) çek
        const questions = await Question.find({ _id: { $in: exam.questions } });
        
        // Doğru cevapları ID'ye göre hızlı erişim için haritala
        const correctAnswersMap = questions.reduce((map, q) => {
            map[q._id.toString()] = q.correctAnswer;
            return map;
        }, {});

        // 2. Skor Hesaplama
        let correctCount = 0;
        let wrongCount = 0;
        const totalQuestions = exam.questions.length;
        const processedAnswers = [];

        answers.forEach(submitted => {
            const questionId = submitted.questionId.toString();
            const submittedAnswer = submitted.submittedAnswer;
            const correctAnswer = correctAnswersMap[questionId];
            
            let isCorrect = false;

            // Öğrencinin cevabını doğru cevapla karşılaştır
            if (correctAnswer && submittedAnswer === correctAnswer) {
                isCorrect = true;
                correctCount++;
            } else if (submittedAnswer !== null && submittedAnswer !== "" && correctAnswer) {
                // Cevap varsa ve yanlışsa (boş bırakılmadıysa)
                wrongCount++;
            }

            processedAnswers.push({
                questionId: questionId,
                submittedAnswer: submittedAnswer,
                isCorrect: isCorrect
            });
        });

        // Puanı Hesapla (Yüzde cinsinden)
        const scorePercentage = totalQuestions > 0 
            ? Math.round((correctCount / totalQuestions) * 100) 
            : 0;
        
        // Geçme/Kalma Durumunu Belirle (Exam modelindeki passMark'a göre)
        const passed = scorePercentage >= exam.passMark;


        // 3. Sonucu Kaydetme
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


        // 4. Yanıt Gönderme
        res.status(201).json({
            message: 'Sınav başarıyla tamamlandı ve puanlandı.',
            result: savedResult,
            summary: {
                score: scorePercentage,
                passed: passed,
                correctCount: correctCount,
                totalQuestions: totalQuestions
            }
        });

    } catch (error) {
        console.error('Sınav puanlama hatası:', error);
        res.status(500).json({ message: 'Sınav sonuçları kaydedilirken bir hata oluştu.' });
    }
};

// --- YENİ EKLENDİ: GET /api/results/:examId ---
// Belirli bir sınava ait tüm öğrencilerin sonuçlarını getirir (Öğretmen Görünümü)
exports.getExamResults = async (req, res) => {
    const { examId } = req.params;
    
    // NOT: Gerçek projede, öğretmenin bu sınava yetkili olup olmadığı kontrol edilmelidir (teacherCheck).

    try {
        // Exam başlığını çekme
        const exam = await Exam.findById(examId).select('title passMark');
        if (!exam) {
            return res.status(404).json({ message: 'Sonuçları istenen sınav bulunamadı.' });
        }

        // Bu sınava ait tüm sonuçları çek
        const results = await Result.find({ examId: examId })
            .populate('studentId', 'firstName lastName email classId') // Öğrenci bilgilerini çek
            .sort({ score: -1 }); // En yüksek puandan en düşüğe sırala

        // Genel istatistikleri hesapla
        const totalSubmissions = results.length;
        const passedCount = results.filter(r => r.passed).length;
        const avgScore = totalSubmissions > 0 
            ? results.reduce((sum, r) => sum + r.score, 0) / totalSubmissions
            : 0;
            
        res.status(200).json({
            examTitle: exam.title,
            passMark: exam.passMark,
            stats: {
                totalSubmissions,
                passedCount,
                avgScore: Math.round(avgScore),
            },
            studentResults: results // Detaylı öğrenci listesi
        });

    } catch (error) {
        console.error('Sınav sonuçlarını getirme hatası:', error);
        res.status(500).json({ message: 'Sonuçlar listelenirken sunucu hatası oluştu.' });
    }
};