const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
const multer = require('multer');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

// --- MULTER AYARLARI (Dosya Yükleme) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});


// --- ROUTE TANIMLARI ---

// 1. Listeleme (Tüm giriş yapmış kullanıcılar)
router.get('/', protect, questionController.getQuestions);

// 1.5. Öğretmen sorularını getir (Öğretmen için özel endpoint)
router.get('/teacher/my-questions', protect, role(['teacher', 'admin']), questionController.getTeacherQuestions);

// 2. AI Toplu Ekleme (Sadece öğretmen/admin)
router.post('/batch', protect, role(['teacher', 'admin']), questionController.batchCreateQuestions);

// 3. Manuel Yeni Ekleme (Sadece öğretmen/admin)
router.post('/', protect, role(['teacher', 'admin']), upload.any(), questionController.createQuestion);

// 4. Güncelleme (Sadece öğretmen/admin)
router.put('/:id', protect, role(['teacher', 'admin']), upload.any(), questionController.updateQuestion);

// 5. Silme (Sadece öğretmen/admin)
router.delete('/:id', protect, role(['teacher', 'admin']), questionController.deleteQuestion);

module.exports = router;