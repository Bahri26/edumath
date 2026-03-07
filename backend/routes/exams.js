const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examsController');
const requireRole = require('../middleware/requireRole');

// ===== EXAM CRUD =====
router.get('/', requireRole('admin', 'teacher'), ctrl.list);
router.post('/', requireRole('admin', 'teacher'), ctrl.create);
router.post('/auto-create', requireRole('teacher', 'admin'), ctrl.autoCreate);
router.get('/student-list', requireRole('student', 'teacher', 'admin'), ctrl.studentList);
router.get('/level-thresholds', requireRole('teacher', 'admin'), ctrl.getLevelThresholds);
router.put('/level-thresholds', requireRole('teacher', 'admin'), ctrl.updateLevelThresholds);

// ===== EXAM ACTIONS =====
router.post('/:id/publish', requireRole('teacher', 'admin'), ctrl.publish);
router.post('/:id/archive', requireRole('teacher', 'admin'), ctrl.archive);

// ===== EXAM DETAILS & MANAGEMENT =====
router.get('/:id', requireRole('admin', 'teacher', 'student'), ctrl.getOne);
router.put('/:id', requireRole('admin', 'teacher'), ctrl.update);
router.delete('/:id', requireRole('admin', 'teacher'), ctrl.remove);

// ===== EXAM QUESTIONS =====
router.get('/:id/questions', requireRole('student', 'teacher', 'admin'), ctrl.listQuestions);
router.post('/:id/questions', requireRole('teacher', 'admin'), ctrl.createQuestionForExam);
router.post('/:id/questions/:questionId', requireRole('teacher', 'admin'), ctrl.linkQuestion);
router.post('/:id/questions/reorder', requireRole('teacher', 'admin'), ctrl.reorderQuestions);
router.delete('/:id/questions/:questionId', requireRole('teacher', 'admin'), ctrl.removeQuestionFromExam);

// ===== EXAM STATISTICS =====
router.get('/:id/statistics', requireRole('teacher', 'admin'), ctrl.getStatistics);

// ===== EXAM ATTEMPTS (Student) =====
// Deneme başlat
router.post('/:id/attempts', requireRole('student'), ctrl.startAttempt);

// Deneme bilgilerini getir (soru ve cevaplar)
router.get('/attempts/:attemptId', requireRole('student', 'teacher', 'admin'), ctrl.getAttempt);

// Deneme sırasında cevap kaydet
router.post('/attempts/:attemptId/answer', requireRole('student'), ctrl.recordAnswer);

// Denemeyi teslim et
router.post('/attempts/:attemptId/submit', requireRole('student'), ctrl.submitAttempt);

// Öğretmen puanlaması
router.post('/attempts/:attemptId/grade', requireRole('teacher', 'admin'), ctrl.gradeAttempt);

// Öğrencinin bir sınavda yaptığı denemeler
router.get('/:id/student-attempts', requireRole('student', 'teacher', 'admin'), ctrl.getStudentAttempts);

module.exports = router;
