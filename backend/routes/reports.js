const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const requireRole = require('../middleware/requireRole');

router.get('/class-stats', requireRole('teacher', 'admin'), ctrl.classStats);
router.get('/student-detailed/:id', requireRole('teacher', 'admin'), ctrl.studentDetailed);

// AI destekli ogrenci analiz olusturma
router.post('/student-ai-analysis', requireRole('teacher', 'admin'), ctrl.generateAIAnalysis);

// Ogretmenin ogrenci seviye/degerlendirme CRUD islemleri
router.get('/student-assessments', requireRole('teacher', 'admin'), ctrl.listAssessments);
router.get('/student-assessments-export', requireRole('teacher', 'admin'), ctrl.exportAssessments);
router.get('/student-assessments/:id', requireRole('teacher', 'admin'), ctrl.getAssessment);
router.post('/student-assessments', requireRole('teacher', 'admin'), ctrl.upsertAssessment);
router.put('/student-assessments/:id', requireRole('teacher', 'admin'), ctrl.updateAssessment);
router.delete('/student-assessments/:id', requireRole('teacher', 'admin'), ctrl.removeAssessment);

module.exports = router;
