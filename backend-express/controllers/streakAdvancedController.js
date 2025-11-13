// backend-express/controllers/streakAdvancedController.js
const Streak = require('../models/gamification/Streak');

// GET /api/streak/history - Get streak history with charts data
exports.getStreakHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const streak = await Streak.findOne({ userId: req.user._id });
    
    if (!streak) {
      return res.json({ history: [], stats: {} });
    }
    
    // Get last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const recentHistory = streak.streakHistory.filter(h => 
      new Date(h.date) >= cutoffDate
    ).map(h => ({
      date: h.date,
      maintained: h.maintained,
      xpEarned: h.xpEarned,
      freezeUsed: h.freezeUsed,
      dayOfWeek: new Date(h.date).getDay()
    }));
    
    // Calculate stats
    const totalDays = recentHistory.length;
    const daysActive = recentHistory.filter(h => h.maintained).length;
    const freezesUsed = recentHistory.filter(h => h.freezeUsed).length;
    const totalXP = recentHistory.reduce((sum, h) => sum + (h.xpEarned || 0), 0);
    
    // Day of week analysis
    const dayOfWeekStats = [0, 1, 2, 3, 4, 5, 6].map(day => {
      const dayData = recentHistory.filter(h => h.dayOfWeek === day);
      return {
        day: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][day],
        total: dayData.length,
        active: dayData.filter(h => h.maintained).length,
        percentage: dayData.length > 0 ? (dayData.filter(h => h.maintained).length / dayData.length * 100).toFixed(1) : 0
      };
    });
    
    res.json({
      history: recentHistory,
      stats: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalDaysActive: streak.totalDaysActive,
        streakFreezes: streak.streakFreezes,
        recentStats: {
          totalDays,
          daysActive,
          freezesUsed,
          totalXP,
          successRate: totalDays > 0 ? ((daysActive / totalDays) * 100).toFixed(1) : 0
        },
        dayOfWeekStats
      }
    });
  } catch (err) {
    console.error('Get streak history error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/streak/calendar - Get calendar view (last 365 days)
exports.getStreakCalendar = async (req, res) => {
  try {
    const streak = await Streak.findOne({ userId: req.user._id });
    
    if (!streak) {
      return res.json({ calendar: [] });
    }
    
    // Last 365 days
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    const calendar = [];
    const historyMap = {};
    
    // Create map of history
    streak.streakHistory.forEach(h => {
      const dateStr = new Date(h.date).toISOString().split('T')[0];
      historyMap[dateStr] = {
        maintained: h.maintained,
        xpEarned: h.xpEarned,
        freezeUsed: h.freezeUsed
      };
    });
    
    // Generate calendar data
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split('T')[0];
      const data = historyMap[dateStr];
      
      calendar.push({
        date: dateStr,
        maintained: data ? data.maintained : false,
        xpEarned: data ? data.xpEarned : 0,
        freezeUsed: data ? data.freezeUsed : false,
        level: data ? (data.maintained ? (data.xpEarned > 0 ? 3 : 2) : 0) : 0
        // level: 0=none, 1=broken, 2=maintained, 3=bonus
      });
    }
    
    res.json({ calendar });
  } catch (err) {
    console.error('Get streak calendar error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/streak/freeze/buy - Buy a streak freeze
exports.buyStreakFreeze = async (req, res) => {
  try {
    const { cost = 100 } = req.body; // 100 XP cost (or gems, coins, etc.)
    
    const streak = await Streak.getOrCreate(req.user._id);
    
    // TODO: Deduct currency from user (XP, gems, coins)
    // For now, just add freeze
    
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

// GET /api/streak/leaderboard - Streak leaderboard
exports.getStreakLeaderboard = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const topStreaks = await Streak.find()
      .sort({ currentStreak: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .select('userId currentStreak longestStreak totalDaysActive');
    
    const leaderboard = topStreaks.map((s, index) => ({
      rank: index + 1,
      userId: s.userId._id,
      userName: s.userId.name || 'Anonim',
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      totalDaysActive: s.totalDaysActive
    }));
    
    // Find current user's rank
    const userStreak = await Streak.findOne({ userId: req.user._id });
    let userRank = null;
    
    if (userStreak) {
      const higherStreaks = await Streak.countDocuments({ 
        currentStreak: { $gt: userStreak.currentStreak } 
      });
      userRank = higherStreaks + 1;
    }
    
    res.json({
      leaderboard,
      userRank,
      userStreak: userStreak ? {
        currentStreak: userStreak.currentStreak,
        longestStreak: userStreak.longestStreak
      } : null
    });
  } catch (err) {
    console.error('Get streak leaderboard error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/streak/milestones - Get streak milestones
exports.getStreakMilestones = async (req, res) => {
  try {
    const streak = await Streak.findOne({ userId: req.user._id });
    
    const milestones = [
      { days: 3, title: '3 Günlük Seri', reward: '30 XP', icon: '🔥' },
      { days: 7, title: 'Haftalık Seri', reward: '50 XP', icon: '🔥🔥' },
      { days: 14, title: '2 Haftalık Seri', reward: '100 XP', icon: '🔥🔥' },
      { days: 30, title: 'Aylık Seri', reward: '200 XP', icon: '🔥🔥🔥' },
      { days: 50, title: '50 Günlük Seri', reward: '300 XP', icon: '🔥🔥🔥' },
      { days: 100, title: 'Yüzlük Seri!', reward: '1000 XP', icon: '🔥🔥🔥🔥' },
      { days: 365, title: 'Yıllık Efsane!', reward: '5000 XP', icon: '👑' }
    ];
    
    const currentStreak = streak ? streak.currentStreak : 0;
    const longestStreak = streak ? streak.longestStreak : 0;
    
    const milestonesWithProgress = milestones.map(m => ({
      ...m,
      achieved: currentStreak >= m.days,
      achievedBefore: longestStreak >= m.days,
      progress: Math.min((currentStreak / m.days) * 100, 100),
      remaining: Math.max(m.days - currentStreak, 0)
    }));
    
    res.json({ milestones: milestonesWithProgress, currentStreak, longestStreak });
  } catch (err) {
    console.error('Get streak milestones error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
