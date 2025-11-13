// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, teacherCheck } = require('../middleware/authMiddleware');
const {
  getStudentAnalytics,
  getLearningPath,
  updateAnalytics,
  getTeacherSummary
} = require('../controllers/analyticsController');

router.get('/student', protect, getStudentAnalytics);
router.get('/learning-path', protect, getLearningPath);
router.get('/teacher/summary', protect, teacherCheck, getTeacherSummary);
router.post('/update', protect, updateAnalytics);

module.exports = router;