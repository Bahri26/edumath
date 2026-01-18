const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const progressController = require('../controllers/progressController');

// Get current user's progress
router.get('/me', protect, progressController.getMyProgress);

// Add XP (students)
router.post('/add', protect, role(['student']), progressController.addXP);

// Leaderboard
router.get('/leaderboard', protect, progressController.getLeaderboard);

// Skills overview for current user
router.get('/skills', protect, progressController.getSkills);

// XP trends for last N days
router.get('/trends', protect, progressController.getTrends);

// Log general learning events (hint, error, session etc.)
router.post('/event', protect, role(['student']), progressController.logEvent);

module.exports = router;
