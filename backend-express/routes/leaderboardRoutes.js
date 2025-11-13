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

// ÖNEMLI: Spesifik route'lar parametreli route'lardan ÖNCE gelmeli
// Spesifik route'lar önce
router.get('/global', protect, getGlobalLeaderboard);
router.get('/weekly', protect, getWeeklyLeaderboard);
router.get('/monthly', protect, getMonthlyLeaderboard);
router.get('/my-positions', protect, getMyAllPositions);

// Root route (query params kabul eder: ?period=week&limit=5)
router.get('/', protect, getWeeklyLeaderboard); // Default: haftalık liderlik tablosu

// Parametreli route'lar en sona
router.get('/class/:classId', protect, getClassLeaderboard);
router.get('/grade/:gradeLevel', protect, getGradeLeaderboard);
router.get('/:type/:id/my-rank', protect, getMyRank);
router.get('/:type/:id/top/:count', protect, getTopUsers);

// Admin/manual
router.post('/:type/:id/update', protect, updateLeaderboard);

module.exports = router;