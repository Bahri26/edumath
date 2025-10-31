// backend-express/routes/resultRoutes.js (Düzeltilecek Satır)

const express = require('express');
// --- KRİTİK DÜZELTME ---
const { submitExam, getExamResults } = require('../controllers/resultController'); 
// --- KRİTİK DÜZELTME SONU ---
const { protect, teacherCheck } = require('../middleware/authMiddleware'); 

const router = express.Router();

// POST /api/results/submit - Öğrenci sınavı gönderir
router.post('/submit', protect, submitExam);

// GET /api/results/:examId - Belirli bir sınavın tüm sonuçlarını getir (Öğretmen için)
// Bu satırda hata alınıyor
router.get('/:examId', protect, teacherCheck, getExamResults); 

module.exports = router;