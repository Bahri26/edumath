const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const branchApproved = require('../middlewares/branchApprovalMiddleware');

// TÜM ROUTE'LER KORUMANLI VE SADECE ÖĞRETMEN İÇİN

// 📊 İSTATİSTİKLER
router.get('/stats', protect, role(['teacher']), teacherController.getTeacherStats);

// 📈 RAPORLAR
router.get('/reports', protect, role(['teacher']), teacherController.getClassReports);

// ❓ SORULAR (ÖĞRETMENIN KENDİ SORULARI)
router.get('/questions', protect, role(['teacher']), teacherController.getMyQuestions);
// Branşa göre tüm soru bankası (onaylı branş gerekli)
router.get('/subject/questions', protect, role(['teacher']), branchApproved, teacherController.getSubjectQuestions);
// Branşa göre konu listesi
router.get('/subject/topics', protect, role(['teacher']), branchApproved, teacherController.getSubjectTopics);

// 📝 ANKETLER
router.get('/surveys', protect, role(['teacher']), teacherController.getMySurveys);

// 👥 SINIF ÖĞRENCİLERİ
router.get('/students', protect, role(['teacher']), teacherController.getClassStudents);

// 👤 ÖĞRENCİ DETAYLARI
router.get('/students/:studentId', protect, role(['teacher']), teacherController.getStudentDetails);

// 📋 DASHBOARD ÖZET
router.get('/dashboard-summary', protect, role(['teacher']), teacherController.getDashboardSummary);

// 🧪 ÖĞRETMENİN KENDİ SINAVLARI
router.get('/my-exams', protect, role(['teacher']), teacherController.getMyExams);
// Branşa göre sınavlar (onaylı branş gerekli)
router.get('/subject/exams', protect, role(['teacher']), branchApproved, teacherController.getSubjectExams);

// Branş talebi oluştur
router.post('/branch-request', protect, role(['teacher']), teacherController.requestBranchApproval);

module.exports = router;
