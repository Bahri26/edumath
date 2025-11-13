// backend-express/routes/adaptiveDifficultyRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getRecommendation,
  getAdaptiveQuestions,
  getLearningPath,
  adjustDifficultyPreference
} = require('../controllers/adaptiveDifficultyController');

// All routes require authentication
router.use(protect);

// GET /api/adaptive-difficulty/recommend - Get difficulty recommendation
router.get('/recommend', getRecommendation);

// GET /api/adaptive-difficulty/next-questions - Get adaptive questions
router.get('/next-questions', getAdaptiveQuestions);

// GET /api/adaptive-difficulty/learning-path - Get personalized learning path
router.get('/learning-path', getLearningPath);

// POST /api/adaptive-difficulty/adjust - Adjust difficulty preference
router.post('/adjust', adjustDifficultyPreference);

module.exports = router;
