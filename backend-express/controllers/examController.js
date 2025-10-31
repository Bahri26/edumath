// backend-express/controllers/examController.js

const Exam = require('../models/Exam');
const Question = require('../models/Question'); // Soru modelini dahil edin
const mongoose = require('mongoose');

// Utility fonksiyonu: Diziyi rastgele karıştırmak için (Fisher-Yates Algoritması)
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// POST /api/exams
exports.createExam = async (req, res) => {
    const { title, description, duration, category, passMark, associatedClass } = req.body;
    const creator = req.user.id; // authMiddleware'dan gelen kullanıcı ID'si

    // Temel alan kontrolü
    if (!title || !duration || !category) {
        return res.status(400).json({ message: 'Başlık, süre ve kategori zorunludur.' });
    }

    try {
        // --- 7 Kolay, 7 Orta, 7 Zor Kuralını Uygulama ---
        const difficultyLevels = ['Kolay', 'Orta', 'Zor'];
        const numPerDifficulty = 7;
        const allQuestions = [];

        // Promise.all ile üç farklı sorguyu eş zamanlı olarak çalıştır
        const questionPromises = difficultyLevels.map(async (difficulty) => {
            // MongoDB'den rastgele 7 soru çekme
            // $sample aggregation'ı ile rastgelelik sağlanır, find().limit() de kullanılabilir.
            const questions = await Question.aggregate([
                { $match: { category: category, difficulty: difficulty } },
                { $sample: { size: numPerDifficulty } }
            ]);

            // Eğer yeterli soru yoksa hata dönebilir veya eksik sorularla devam edilebilir.
            if (questions.length < numPerDifficulty) {
                console.warn(`UYARI: ${category} kategorisinde, ${difficulty} seviyesinde yeterli (${numPerDifficulty}) soru bulunamadı. Sadece ${questions.length} soru eklendi.`);
            }
            return questions;
        });

        // Tüm sorgu sonuçlarını bekle
        const results = await Promise.all(questionPromises);
        
        // Sonuçları tek bir diziye birleştir ve ID'lerini al
        let finalQuestionIDs = results.flat().map(q => q._id);

        // Toplam 21 soru kuralı kontrolü
        if (finalQuestionIDs.length < 21) {
            return res.status(400).json({ message: `Sınav oluşturmak için ${category} kategorisinde yeterli soru (${finalQuestionIDs.length} / 21) bulunamadı. Eksik seviyeleri kontrol edin.` });
        }
        
        // Soruları karıştır (Rastgele görünmesi için)
        finalQuestionIDs = shuffleArray(finalQuestionIDs);


        // Yeni Sınavı oluşturma
        const newExam = new Exam({
            title,
            description,
            duration,
            category,
            passMark,
            associatedClass: associatedClass || null,
            creator,
            questions: finalQuestionIDs // 21 (veya mevcut) soru ID'si
        });

        const createdExam = await newExam.save();
        
        // Başarılı yanıt
        res.status(201).json(createdExam);

    } catch (error) {
        console.error('Sınav oluşturma hatası:', error);
        res.status(500).json({ message: 'Sınav oluşturulurken sunucu hatası oluştu.' });
    }
};

// GET /api/exams
exports.getExams = async (req, res) => {
    try {
        // Kullanıcının oluşturduğu veya yetkili olduğu sınavları listele
        // Tüm sınavları getirirken sadece gerekli alanları (title, category vb.) getirebiliriz.
        const exams = await Exam.find()
            .select('title description duration category creator associatedClass')
            .populate('creator', 'username email') // Oluşturan kullanıcı bilgilerini ekle
            .sort({ createdAt: -1 });

        res.status(200).json(exams);

    } catch (error) {
        console.error('Sınav listeleme hatası:', error);
        res.status(500).json({ message: 'Sınavlar listelenirken sunucu hatası oluştu.' });
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