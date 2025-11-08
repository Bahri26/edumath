// backend-express/routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getClassLeaderboard,
  getGradeLeaderboard,
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getMyRank,
  updateLeaderboard,
  getTopUsers,
  getMyAllPositions
} = require('../controllers/leaderboardController');

// General
router.get('/class/:classId', protect, getClassLeaderboard);
router.get('/grade/:gradeLevel', protect, getGradeLeaderboard);
router.get('/global', protect, getGlobalLeaderboard);
router.get('/weekly', protect, getWeeklyLeaderboard);
router.get('/monthly', protect, getMonthlyLeaderboard);

// User specific
router.get('/:type/:id/my-rank', protect, getMyRank);
router.get('/my-positions', protect, getMyAllPositions);

// Admin/manual
router.post('/:type/:id/update', protect, updateLeaderboard);
router.get('/:type/:id/top/:count', protect, getTopUsers);

module.exports = router;