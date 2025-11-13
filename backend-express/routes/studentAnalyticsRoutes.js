// backend-express/routes/studentAnalyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOverview,
  getTopicPerformance,
  getDailyActivity,
  getWeeklyStats,
  getAttemptHistory,
  getPerformanceTrends,
  getStrongestWeakest,
  getComparison
} = require('../controllers/studentAnalyticsController');

// All routes require authentication
router.use(protect);

// GET /api/student-analytics/overview - Overview stats
router.get('/overview', getOverview);

// GET /api/student-analytics/topic-performance - Performance by topic
router.get('/topic-performance', getTopicPerformance);

// GET /api/student-analytics/daily-activity - Daily activity (last 30 days)
router.get('/daily-activity', getDailyActivity);

// GET /api/student-analytics/weekly-stats - Weekly stats (last 12 weeks)
router.get('/weekly-stats', getWeeklyStats);

// GET /api/student-analytics/attempt-history - Recent attempts
router.get('/attempt-history', getAttemptHistory);

// GET /api/student-analytics/performance-trends - Performance trends
router.get('/performance-trends', getPerformanceTrends);

// GET /api/student-analytics/strongest-weakest - Strongest and weakest topics
router.get('/strongest-weakest', getStrongestWeakest);

// GET /api/student-analytics/comparison - Compare with class average
router.get('/comparison', getComparison);

module.exports = router;
