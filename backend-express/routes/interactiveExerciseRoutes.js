// backend-express/routes/interactiveExerciseRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  listExercises,
  startExercise,
  submitExercise,
  completeExercise,
  getMyProgress,
  getMultiQuestionExercise,
  revealHint,
  getExplanation
} = require('../controllers/interactiveExerciseController');

// All routes require authentication
router.use(protect);

router.get('/', listExercises);
router.get('/multi/:topic', getMultiQuestionExercise);
router.get('/my-progress', getMyProgress);
router.get('/:id/start', startExercise);
router.post('/:id/submit', submitExercise);
router.post('/:id/complete', completeExercise);
router.post('/:id/hint', revealHint);
router.get('/:id/explanation', getExplanation);

module.exports = router;
