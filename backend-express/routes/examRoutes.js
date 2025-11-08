// backend-express/routes/examRoutes.js (Düzeltilecek Satır)

const express = require('express');

const { createExam, getExams, getExamById, startExam, updateQuestionsForExam } = require('../controllers/examController'); 
const { protect, studentCheck } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.route('/')
    .get(getExams)
    .post(protect, createExam); 

router.route('/:id')
    .get(protect, getExamById); // Herhangi bir giriş yapmış kullanıcı sınav detayını görebilir

// Öğrencinin sınavı başlattığı endpoint
router.route('/:id/start').get(protect, studentCheck, startExam);

// Hata veren satırın çalıştığı route:
router.route('/:examId/questions')
    .put(protect, updateQuestionsForExam); // ARTIK TANIMLI

module.exports = router;