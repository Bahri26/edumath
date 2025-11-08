// routes/gamificationRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  // hearts
  useHeart,
  refillHearts,
  buyHearts,
  // streak & xp
  updateStreak,
  addXP,
  // achievements
  getAchievements,
  getNewAchievements,
  claimAchievementRewards,
  // progress & stats
  getRecentActivity,
  getDailySummary,
  getWeeklyXP,
  getDailyGoal,
  getDashboard
} = require('../controllers/gamificationController');

// Hearts
router.post('/use-heart', protect, useHeart);
router.post('/refill-hearts', protect, refillHearts);
router.post('/buy-hearts', protect, buyHearts);

// Streak & XP
router.post('/update-streak', protect, updateStreak);
router.post('/add-xp', protect, addXP);

// Achievements
router.get('/achievements', protect, getAchievements);
router.get('/achievements/new', protect, getNewAchievements);
router.post('/achievements/:achievementId/claim', protect, claimAchievementRewards);

// Progress & Stats
router.get('/recent-activity', protect, getRecentActivity);
router.get('/daily-summary', protect, getDailySummary);
router.get('/weekly-xp', protect, getWeeklyXP);
router.get('/daily-goal', protect, getDailyGoal);
router.get('/dashboard', protect, getDashboard);

module.exports = router;