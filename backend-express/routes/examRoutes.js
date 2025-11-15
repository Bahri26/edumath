// backend-express/routes/examRoutes.js (Düzeltilecek Satır)

const express = require('express');

const { 
  createExam, 
  getExams, 
  getExamById, 
  startExam, 
  updateQuestionsForExam,
  deleteExam,
  updateExam
} = require('../controllers/examController'); 
const { protect, studentCheck } = require('../middleware/authMiddleware'); 

const router = express.Router();

// List exams (public filter) BUT when authenticated and is teacher, scope to creator unless query.all=true
router.route('/')
    .get(protect, getExams)
    .post(protect, createExam); 

router.route('/:id')
    .get(protect, getExamById)
    .put(protect, updateExam)
    .delete(protect, deleteExam);

// Öğrencinin sınavı başlattığı endpoint
router.route('/:id/start').get(protect, studentCheck, startExam);

// Sınava soru atama endpoint'i
router.route('/:examId/questions')
    .put(protect, updateQuestionsForExam);

module.exports = router;