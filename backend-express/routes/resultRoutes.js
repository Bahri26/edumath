// backend-express/routes/resultRoutes.js

const express = require('express');
const { submitExam } = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware'); // Sınavı sadece giriş yapan öğrenci gönderebilir

const router = express.Router();

// POST /api/results/submit - Öğrencinin cevaplarını kaydeder ve puanı hesaplar
router.post('/submit', protect, submitExam);

// GET /api/results/:examId - Belirli bir sınavın tüm sonuçlarını getir (Öğretmen için)
// router.get('/:examId', protect, getExamResults); // Daha sonra eklenebilir

module.exports = router;