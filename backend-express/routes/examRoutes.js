// backend-express/routes/examRoutes.js (Düzeltilecek Satır)

const express = require('express');
// --- KRİTİK DÜZELTME ---
const { createExam, getExams, updateQuestionsForExam } = require('../controllers/examController'); 
// --- KRİTİK DÜZELTME SONU ---
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.route('/')
    .get(getExams)
    .post(protect, createExam); 

// Hata veren satırın çalıştığı route:
router.route('/:examId/questions')
    .put(protect, updateQuestionsForExam); // ARTIK TANIMLI

module.exports = router;