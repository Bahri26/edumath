// backend-express/routes/resultRoutes.js (HATASIZ VE GÜNCEL SON HAL)

const express = require('express');
// KRİTİK DÜZELTME: Controller'dan her iki fonksiyonu da doğru adla çekiyoruz.
const { submitExam, getExamResults } = require('../controllers/resultController'); 
const { protect, teacherCheck } = require('../middleware/authMiddleware'); 

const router = express.Router();

// POST /api/results/submit (Sınav Gönderimi)
router.post('/submit', protect, submitExam);

// GET /api/results/:examId (Detaylı Raporu Çekme)
// Bu satırın var olduğundan ve doğru fonksiyonu çağırdığından emin olun.
router.get('/:examId', protect, teacherCheck, getExamResults); 

module.exports = router;