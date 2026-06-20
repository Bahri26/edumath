const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Topic = require('../models/Topic');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { recordUserActivity } = require('../services/activityLogger');

router.patch('/:id', auth, role(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, order } = req.body;
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Ders bulunamadı' });
    if (title != null) lesson.title = String(title).trim();
    if (order != null && Number.isFinite(Number(order))) lesson.order = Number(order);
    await lesson.save();
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: 'Ders güncellenemedi', error: err.message });
  }
});

router.delete('/:id', auth, role(['teacher', 'admin']), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Ders bulunamadı' });
    await UserProgress.deleteMany({ lessonId: lesson._id });
    await Topic.updateOne({ _id: lesson.topic }, { $pull: { lessons: lesson._id } });
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Ders silinemedi', error: err.message });
  }
});

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
  let correct = 0;
  let wrong = 0;
  const review = lesson.quiz.map((q, i) => {
    const userAnswer = answers[i];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) correct += 1;
    else wrong += 1;
    return {
      question: q.question,
      userAnswer: userAnswer || '',
      correctAnswer: q.correctAnswer,
      isCorrect,
      solution: q.solution || '',
    };
  });
  await UserProgress.findOneAndUpdate(
    { userId: req.user.id, lessonId: lesson._id },
    { completed: true, xp: correct * 10, lastAttempt: new Date(), correctCount: correct, wrongCount: wrong },
    { upsert: true }
  );

  const student = await User.findById(req.user.id).select('name email role').lean();
  await recordUserActivity(req, {
    user: student,
    action: 'lesson_quiz_submit',
    category: 'learning',
    summary: `Ders quiz'i tamamladı: ${lesson.title}`,
    targetType: 'lesson',
    targetId: lesson._id,
    targetLabel: lesson.title,
    metadata: { correct, wrong, xp: correct * 10 },
  });

  res.json({ correct, wrong, xp: correct * 10, review });
});

module.exports = router;
