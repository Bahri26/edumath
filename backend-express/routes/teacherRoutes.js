// backend-express/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { protect, teacherCheck } = require('../middleware/authMiddleware');
const { getMyStudents, seedDemoData, removeStudentFromClass, getDashboardStats } = require('../controllers/teacherController');

// Get dashboard statistics
router.get('/dashboard-stats', protect, teacherCheck, getDashboardStats);

// List all students in classes created by the logged-in teacher
router.get('/students', protect, teacherCheck, getMyStudents);

// Seed demo data for testing (only for development)
router.post('/seed-demo-data', protect, teacherCheck, seedDemoData);

// Remove student from a class
router.post('/students/remove', protect, teacherCheck, removeStudentFromClass);

module.exports = router;
