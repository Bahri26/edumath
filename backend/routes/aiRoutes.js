
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const protect = require('../middlewares/authMiddleware');
const { collectTopicStats } = require('../services/studentAnalyticsService');
const { getAiProvider } = require('../config/aiProvider');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 9. Teacher Report (Detaylı öğretmen raporu)
router.post('/teacher-report', aiController.teacherReport);
// 7. Sınav Sonucu Değerlendirme & Analiz
router.post('/exam-result-analysis', aiController.examResultAnalysis);
// 8. Soru Çözerken İpucu (öğrenci girişi ile çağrılır; LearningEvent yazılır)
router.post('/get-hint', protect, aiController.getHint);
// 6. Öğrenci Cevabı Analiz & Soru Önerisi
router.post('/analyze-and-suggest', aiController.analyzeAndSuggest);

// Klasör yoksa oluştur (Otomatik kontrol - Güvenlik önlemi)
const uploadDir = 'uploads/temp/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Ayarı
const upload = multer({ dest: uploadDir });

// 1. Fotoğraftan Çözüm
router.post('/solve-image', upload.single('image'), aiController.solveFromImage);

// 1.b Akıllı Görsel Parse (Structured JSON)
router.post('/smart-parse', upload.single('image'), aiController.smartParse);

// 1.c Akıllı Metin Parse (Copy-Paste)
router.post('/smart-parse-text', aiController.smartParseText);

// 2. Soru Üretici (Öğretmen)
router.post('/generate-quiz', aiController.generateQuiz);

// 2.b MEB uyumlu, gorsel-odakli oruntu soru paketi
router.post('/generate-pattern-pack', aiController.generatePatternQuestionPack);

// 3. Çalışma Planı (Öğrenci - Artık controller'da var)
router.post('/study-plan', aiController.createStudyPlan);

// 4. Analiz
router.post('/analyze', aiController.analyzePerformance);

// 5. Alıştırma (Öğrenci - Practice)
router.post('/practice', aiController.generatePracticeQuestions);

// Yerel ML: öğrenci konu istatistikleri (AI_PROVIDER=local)
router.get('/student-insights', protect, async (req, res) => {
  try {
    const stats = await collectTopicStats(req.user.id);
    res.json({
      provider: getAiProvider(),
      weakTopics: stats.weakTopics,
      topics: stats.entries,
    });
  } catch (e) {
    res.status(500).json({ message: 'İstatistikler alınamadı.', error: e.message });
  }
});

module.exports = router;