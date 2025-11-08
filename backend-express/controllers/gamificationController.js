// backend-express/controllers/gamificationController.js// controllers/gamificationController.js

const Achievement = require('../models/gamification/Achievement');

const { Achievement, UserAchievement } = require('../models/gamification/Achievement');const Progress = require('../models/gamification/Progress');

const Progress = require('../models/gamification/Progress');const User = require('../models/User');

const User = require('../models/User');

// XP ve seviye hesaplama yardımcı fonksiyonları

// ==================== HEARTS SYSTEM ====================const calculateLevel = (xp) => {

  return Math.floor(Math.sqrt(xp / 100)) + 1;

// @desc    Kalp (heart) kullan};

// @route   POST /api/gamification/use-heart

// @access  Private/Studentconst calculateXpForNextLevel = (level) => {

exports.useHeart = async (req, res) => {  return Math.pow(level, 2) * 100;

  try {};

    const userId = req.user._id;

    const user = await User.findById(userId);// Achievement kazanma kontrolü

    const checkAchievements = async (user, action) => {

    // Unlimited hearts aktifse  const achievements = [];

    if (user.gamification.hearts.unlimited) {  

      return res.json({   // XP bazlı başarımlar

        message: 'Unlimited hearts aktif',  if (action.type === 'quiz_completed') {

        hearts: user.gamification.hearts    const xpThresholds = [100, 500, 1000, 5000];

      });    const newXP = user.gamification.xp + action.xp;

    }    

        xpThresholds.forEach(async (threshold) => {

    // Kalp var mı kontrol et      if (user.gamification.xp < threshold && newXP >= threshold) {

    if (user.gamification.hearts.current <= 0) {        const achievement = await Achievement.create({

      return res.status(400).json({           student: user._id,

        message: 'Kalbiniz kalmadı',          type: 'milestone',

        hearts: user.gamification.hearts          name: `${threshold} XP Rozeti`,

      });          description: `Tebrikler! ${threshold} XP'ye ulaştınız.`,

    }          rewards: {

                gems: Math.floor(threshold / 100)

    // Kalp azalt          }

    user.gamification.hearts.current -= 1;        });

    await user.save();        

            achievements.push(achievement);

    // Progress kaydı      }

    await Progress.create({    });

      userId: userId,  }

      activity: 'heart_lost',  

      xpEarned: 0,  return achievements;

      details: {};

        heartsRemaining: user.gamification.hearts.current

      }// Controller fonksiyonları

    });const getAchievements = async (req, res) => {

      try {

    res.json({    const achievements = await Achievement.find({ student: req.user._id });

      message: 'Kalp kullanıldı',    res.json(achievements);

      hearts: user.gamification.hearts  } catch (error) {

    });    res.status(500).json({ message: error.message });

  } catch (error) {  }

    res.status(500).json({ message: 'Sunucu hatası', error: error.message });};

  }

};const updateProgress = async (req, res) => {

  try {

// @desc    Kalp doldur (otomatik her 5 dakikada 1)    const { activity, xpEarned, details } = req.body;

// @route   POST /api/gamification/refill-hearts    

// @access  Private/Student    // Yeni ilerleme kayıt

exports.refillHearts = async (req, res) => {    const progress = await Progress.create({

  try {      student: req.user._id,

    const userId = req.user._id;      activity,

    const user = await User.findById(userId);      xpEarned,

          details

    const now = new Date();    });

    const lastRefill = user.gamification.hearts.lastRefillTime || now;    

    const minutesPassed = (now - lastRefill) / (1000 * 60);    // Kullanıcı XP güncelleme

        const user = await User.findById(req.user._id);

    // Her 5 dakikada 1 kalp    user.gamification.xp += xpEarned;

    const heartsToAdd = Math.floor(minutesPassed / 5);    

        // Yeni seviye kontrolü

    if (heartsToAdd > 0) {    const newLevel = calculateLevel(user.gamification.xp);

      const newHearts = Math.min(    if (newLevel > user.gamification.level) {

        user.gamification.hearts.current + heartsToAdd,      user.gamification.level = newLevel;

        5 // Maksimum 5 kalp    }

      );    

          // Başarım kontrolü

      user.gamification.hearts.current = newHearts;    const achievements = await checkAchievements(user, { type: activity, xp: xpEarned });

      user.gamification.hearts.lastRefillTime = now;    

      await user.save();    if (achievements.length > 0) {

            user.gamification.achievements.push(...achievements.map(a => a._id));

      // Progress kaydı    }

      await Progress.create({    

        userId: userId,    await user.save();

        activity: 'heart_refilled',    

        xpEarned: 0,    res.json({

        details: {      progress,

          heartsAdded: heartsToAdd,      newLevel: user.gamification.level,

          totalHearts: newHearts      achievements

        }    });

      });  } catch (error) {

          res.status(500).json({ message: error.message });

      return res.json({  }

        message: `${heartsToAdd} kalp eklendi`,};

        hearts: user.gamification.hearts

      });const getLeaderboard = async (req, res) => {

    }  try {

        const leaderboard = await User.find({ isStudent: true })

    res.json({      .select('firstName lastName gamification.xp gamification.level')

      message: 'Henüz kalp doldurma zamanı gelmedi',      .sort({ 'gamification.xp': -1 })

      hearts: user.gamification.hearts,      .limit(10);

      nextRefillIn: Math.ceil(5 - (minutesPassed % 5)) // Dakika    

    });    res.json(leaderboard);

  } catch (error) {  } catch (error) {

    res.status(500).json({ message: 'Sunucu hatası', error: error.message });    res.status(500).json({ message: error.message });

  }  }

};};



// @desc    Gem karşılığı kalp satın almodule.exports = {

// @route   POST /api/gamification/buy-hearts  getAchievements,

// @access  Private/Student  updateProgress,

exports.buyHearts = async (req, res) => {  getLeaderboard

  try {};
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const gemCost = 10; // 5 kalp = 10 gem
    
    if (user.gamification.gems < gemCost) {
      return res.status(400).json({ 
        message: 'Yeterli gem yok',
        required: gemCost,
        current: user.gamification.gems
      });
    }
    
    // Gem düş, kalp doldur
    user.gamification.gems -= gemCost;
    user.gamification.hearts.current = 5;
    user.gamification.hearts.lastRefillTime = new Date();
    await user.save();
    
    res.json({
      message: 'Kalpler dolduruldu!',
      hearts: user.gamification.hearts,
      gems: user.gamification.gems
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// ==================== STREAK SYSTEM ====================

// @desc    Streak güncelle
// @route   POST /api/gamification/update-streak
// @access  Private/Student
exports.updateStreak = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const lastActivity = user.gamification.streak.lastActivity 
      ? new Date(user.gamification.streak.lastActivity) 
      : null;
    
    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Bugün zaten aktivite var
        return res.json({
          message: 'Streak zaten güncel',
          streak: user.gamification.streak
        });
      } else if (daysDiff === 1) {
        // Ardışık gün
        user.gamification.streak.current += 1;
        
        if (user.gamification.streak.current > user.gamification.streak.longest) {
          user.gamification.streak.longest = user.gamification.streak.current;
        }
      } else if (daysDiff > 1) {
        // Streak kırıldı - freeze kontrol et
        if (user.gamification.streak.freezes > 0 && daysDiff <= 2) {
          // Freeze kullan
          user.gamification.streak.freezes -= 1;
        } else {
          // Streak sıfırla
          user.gamification.streak.current = 1;
        }
      }
    } else {
      // İlk aktivite
      user.gamification.streak.current = 1;
    }
    
    user.gamification.streak.lastActivity = new Date();
    await user.save();
    
    // Progress kaydı
    await Progress.create({
      userId: userId,
      activity: 'streak_maintained',
      xpEarned: 5, // Streak bonusu
      details: {
        streakDays: user.gamification.streak.current
      }
    });
    
    // XP ekle
    user.gamification.xp += 5;
    await user.save();
    
    res.json({
      message: 'Streak güncellendi!',
      streak: user.gamification.streak,
      bonus: 5
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// ==================== XP & LEVEL SYSTEM ====================

// @desc    XP ekle
// @route   POST /api/gamification/add-xp
// @access  Private
exports.addXP = async (req, res) => {
  try {
    const { userId, amount, source } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    const oldXP = user.gamification.xp;
    const oldLevel = user.gamification.level;
    
    user.gamification.xp += amount;
    
    // Level hesapla (her 100 XP = 1 level)
    const newLevel = Math.floor(user.gamification.xp / 100) + 1;
    
    const leveledUp = newLevel > oldLevel;
    if (leveledUp) {
      user.gamification.level = newLevel;
      
      // Level up ödülü: 10 gem
      user.gamification.gems += 10;
      
      // Progress kaydı
      await Progress.create({
        userId: userId,
        activity: 'level_up',
        xpEarned: 0,
        gemsEarned: 10,
        details: {
          oldLevel: oldLevel,
          newLevel: newLevel
        }
      });
    }
    
    await user.save();
    
    res.json({
      message: leveledUp ? `Level ${newLevel}! 🎉` : 'XP eklendi',
      xpAdded: amount,
      totalXP: user.gamification.xp,
      level: user.gamification.level,
      leveledUp: leveledUp,
      xpForNextLevel: (newLevel * 100) - user.gamification.xp
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Günlük hedef ilerleme
// @route   GET /api/gamification/daily-goal
// @access  Private/Student
exports.getDailyGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const now = new Date();
    const lastReset = user.gamification.dailyGoal.lastReset 
      ? new Date(user.gamification.dailyGoal.lastReset)
      : now;
    
    // Günlük hedefi sıfırla (farklı gün)
    if (now.toDateString() !== lastReset.toDateString()) {
      // Dün hedefi tamamladıysa sayacı artır
      if (user.gamification.dailyGoal.progress >= user.gamification.dailyGoal.target) {
        user.gamification.dailyGoal.completedDays += 1;
      }
      
      user.gamification.dailyGoal.progress = 0;
      user.gamification.dailyGoal.lastReset = now;
      await user.save();
    }
    
    const dailyGoal = user.gamification.dailyGoal;
    const percentage = Math.min(
      Math.round((dailyGoal.progress / dailyGoal.target) * 100),
      100
    );
    
    res.json({
      target: dailyGoal.target,
      progress: dailyGoal.progress,
      percentage: percentage,
      completed: dailyGoal.progress >= dailyGoal.target,
      completedDays: dailyGoal.completedDays
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// ==================== ACHIEVEMENTS ====================

// @desc    Tüm başarımları getir
// @route   GET /api/gamification/achievements
// @access  Private/Student
exports.getAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const userAchievements = await UserAchievement.find({ userId: userId })
      .populate('achievementId')
      .sort({ unlockedAt: -1 });
    
    res.json(userAchievements);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Yeni başarımları kontrol et
// @route   GET /api/gamification/achievements/new
// @access  Private/Student
exports.getNewAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const newAchievements = await UserAchievement.find({
      userId: userId,
      isNew: true,
      isUnlocked: true
    }).populate('achievementId');
    
    res.json(newAchievements);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Başarım ödüllerini al
// @route   POST /api/gamification/achievements/:achievementId/claim
// @access  Private/Student
exports.claimAchievementRewards = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const userId = req.user._id;
    
    const userAchievement = await UserAchievement.findOne({
      _id: achievementId,
      userId: userId
    });
    
    if (!userAchievement) {
      return res.status(404).json({ message: 'Başarım bulunamadı' });
    }
    
    const success = await userAchievement.claimRewards();
    
    if (!success) {
      return res.status(400).json({ message: 'Ödüller alınamadı' });
    }
    
    const user = await User.findById(userId).select('gamification');
    
    res.json({
      message: 'Ödüller alındı!',
      rewards: userAchievement.rewards,
      gamification: user.gamification
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// ==================== PROGRESS & STATS ====================

// @desc    Son aktiviteleri getir
// @route   GET /api/gamification/recent-activity
// @access  Private/Student
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7 } = req.query;
    
    const activities = await Progress.getRecentActivity(userId, parseInt(days));
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Günlük özet
// @route   GET /api/gamification/daily-summary
// @access  Private/Student
exports.getDailySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const summary = await Progress.getDailySummary(userId, targetDate);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Haftalık XP grafiği
// @route   GET /api/gamification/weekly-xp
// @access  Private/Student
exports.getWeeklyXP = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const chartData = await Progress.getWeeklyXPChart(userId);
    
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Gamification özeti (dashboard için)
// @route   GET /api/gamification/dashboard
// @access  Private/Student
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('gamification');
    
    // Bugünkü özet
    const dailySummary = await Progress.getDailySummary(userId);
    
    // Haftalık XP
    const weeklyXP = await Progress.getWeeklyXPChart(userId);
    
    // Günlük hedef
    const dailyGoal = user.gamification.dailyGoal;
    const dailyGoalPercentage = Math.min(
      Math.round((dailyGoal.progress / dailyGoal.target) * 100),
      100
    );
    
    // Yeni başarımlar
    const newAchievements = await UserAchievement.countDocuments({
      userId: userId,
      isNew: true,
      isUnlocked: true
    });
    
    res.json({
      gamification: user.gamification,
      dailySummary: dailySummary,
      weeklyXP: weeklyXP,
      dailyGoal: {
        target: dailyGoal.target,
        progress: dailyGoal.progress,
        percentage: dailyGoalPercentage
      },
      newAchievements: newAchievements
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};
