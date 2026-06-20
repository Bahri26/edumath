
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const protect = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { collectTopicStats } = require('../services/studentAnalyticsService');
const { getAiProvider } = require('../config/aiProvider');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const teacherOnly = [protect, roleMiddleware(['teacher', 'admin'])];
const authenticated = [protect, roleMiddleware(['student', 'teacher', 'admin'])];

// 9. Teacher Report (Detaylı öğretmen raporu)
router.post('/teacher-report', ...teacherOnly, aiController.teacherReport);
// 7. Sınav Sonucu Değerlendirme & Analiz
router.post('/exam-result-analysis', ...teacherOnly, aiController.examResultAnalysis);
// 8. Soru Çözerken İpucu (öğrenci girişi ile çağrılır; LearningEvent yazılır)
router.post('/get-hint', ...authenticated, aiController.getHint);
// 6. Öğrenci Cevabı Analiz & Soru Önerisi
router.post('/analyze-and-suggest', ...teacherOnly, aiController.analyzeAndSuggest);

const uploadDir = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedImageExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const safeExt = allowedImageExt.has(ext) ? ext : '.png';
            cb(null, `smart-${Date.now()}-${crypto.randomUUID()}${safeExt}`);
        },
    }),
    limits: { fileSize: 12 * 1024 * 1024 },
});

// 1. Fotoğraftan Çözüm
router.post('/solve-image', ...teacherOnly, upload.single('image'), aiController.solveFromImage);

// 1.b Akıllı Görsel Parse (Structured JSON)
router.post('/smart-parse', ...teacherOnly, upload.single('image'), aiController.smartParse);

// 1.c Akıllı Metin Parse (Copy-Paste)
router.post('/smart-parse-text', ...teacherOnly, aiController.smartParseText);

// 2. Soru Üretici (Öğretmen)
router.post('/generate-quiz', ...teacherOnly, aiController.generateQuiz);

// 2.b MEB uyumlu, gorsel-odakli oruntu soru paketi
router.post('/generate-pattern-pack', ...teacherOnly, aiController.generatePatternQuestionPack);

// 3. Çalışma Planı (Öğrenci - Artık controller'da var)
router.post('/study-plan', ...authenticated, aiController.createStudyPlan);

// 4. Analiz
router.post('/analyze', ...authenticated, aiController.analyzePerformance);

// 5. Alıştırma (Öğrenci - Practice)
router.post('/practice', ...authenticated, aiController.generatePracticeQuestions);

// Yerel ML: öğrenci konu istatistikleri (ml-service veya ml-matrix fallback)
router.get('/student-insights', ...authenticated, async (req, res) => {
  try {
    const stats = await collectTopicStats(req.user.id);
    res.json({
      provider: getAiProvider(),
      scoringProvider: stats.scoringProvider || 'local-matrix',
      weakTopics: stats.weakTopics,
      topics: stats.entries,
      suggested: Boolean(stats.suggested),
      hasActivity: Boolean(stats.hasActivity),
    });
  } catch (e) {
    res.status(500).json({ message: 'İstatistikler alınamadı.', error: e.message });
  }
});

module.exports = router;
