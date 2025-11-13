// backend-express/routes/streakRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getStreak,
  updateStreak,
  buyStreakFreeze,
  getStreakHistory
} = require('../controllers/streakController');

// All routes require authentication
router.use(protect);

router.get('/', getStreak);
router.post('/update', updateStreak);
router.post('/buy-freeze', buyStreakFreeze);
router.get('/history', getStreakHistory);

module.exports = router;
