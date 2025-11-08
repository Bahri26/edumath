// backend-express/routes/resultRoutes.js (HATASIZ VE GÜNCEL SON HAL)

const express = require('express');

const { submitExam, getExamResults, getMyResults } = require('../controllers/resultController'); 
const { protect, teacherCheck, studentCheck } = require('../middleware/authMiddleware'); 

const router = express.Router();

// GET /api/results/my-results (Öğrencinin kendi karne sayfası)
router.get('/my-results', protect, studentCheck, getMyResults);

// POST /api/results/submit (Sınav Gönderimi)
router.post('/submit', protect, submitExam);

// GET /api/results/:examId (Detaylı Raporu Çekme)
// Bu satırın var olduğundan ve doğru fonksiyonu çağırdığından emin olun.
router.get('/:examId', protect, teacherCheck, getExamResults); 

module.exports = router;