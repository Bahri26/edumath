const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

// 📝 ÖĞRETMEN: ÖDEV OLUŞTUR
router.post('/', protect, role(['teacher']), assignmentController.createAssignment);

// 📝 ÖĞRETMEN: KENDİ ÖDEVLERİNİ GETIR
router.get('/teacher/my-assignments', protect, role(['teacher']), assignmentController.getTeacherAssignments);

// 📝 ÖĞRENCİ: ÖDEVLERİNİ GETIR
router.get('/student/my-assignments', protect, role(['student']), assignmentController.getStudentAssignments);

// 📝 ÖDEV DETAYLARı
router.get('/:assignmentId', protect, assignmentController.getAssignmentDetails);

// 📝 ÖĞRENCİ: ÖDEV GÖNDERİ
router.post('/:assignmentId/submit', protect, role(['student']), assignmentController.submitAssignment);

// 📝 ÖĞRETMEN: NOT VER
router.put('/:assignmentId/grade/:studentId', protect, role(['teacher']), assignmentController.gradeAssignment);

// 📝 ÖĞRETMEN: ÖDEV GÜNCELLE
router.put('/:assignmentId', protect, role(['teacher']), assignmentController.updateAssignment);

// 📝 ÖĞRETMEN: ÖDEV SİL
router.delete('/:assignmentId', protect, role(['teacher']), assignmentController.deleteAssignment);

module.exports = router;
