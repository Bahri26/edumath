const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/surveysController');
const requireRole = require('../middleware/requireRole');
const multer = require('multer');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 15 * 1024 * 1024 }
});

// ===== Special endpoints (must be before /:id) =====
router.post('/import-word', requireRole('teacher', 'admin'), upload.single('file'), ctrl.importFromWord);
router.get('/stats/:id', requireRole('teacher', 'admin'), ctrl.stats);

// ===== SURVEY CRUD =====
router.get('/', requireRole('student', 'teacher', 'admin'), ctrl.list);
router.post('/', requireRole('teacher', 'admin'), ctrl.create);
router.get('/:id', requireRole('student', 'teacher', 'admin'), ctrl.getOne);
router.put('/:id', requireRole('teacher', 'admin'), ctrl.update);
router.delete('/:id', requireRole('teacher', 'admin'), ctrl.remove);

// ===== SURVEY QUESTIONS =====
router.get('/:id/questions', requireRole('student', 'teacher', 'admin'), ctrl.getQuestions);
router.post('/:id/questions', requireRole('teacher', 'admin'), ctrl.addQuestion);
router.put('/:id/questions/:questionId', requireRole('teacher', 'admin'), ctrl.updateQuestion);
router.delete('/:id/questions/:questionId', requireRole('teacher', 'admin'), ctrl.removeQuestion);
router.post('/:id/questions/reorder', requireRole('teacher', 'admin'), ctrl.reorderQuestions);

// ===== SURVEY RESPONSES =====
// Yeni cevap oturumu başlat
router.post('/:id/responses', requireRole('student', 'teacher', 'admin'), ctrl.createResponse);

// Cevapları kaydet ve teslim et
router.post('/:id/submit', requireRole('student', 'teacher', 'admin'), ctrl.submitAnswers);

// Tüm cevapları getir (öğretmen)
router.get('/:id/responses', requireRole('teacher', 'admin'), ctrl.getResponses);

// ===== SURVEY ANALYSIS =====
// Cevap oranı
router.get('/:id/response-rate', requireRole('teacher', 'admin'), ctrl.getResponseRate);

// Detaylı analiz
router.get('/:id/analysis', requireRole('teacher', 'admin'), ctrl.analyzeResponses);

// Export (JSON/CSV)
router.get('/:id/export', requireRole('teacher', 'admin'), ctrl.exportResponses);

// ===== DEPRECATED (Backward Compatibility) =====
router.get('/:id/answers', requireRole('admin', 'teacher'), ctrl.getAnswers);

module.exports = router;
