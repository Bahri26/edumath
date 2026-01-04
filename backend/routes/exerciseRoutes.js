const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

// ============================================
// SPESIFIK ROTALARI ÖNCE TANIMLAYALIM
// ============================================

// ✅ 1. ÖĞRETMENIN EGZERSIZLERINI LISTELE (Spesifik pattern)
router.get('/teacher/my-exercises', protect, role(['teacher', 'admin']), exerciseController.getTeacherExercises);

// ✅ 2. ÖĞRENCİ SINIFININA AIT EGZERSIZLER (Spesifik pattern)
router.get('/student/my-exercises', protect, role(['student']), exerciseController.getStudentExercises);

// ============================================
// GENEL ROTALARI SONRA TANIMLAYALIM
// ============================================

// ✅ 3. EGZERSIZ OLUŞTUR (AI)
router.post('/', protect, role(['teacher', 'admin']), exerciseController.createExercise);

// ✅ 4. EGZERSIZ DETAYI (Herkes)
router.get('/:id', protect, exerciseController.getExerciseById);

// ✅ 5. EGZERSIZ GÜNCELLE
router.put('/:id', protect, role(['teacher', 'admin']), exerciseController.updateExercise);

// ✅ 6. EGZERSIZ SİL
router.delete('/:id', protect, role(['teacher', 'admin']), exerciseController.deleteExercise);

// ✅ 7. EGZERSIZ CEVAPLARINI GÖNDER (Öğrenci)
router.post('/:id/submit', protect, role(['student']), exerciseController.submitExercise);

module.exports = router;
