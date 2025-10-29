// backend-express/routes/questionRoutes.js (TAMAMLANMIŞ HALİ)

const express = require('express');
const router = express.Router();

// Middleware'lerimizi import edelim
const { protect, checkRole } = require('../middleware/authMiddleware');

// --- GÜNCELLENEN İMPORTLAR ---
// Controller fonksiyonlarımızı import edelim
const { 
  createQuestion, 
  getMyQuestions,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');

// --- Soru Havuzu (Question Pool) API Rotaları ---

// Rota: /api/questions/
router.route('/')
  // Öğretmenin sorularını listele
  .get(protect, checkRole('teacher'), getMyQuestions) 
  // Öğretmenin yeni soru oluşturması
  .post(protect, checkRole('teacher'), createQuestion);

// --- YENİ EKLENEN ROTALAR ---
// Rota: /api/questions/:id
router.route('/:id')
  // Bir soruyu güncelle
  .put(protect, checkRole('teacher'), updateQuestion)
  // Bir soruyu sil
  .delete(protect, checkRole('teacher'), deleteQuestion);

module.exports = router;