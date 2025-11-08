const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  // Achievement Template (Global)
  isTemplate: {
    type: Boolean,
    default: true
  },
  
  type: {
    type: String,
  enum: ['badge', 'level', 'streak', 'milestone', 'mastery', 'speed', 'perfectionist', 'explorer', 'social'],
  
  category: {
    type: String,
    enum: ['learning', 'engagement', 'social', 'challenge', 'special'],
    default: 'learning'
  },
  
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
    required: true
  },
  name: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  icon: {
    type: String,
    default: '🏆'
  },
  
  criteria: {
    metric: {
      type: String,
      enum: ['lessons_completed', 'xp_earned', 'streak_days', 'perfect_scores', 'topics_mastered', 'speed_record', 'accuracy_rate'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    condition: {
      type: String,
      enum: ['>=', '>', '=', 'consecutive'],
      default: '>='
    }
  },
  
  rewards: {
    xp: {
      type: Number,
      default: 0
    },
    gems: {
      type: Number,
      default: 0
    },
    streakFreeze: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      default: ''
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// User Achievement (Instance)
const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  
  name: String,
  description: String,
  type: String,
  category: String,
  tier: String,
  rarity: String,
  icon: String,
  
  unlockedAt: {
    type: Date,
    default: Date.now
  
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  isUnlocked: {
    type: Boolean,
    default: false
  },
  
  isNew: {
    type: Boolean,
    default: true
  },
  
  rewards: {
    xp: {
      type: Number,
      default: 0
    },
    gems: {
      type: Number,
      default: 0
    },
    streakFreeze: {
      type: Number,
      default: 0
    },
    title: String
  },
  
  rewardsClaimed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// İndeksler
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, isUnlocked: 1 });

// İlerlemeyi güncelle
userAchievementSchema.methods.updateProgress = function(newValue) {
  this.progress.current = Math.min(newValue, this.progress.target);
  this.progress.percentage = Math.round((this.progress.current / this.progress.target) * 100);
  
  if (this.progress.current >= this.progress.target && !this.isUnlocked) {
    this.isUnlocked = true;
    this.unlockedAt = new Date();
    return true; // Achievement unlocked!
  }
  
  return false;
};

// Ödülleri kullanıcıya ver
userAchievementSchema.methods.claimRewards = async function() {
  if (!this.isUnlocked || this.rewardsClaimed) {
    return false;
  }
  
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  
  if (!user) return false;
  
  user.gamification.xp += this.rewards.xp || 0;
  user.gamification.gems += this.rewards.gems || 0;
  user.gamification.streak.freezes += this.rewards.streakFreeze || 0;
  
  await user.save();
  
  this.rewardsClaimed = true;
  this.isNew = false;
  await this.save();
  
  return true;
};

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { Achievement, UserAchievement };