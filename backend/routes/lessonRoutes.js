const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const auth = require('../middlewares/authMiddleware');

// Get lesson detail
router.get('/:id', async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
  res.json(lesson);
});

// Submit quiz answers and update progress
router.post('/:id/submit', auth, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
  const { answers } = req.body;
  let correct = 0, wrong = 0;
  lesson.quiz.forEach((q, i) => {
    if (answers[i] === q.correctAnswer) correct++;
    else wrong++;
  });
  await UserProgress.findOneAndUpdate(
    { userId: req.user.id, lessonId: lesson._id },
    { completed: true, xp: correct * 10, lastAttempt: new Date(), correctCount: correct, wrongCount: wrong },
    { upsert: true }
  );
  res.json({ correct, wrong, xp: correct * 10 });
});

module.exports = router;
