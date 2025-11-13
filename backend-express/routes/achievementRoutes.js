// backend-express/routes/achievementRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  initializeAchievements,
  getAllAchievements,
  getUserAchievements,
  claimRewards
} = require('../controllers/achievementController');

router.use(protect);

router.post('/initialize', initializeAchievements); // Admin only (should add role check)
router.get('/all', getAllAchievements);
router.get('/my', getUserAchievements);
router.post('/:achievementId/claim', claimRewards);

module.exports = router;
