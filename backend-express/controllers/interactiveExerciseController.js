// backend-express/controllers/interactiveExerciseController.js
const InteractiveExercise = require('../models/InteractiveExercise');
const Question = require('../models/Question'); // Soru havuzundan çek
const Hearts = require('../models/gamification/Hearts');
const Streak = require('../models/gamification/Streak');
const Progress = require('../models/gamification/Progress');
const Leaderboard = require('../models/Leaderboard');
const StudentAnalytics = require('../models/analytics/StudentAnalytics');
const { checkAchievements } = require('./achievementController');

// GET /api/interactive-exercises - List exercises (SORU HAVUZUNDAN)
exports.listExercises = async (req, res) => {
  try {
    const { topic, difficulty, classLevel, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    // Question model'indeki alanlarla eşleştir
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty; // Kolay, Orta, Zor
    if (classLevel) filter.classLevel = classLevel; // "5", "6", "7", "8"
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Soru havuzundan çek
    const questions = await Question.find(filter)
      .select('text topic difficulty classLevel questionType subject learningOutcome')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Question.countDocuments(filter);
    
    // Her soruyu exercise formatına dönüştür
    const exercises = questions.map(q => ({
      _id: q._id,
      title: q.text.substring(0, 60) + (q.text.length > 60 ? '...' : ''),
      description: `${q.subject} - ${q.learningOutcome}`,
      topic: q.topic,
      difficulty: q.difficulty.toLowerCase(), // "Kolay" -> "easy"
      gradeLevel: parseInt(q.classLevel) || 5,
      exerciseType: q.questionType === 'test' ? 'multiple-choice' : 
                    q.questionType === 'bosluk-doldurma' ? 'fill-in-blank' :
                    q.questionType === 'eslestirme' ? 'matching' : 'multiple-choice',
      xpReward: q.difficulty === 'Kolay' ? 10 : q.difficulty === 'Orta' ? 20 : 30
    }));
    
    res.json({
      exercises,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('List exercises error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/interactive-exercises/:id/start - Start an exercise (SORU HAVUZUNDAN)
exports.startExercise = async (req, res) => {
  try {
    const { practiceMode } = req.query; // Practice mode flag
    
    // Soru havuzundan soruyu çek
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı.' });
    }
    
    // Check hearts (skip in practice mode)
    if (practiceMode !== 'true') {
      const hearts = await Hearts.getOrCreate(req.user._id);
      const heartsRequired = 1; // Her soru için 1 can
      
      if (hearts.currentHearts < heartsRequired && !hearts.hasUnlimitedHearts()) {
        return res.status(403).json({
          message: 'Bu egzersiz için yeterli canınız yok.',
          currentHearts: hearts.currentHearts,
          timeUntilRefill: hearts.getTimeUntilNextRefill()
        });
      }
    }
    
    // Question'ı exercise formatına dönüştür
    const exerciseData = {
      id: question._id,
      title: question.text,
      description: `${question.subject} - ${question.learningOutcome}`,
      topic: question.topic,
      difficulty: question.difficulty.toLowerCase(),
      exerciseType: question.questionType === 'test' ? 'multiple-choice' : 
                    question.questionType === 'bosluk-doldurma' ? 'fill-in-blank' :
                    question.questionType === 'eslestirme' ? 'matching' : 'multiple-choice',
      passingScore: 70,
      xpReward: question.difficulty === 'Kolay' ? 10 : question.difficulty === 'Orta' ? 20 : 30,
      question: {
        text: question.text,
        options: question.options || [],
        questionType: question.questionType,
        hints: [] // Şimdilik hint yok
      }
    };
    
    res.json(exerciseData);
  } catch (err) {
    console.error('Start exercise error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/interactive-exercises/:id/submit - Submit exercise answer (SORU HAVUZU)
exports.submitExercise = async (req, res) => {
  try {
    const { answer, timeSpent, practiceMode } = req.body; // practiceMode flag
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı.' });
    }
    
    // Cevap kontrolü
    const isCorrect = answer === question.correctAnswer;
    let heartsLost = 0;
    
    // Yanlışsa can kaybı (skip in practice mode)
    const hearts = await Hearts.getOrCreate(req.user._id);
    if (!isCorrect && !hearts.hasUnlimitedHearts() && !practiceMode) {
      await hearts.loseHeart(question._id, answer);
      heartsLost = 1;
    }
    
    // XP hesaplama (no XP in practice mode)
    let xpEarned = 0;
    if (isCorrect && !practiceMode) {
      xpEarned = question.difficulty === 'Kolay' ? 10 : 
                 question.difficulty === 'Orta' ? 20 : 30;
      
      // Streak bonus
      const streak = await Streak.getOrCreate(req.user._id);
      const streakResult = await streak.updateStreak();
      xpEarned += streakResult.bonusXPEarned || 0;
    }
    
    // Progress kaydet (skip in practice mode)
    if (!practiceMode) {
      await Progress.create({
        userId: req.user._id,
        activity: isCorrect ? 'exercise_completed' : 'exercise_failed',
        xpEarned,
        details: {
          questionId: question._id,
          topic: question.topic,
          difficulty: question.difficulty,
          timeSpent,
          isCorrect,
          heartsLost
        }
      });
    }
    
    // Leaderboard'a puan ekle (skip in practice mode)
    if (isCorrect && xpEarned > 0 && !practiceMode) {
      try {
        await Leaderboard.findOneAndUpdate(
          { userId: req.user._id, scope: 'global' },
          { 
            $inc: { 
              totalXP: xpEarned,
              exercisesCompleted: 1
            },
            $set: { 
              userName: req.user.name || 'Anonim',
              lastActivity: new Date()
            }
          },
          { upsert: true, new: true }
        );
      } catch (leaderboardErr) {
        console.warn('Leaderboard update failed:', leaderboardErr);
        // Non-critical, continue
      }
    }
    
    // Check for newly unlocked achievements (skip in practice mode)
    let newAchievements = [];
    if (!practiceMode) {
      try {
        newAchievements = await checkAchievements(req.user._id);
      } catch (achievementErr) {
        console.warn('Achievement check failed:', achievementErr);
      }
    }
    
    // Record analytics (always record, including practice mode for tracking)
    try {
      const analytics = await StudentAnalytics.getOrCreate(req.user._id);
      await analytics.recordAttempt({
        exerciseId: question._id,
        topic: question.topic || 'Genel',
        level: question.difficulty || 'Orta',
        questionsCount: 1,
        correctCount: isCorrect ? 1 : 0,
        timeSpent: timeSpent || 30,
        xpEarned,
        isPracticeMode: practiceMode || false
      });
    } catch (analyticsErr) {
      console.warn('Analytics recording failed:', analyticsErr);
      // Non-critical, continue
    }
    
    // Sonuç döndür
    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      userAnswer: answer,
      xpEarned,
      heartsLost,
      currentHearts: hearts.currentHearts,
      explanation: question.solutionText || 'Açıklama mevcut değil.',
      feedback: isCorrect ? 
        '🎉 Tebrikler! Doğru cevap!' : 
        `😔 Yanlış cevap. Doğru cevap: ${question.correctAnswer}`,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
      practiceMode: practiceMode || false
    });
  } catch (err) {
    console.error('Submit exercise error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/interactive-exercises/:id/hint - Reveal a hint (Soru havuzunda hint yok)
exports.revealHint = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı.' });
    }
    
    // Şimdilik ipucu yok
    res.json({
      hint: question.solutionText || 'İpucu mevcut değil.',
      cost: 5
    });
  } catch (err) {
    console.error('Reveal hint error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/interactive-exercises/:id/explanation - Get question explanation
exports.getExplanation = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı.' });
    }
    
    res.json({
      explanation: question.solutionText || 'Açıklama mevcut değil.',
      correctAnswer: question.correctAnswer,
      topic: question.topic,
      learningOutcome: question.learningOutcome
    });
  } catch (err) {
    console.error('Get explanation error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/interactive-exercises/:id/complete - mark an exercise/question as completed for the user
exports.completeExercise = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Soru bulunamadı.' });

    const { isCorrect = true, xpEarned = 0, timeSpent = 0 } = req.body;

    await Progress.create({
      userId: req.user._id,
      activity: isCorrect ? 'exercise_completed' : 'exercise_failed',
      xpEarned,
      details: {
        questionId: question._id,
        difficulty: question.difficulty,
        topic: question.topic,
        timeSpent,
        isCorrect
      }
    });

    // compute simple unlocking rules after marking complete
    const completedCounts = await Progress.aggregate([
      { $match: { userId: req.user._id, activity: 'exercise_completed' } },
      { $group: { _id: '$details.difficulty', count: { $sum: 1 } } }
    ]);

    const counts = { Kolay: 0, Orta: 0, Zor: 0 };
    completedCounts.forEach(c => { if (c._id) counts[c._id] = c.count; });

    const unlocked = ['Kolay'];
    if (counts.Kolay >= 3) unlocked.push('Orta');
    if (counts.Orta >= 3) unlocked.push('Zor');

    res.json({ message: 'Tamamlandı kaydedildi.', counts, unlocked });
  } catch (err) {
    console.error('Complete exercise error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/interactive-exercises/multi/:topic - get a set of questions for multi-question exercise
exports.getMultiQuestionExercise = async (req, res) => {
  try {
    const { topic } = req.params;
    const { difficulty = 'Kolay', count = 5 } = req.query;
    
    const questions = await Question.find({ 
      topic, 
      difficulty 
    })
      .select('text options correctAnswer difficulty topic subject learningOutcome')
      .limit(parseInt(count));
    
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Bu konu ve seviyede soru bulunamadı.' });
    }
    
    const exerciseSet = {
      topic,
      difficulty,
      totalQuestions: questions.length,
      questions: questions.map((q, index) => ({
        id: q._id,
        number: index + 1,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        subject: q.subject,
        learningOutcome: q.learningOutcome
      }))
    };
    
    res.json(exerciseSet);
  } catch (err) {
    console.error('Get multi-question exercise error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/interactive-exercises/my-progress - get user's completed counts per difficulty
exports.getMyProgress = async (req, res) => {
  try {
    const completedCounts = await Progress.aggregate([
      { $match: { userId: req.user._id, activity: 'exercise_completed' } },
      { $group: { _id: '$details.difficulty', count: { $sum: 1 } } }
    ]);

    const counts = { Kolay: 0, Orta: 0, Zor: 0 };
    completedCounts.forEach(c => { if (c._id) counts[c._id] = c.count; });

    const unlocked = ['Kolay'];
    if (counts.Kolay >= 3) unlocked.push('Orta');
    if (counts.Orta >= 3) unlocked.push('Zor');

    res.json({ counts, unlocked });
  } catch (err) {
    console.error('Get my progress error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
