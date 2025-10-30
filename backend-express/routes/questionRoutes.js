// backend-express/routes/questionRoutes.js (SON HALİ)

const express = require('express');
const router = express.Router();
const {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion
} = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware'); // Yetkilendirme

// GET /api/questions -> Tüm soruları listele
// POST /api/questions -> Yeni soru oluştur (Giriş yapmış olmalı)
router.route('/')
    .get(getQuestions) 
    .post(protect, createQuestion); 

// GET /api/questions/:id -> Tek soru detayı
// PUT /api/questions/:id -> Soru güncelle (Giriş yapmış olmalı)
// DELETE /api/questions/:id -> Soru sil (Giriş yapmış olmalı)
router.route('/:id')
    .get(getQuestionById) 
    .put(protect, updateQuestion) 
    .delete(protect, deleteQuestion); 

module.exports = router;