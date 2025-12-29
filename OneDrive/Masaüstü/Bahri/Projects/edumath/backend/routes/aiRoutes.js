const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Klasör yoksa oluştur (Otomatik kontrol - Güvenlik önlemi)
const uploadDir = 'uploads/temp/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Ayarı
const upload = multer({ dest: uploadDir });

// 1. Fotoğraftan Çözüm
router.post('/solve-image', upload.single('image'), aiController.solveFromImage);

// 2. Soru Üretici (Öğretmen)
router.post('/generate-quiz', aiController.generateQuiz);

// 3. Çalışma Planı (Öğrenci - Artık controller'da var)
router.post('/study-plan', aiController.createStudyPlan);

// 4. Analiz
router.post('/analyze', aiController.analyzePerformance);

// 5. Alıştırma (Öğrenci - Practice)
router.post('/practice', aiController.generatePracticeQuestions);

module.exports = router;