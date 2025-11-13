// backend-express/controllers/achievementController.js
const { AchievementDefinition, UserAchievement } = require('../models/Achievement');
const Progress = require('../models/gamification/Progress');
const Streak = require('../models/gamification/Streak');

// Predefined achievements
const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    title: 'İlk Kan',
    description: 'İlk alıştırmanı tamamla',
    icon: '🎯',
    category: 'exercises',
    requirement: { type: 'count', target: 1, metadata: { activity: 'exercise_completed' } },
    rewards: { xp: 10, badge: 'first_blood' },
    rarity: 'common'
  },
  {
    id: 'beginner_5',
    title: 'Acemi',
    description: '5 Kolay alıştırma tamamla',
    icon: '🌱',
    category: 'exercises',
    requirement: { type: 'count', target: 5, metadata: { difficulty: 'Kolay' } },
    rewards: { xp: 50, badge: 'beginner' },
    rarity: 'common'
  },
  {
    id: 'intermediate_10',
    title: 'Orta Seviye',
    description: '10 Orta alıştırma tamamla',
    icon: '⚡',
    category: 'exercises',
    requirement: { type: 'count', target: 10, metadata: { difficulty: 'Orta' } },
    rewards: { xp: 100, badge: 'intermediate' },
    rarity: 'rare'
  },
  {
    id: 'expert_10',
    title: 'Uzman',
    description: '10 Zor alıştırma tamamla',
    icon: '🔥',
    category: 'exercises',
    requirement: { type: 'count', target: 10, metadata: { difficulty: 'Zor' } },
    rewards: { xp: 200, badge: 'expert' },
    rarity: 'epic'
  },
  {
    id: 'streak_3',
    title: '3 Günlük Seri',
    description: 'Üst üste 3 gün giriş yap',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', target: 3 },
    rewards: { xp: 30 },
    rarity: 'common'
  },
  {
    id: 'streak_7',
    title: 'Haftalık Seri',
    description: 'Üst üste 7 gün giriş yap',
    icon: '🔥🔥',
    category: 'streak',
    requirement: { type: 'streak', target: 7 },
    rewards: { xp: 100, badge: 'week_warrior' },
    rarity: 'rare'
  },
  {
    id: 'streak_30',
    title: 'Aylık Efsane',
    description: 'Üst üste 30 gün giriş yap',
    icon: '🔥🔥🔥',
    category: 'streak',
    requirement: { type: 'streak', target: 30 },
    rewards: { xp: 500, badge: 'month_legend', title: 'Seri Efendisi' },
    rarity: 'legendary'
  },
  {
    id: 'xp_100',
    title: 'XP Avcısı',
    description: 'Toplam 100 XP kazan',
    icon: '⭐',
    category: 'xp',
    requirement: { type: 'xp_total', target: 100 },
    rewards: { xp: 20 },
    rarity: 'common'
  },
  {
    id: 'xp_1000',
    title: 'XP Ustası',
    description: 'Toplam 1000 XP kazan',
    icon: '⭐⭐',
    category: 'xp',
    requirement: { type: 'xp_total', target: 1000 },
    rewards: { xp: 200, badge: 'xp_master' },
    rarity: 'epic'
  },
  {
    id: 'perfect_10',
    title: 'Mükemmeliyetçi',
    description: 'Üst üste 10 soruya doğru cevap ver',
    icon: '💯',
    category: 'special',
    requirement: { type: 'custom', target: 10, metadata: { type: 'perfect_streak' } },
    rewards: { xp: 150, badge: 'perfectionist' },
    rarity: 'rare'
  }
];

