// backend-express/controllers/streakController.js
const Streak = require('../models/gamification/Streak');
const Progress = require('../models/gamification/Progress');

// GET /api/streak - Get user's streak info
exports.getStreak = async (req, res) => {
  try {
    const streak = await Streak.getOrCreate(req.user._id);
    
    res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      streakFreezes: streak.streakFreezes,
      totalDaysActive: streak.totalDaysActive,
      streakBonusXP: streak.streakBonusXP,
      freezeUsedToday: streak.freezeUsedToday
    });
  } catch (err) {
    console.error('Get streak error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/streak/update - Update streak (called when user completes activity)
exports.updateStreak = async (req, res) => {
  try {
    const streak = await Streak.getOrCreate(req.user._id);
    const result = await streak.updateStreak();
    
    // Log activity in Progress
    if (result.bonusXPEarned > 0) {
      await Progress.create({
        userId: req.user._id,
        activity: 'streak_maintained',
        xpEarned: result.bonusXPEarned,
        details: {
          streakDays: result.currentStreak
        }
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Update streak error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/streak/buy-freeze - Buy a streak freeze (costs gems)
exports.buyStreakFreeze = async (req, res) => {
  try {
    const { gemsCost = 50 } = req.body;
    
    // TODO: Check if user has enough gems (implement gem system)
    const streak = await Streak.getOrCreate(req.user._id);
    await streak.buyStreakFreeze();
    
    res.json({
      message: 'Streak freeze satın alındı!',
      streakFreezes: streak.streakFreezes
    });
  } catch (err) {
    console.error('Buy streak freeze error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/streak/history - Get streak history
exports.getStreakHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const streak = await Streak.findOne({ userId: req.user._id });
    
    if (!streak) {
      return res.json({ history: [] });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const history = streak.streakHistory
      .filter(h => h.date >= startDate)
      .sort((a, b) => b.date - a.date)
      .slice(0, parseInt(days));
    
    res.json({ history });
  } catch (err) {
    console.error('Get streak history error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
