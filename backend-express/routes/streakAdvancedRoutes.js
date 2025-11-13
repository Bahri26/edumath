// backend-express/routes/streakAdvancedRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getStreakHistory,
  getStreakCalendar,
  buyStreakFreeze,
  getStreakLeaderboard,
  getStreakMilestones
} = require('../controllers/streakAdvancedController');

// All routes require authentication
router.use(protect);

// GET /api/streak-advanced/history - Get streak history with stats
router.get('/history', getStreakHistory);

// GET /api/streak-advanced/calendar - Get calendar view (365 days)
router.get('/calendar', getStreakCalendar);

// POST /api/streak-advanced/freeze/buy - Buy a streak freeze
router.post('/freeze/buy', buyStreakFreeze);

// GET /api/streak-advanced/leaderboard - Streak leaderboard
router.get('/leaderboard', getStreakLeaderboard);

// GET /api/streak-advanced/milestones - Streak milestones
router.get('/milestones', getStreakMilestones);

module.exports = router;
