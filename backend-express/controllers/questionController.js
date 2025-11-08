// backend-express/controllers/questionController.js (RESİM URL'İ VE FİLTRELEME EKLENMİŞ SON HALİ)

const Question = require('../models/Question');
const User = require('../models/User'); 

// POST /api/questions - Yeni Soru Oluşturma
exports.createQuestion = async (req, res) => {
    try {
        // 'solutionText' yerine 'solutionImage'
        const {
            subject,
            classLevel,
            topic,
            learningOutcome,
            questionType,
            difficulty, 
            text,
            options,
            correctAnswer,
            solutionText 
        } = req.body;

        const createdBy = req.user.id;
        
        const question = new Question({
            createdBy,
            subject,
            classLevel,
            topic,
            learningOutcome,
            questionType,
            difficulty, 
            text,
            options,
            correctAnswer,
            solutionText 
        });

        const createdQuestion = await question.save();
        res.status(201).json(createdQuestion);

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Soru oluşturma hatası:', error);
        res.status(500).json({ message: 'Soru oluşturulurken sunucu hatası oluştu.' });
    }
};


// GET /api/questions - Tüm Soruları Getir (FİLTRELİ)
exports.getQuestions = async (req, res) => {
    try {
        const { classLevel, difficulty } = req.query; 
        const queryFilter = {};

        // queryFilter.createdBy = req.user.id; // Gerekirse

        if (classLevel) {
            queryFilter.classLevel = classLevel;
        }
        if (difficulty) {
            queryFilter.difficulty = difficulty;
        }

        const questions = await Question.find(queryFilter) 
            .populate('createdBy', 'username email') 
            .sort({ createdAt: -1 }); 

        res.status(200).json(questions);

    } catch (error) {
        console.error('Sorular listelenirken hata:', error);
        res.status(500).json({ message: 'Sorular listelenirken sunucu hatası oluştu.' });
    }
};


// GET /api/questions/:id - Tek Soru Getir
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id).populate('createdBy', 'username email');
        if (!question) {
            return res.status(404).json({ message: 'Soru bulunamadı.' });
        }
        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// PUT /api/questions/:id - Soru Güncelleme
exports.updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Soru bulunamadı.' });
        }
        if (question.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        // req.body 'solutionImage' alanını da içerecektir
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            req.body, 
            { new: true, runValidators: true } 
        );

        res.status(200).json(updatedQuestion);

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Soru güncellenirken sunucu hatası oluştu.' });
    }
};

// DELETE /api/questions/:id - Soru Silme
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Soru bulunamadı.' });
        }
        if (question.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        await Question.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Soru başarıyla silindi.' });

    } catch (error) {
        res.status(500).json({ message: 'Soru silinirken sunucu hatası oluştu.' });
    }
};