const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/teachersController');
const requireRole = require('../middleware/requireRole');

// teacher and admin can access
router.get('/:id/exams', requireRole('admin', 'teacher'), ctrl.getExamsByTeacher);
router.get('/:id/students', requireRole('admin', 'teacher'), ctrl.getStudentsByTeacher);
router.get('/:id/students/:studentId/exams', requireRole('admin', 'teacher'), ctrl.getStudentExamAttempts);
router.get('/:id/dashboard', requireRole('admin', 'teacher'), ctrl.getDashboard);

module.exports = router;
