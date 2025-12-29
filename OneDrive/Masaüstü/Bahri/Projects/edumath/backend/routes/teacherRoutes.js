
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const upload = require('../middleware/upload'); // Multer config dosyanız

// Öğretmenin oluşturduğu sınavları listele
router.get('/my-exams', protect, role(['teacher']), teacherController.getMyExams);

// TÜM ROUTE'LER KORUMANLI VE SADECE ÖĞRETMEN İÇİN

// 📊 İSTATİSTİKLER
router.get('/stats', protect, role(['teacher']), teacherController.getTeacherStats);

// 📈 RAPORLAR
router.get('/reports', protect, role(['teacher']), teacherController.getClassReports);

// ❓ SORULAR (ÖĞRETMENIN KENDİ SORULARI)
router.get('/questions', protect, role(['teacher']), teacherController.getMyQuestions);

// 📝 ANKETLER
router.get('/surveys', protect, role(['teacher']), teacherController.getMySurveys);

// 👥 SINIF ÖĞRENCİLERİ
router.get('/students', protect, role(['teacher']), teacherController.getClassStudents);

// 👤 ÖĞRENCİ DETAYLARI
router.get('/students/:studentId', protect, role(['teacher']), teacherController.getStudentDetails);

// 📋 DASHBOARD ÖZET
router.get('/dashboard-summary', protect, role(['teacher']), teacherController.getDashboardSummary);
router.post('/questions/image-to-text', protect, role(['teacher']), upload.single('image'), teacherController.convertImageToQuestion);
module.exports = router;
