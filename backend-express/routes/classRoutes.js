// backend-express/routes/classRoutes.js

const express = require('express');
const router = express.Router();
const {
    createClass,
    getClassesByGrade,
    deleteClass,
    updateClass,
    joinClass,
    getClassStudentsWithStats,
    removeStudentFromClass,
    getClassesCount,
    getClassesSummary
} = require('../controllers/classController');
const { protect, teacherCheck, studentCheck } = require('../middleware/authMiddleware');

router.route('/count')
    .get(protect, teacherCheck, getClassesCount); // YENİ: Sınıf sayısını getiren route

router.route('/summary')
    .get(protect, teacherCheck, getClassesSummary); // YENİ: Seviye bazlı özet

router.route('/')
    .post(protect, teacherCheck, createClass) // Öğretmen sınıf oluşturur
    .get(protect, teacherCheck, getClassesByGrade); // Öğretmen sınıflarını listeler

router.route('/join')
    .post(protect, studentCheck, joinClass); // Öğrenci sınıfa katılır

router.route('/:id')
    .delete(protect, teacherCheck, deleteClass) // Öğretmen sınıfı siler
    .put(protect, teacherCheck, updateClass); // Öğretmen sınıfı günceller

router.route('/:id/students')
    .get(protect, teacherCheck, getClassStudentsWithStats); // Öğretmen, sınıfındaki öğrencileri listeler

router.route('/:classId/students/:studentId')
    .delete(protect, teacherCheck, removeStudentFromClass); // Öğretmen, öğrenciyi sınıftan çıkarır

module.exports = router;