// Initialize achievements in database
exports.initializeAchievements = async (req, res) => {
  try {
    for (const achievement of ACHIEVEMENTS) {
      await AchievementDefinition.findOneAndUpdate(
        { id: achievement.id },
        achievement,
        { upsert: true, new: true }
      );
    }
    res.json({ message: `${ACHIEVEMENTS.length} başarı yüklendi.`, count: ACHIEVEMENTS.length });
  } catch (err) {
    console.error('Initialize achievements error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Get all achievements (definitions)
exports.getAllAchievements = async (req, res) => {
  try {
    const achievements = await AchievementDefinition.find().sort({ rarity: 1, createdAt: 1 });
    res.json({ achievements });
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Get user's achievements with progress
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all achievement definitions
    const definitions = await AchievementDefinition.find();
    
    // Get user's progress
    const userAchievements = await UserAchievement.find({ userId });
    const userAchievementsMap = {};
    userAchievements.forEach(ua => {
      userAchievementsMap[ua.achievementId] = ua;
    });
    
    // Calculate current progress for each achievement
    const achievementsWithProgress = await Promise.all(definitions.map(async (def) => {
      const userAch = userAchievementsMap[def.id];
      let currentProgress = userAch ? userAch.progress : 0;
      let completed = userAch ? userAch.completed : false;
      let claimed = userAch ? userAch.claimed : false;
      
      // Calculate real-time progress
      if (!completed) {
        currentProgress = await calculateProgress(userId, def);
      }
      
      return {
        ...def.toObject(),
        progress: currentProgress,
        completed,
        claimed,
        unlockedAt: userAch ? userAch.unlockedAt : null
      };
    }));
    
    res.json({ achievements: achievementsWithProgress });
  } catch (err) {
    console.error('Get user achievements error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Calculate progress for an achievement
async function calculateProgress(userId, achievementDef) {
  try {
    const { requirement } = achievementDef;
    
    switch (requirement.type) {
      case 'count': {
        const filter = { userId, activity: 'exercise_completed' };
        if (requirement.metadata?.difficulty) {
          filter['details.difficulty'] = requirement.metadata.difficulty;
        }
        const count = await Progress.countDocuments(filter);
        return Math.min(count, requirement.target);
      }
      
      case 'streak': {
        const streak = await Streak.findOne({ userId });
        return streak ? Math.min(streak.currentStreak, requirement.target) : 0;
      }
      
      case 'xp_total': {
        const result = await Progress.aggregate([
          { $match: { userId, activity: 'exercise_completed' } },
          { $group: { _id: null, total: { $sum: '$xpEarned' } } }
        ]);
        const totalXP = result.length > 0 ? result[0].total : 0;
        return Math.min(totalXP, requirement.target);
      }
      
      case 'custom': {
        // Custom logic for special achievements
        if (requirement.metadata?.type === 'perfect_streak') {
          // Count consecutive correct answers
          const recentProgress = await Progress.find({ 
            userId, 
            activity: { $in: ['exercise_completed', 'exercise_failed'] } 
          })
            .sort({ createdAt: -1 })
            .limit(requirement.target)
            .select('activity');
          
          let consecutiveCorrect = 0;
          for (const p of recentProgress) {
            if (p.activity === 'exercise_completed') {
              consecutiveCorrect++;
            } else {
              break;
            }
          }
          return consecutiveCorrect;
        }
        return 0;
      }
      
      default:
        return 0;
    }
  } catch (err) {
    console.error('Calculate progress error:', err);
    return 0;
  }
}

// Check and unlock achievements for user
exports.checkAchievements = async (userId) => {
  try {
    const definitions = await AchievementDefinition.find();
    const unlockedAchievements = [];
    
    for (const def of definitions) {
      const userAch = await UserAchievement.findOne({ 
        userId, 
        achievementId: def.id 
      });
      
      // Skip if already completed
      if (userAch && userAch.completed) continue;
      
      const progress = await calculateProgress(userId, def);
      
      // Check if requirement met
      if (progress >= def.requirement.target) {
        await UserAchievement.findOneAndUpdate(
          { userId, achievementId: def.id },
          { 
            progress,
            completed: true,
            unlockedAt: new Date()
          },
          { upsert: true, new: true }
        );
        
        unlockedAchievements.push({
          id: def.id,
          title: def.title,
          description: def.description,
          icon: def.icon,
          rewards: def.rewards
        });
      } else {
        // Update progress
        await UserAchievement.findOneAndUpdate(
          { userId, achievementId: def.id },
          { progress },
          { upsert: true }
        );
      }
    }
    
    return unlockedAchievements;
  } catch (err) {
    console.error('Check achievements error:', err);
    return [];
  }
};

// Claim achievement rewards
exports.claimRewards = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const userId = req.user._id;
    
    const userAch = await UserAchievement.findOne({ userId, achievementId });
    
    if (!userAch || !userAch.completed) {
      return res.status(404).json({ message: 'Başarı bulunamadı veya tamamlanmamış.' });
    }
    
    if (userAch.claimed) {
      return res.status(400).json({ message: 'Ödül zaten alınmış.' });
    }
    
    // Get achievement definition for rewards
    const def = await AchievementDefinition.findOne({ id: achievementId });
    if (!def) {
      return res.status(404).json({ message: 'Başarı tanımı bulunamadı.' });
    }
    
    // Mark as claimed
    userAch.claimed = true;
    await userAch.save();
    
    // Add XP reward to progress
    if (def.rewards.xp > 0) {
      await Progress.create({
        userId,
        activity: 'achievement_claimed',
        xpEarned: def.rewards.xp,
        details: {
          achievementId: def.id,
          achievementTitle: def.title
        }
      });
    }
    
    res.json({ 
      message: 'Ödül alındı!',
      rewards: def.rewards,
      achievement: {
        id: def.id,
        title: def.title,
        icon: def.icon
      }
    });
  } catch (err) {
    console.error('Claim rewards error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
