// backend-express/routes/dailyChallengeRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllTemplates,
  createTemplate,
  getMyChallenges,
  updateChallengeProgress,
  claimRewards,
  refreshDailyChallenges,
  getCompletedChallenges,
  getChallengeStats,
  cleanupExpiredChallenges
} = require('../controllers/dailyChallengeController');

// Admin (şimdilik protect ile korunuyor)
router.get('/templates', protect, getAllTemplates);
router.post('/templates', protect, createTemplate);
router.post('/cleanup-expired', protect, cleanupExpiredChallenges);

// Student
router.get('/my-challenges', protect, getMyChallenges);
router.put('/:challengeId/progress', protect, updateChallengeProgress);
router.post('/:challengeId/claim-rewards', protect, claimRewards);
router.post('/refresh-daily', protect, refreshDailyChallenges);
router.get('/completed', protect, getCompletedChallenges);
router.get('/stats', protect, getChallengeStats);

module.exports = router;