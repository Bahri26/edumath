// backend-express/routes/classRoutes.js

const express = require('express');
const router = express.Router();
const {
    createClass,
    getClassesByGrade,
    deleteClass,
    joinClass,
    getClassStudentsWithStats,
    getClassesCount
} = require('../controllers/classController');
const { protect, teacherCheck, studentCheck } = require('../middleware/authMiddleware');

router.route('/count')
    .get(protect, teacherCheck, getClassesCount); // YENİ: Sınıf sayısını getiren route

router.route('/')
    .post(protect, teacherCheck, createClass) // Öğretmen sınıf oluşturur
    .get(protect, teacherCheck, getClassesByGrade); // Öğretmen sınıflarını listeler

router.route('/join')
    .post(protect, studentCheck, joinClass); // Öğrenci sınıfa katılır

router.route('/:id')
    .delete(protect, teacherCheck, deleteClass); // Öğretmen sınıfı siler

router.route('/:id/students')
    .get(protect, teacherCheck, getClassStudentsWithStats); // Öğretmen, sınıfındaki öğrencileri listeler

module.exports = router;