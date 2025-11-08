// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getStudentAnalytics,
  getLearningPath,
  updateAnalytics
} = require('../controllers/analyticsController');

router.get('/student', protect, getStudentAnalytics);
router.get('/learning-path', protect, getLearningPath);
router.post('/update', protect, updateAnalytics);

module.exports = router;