// backend-express/models/DailyChallenge.js

const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'complete_lessons',      // X ders tamamla
      'earn_xp',              // X XP kazan
      'perfect_score',        // Bir dersten 100 al
      'streak_maintain',      // Streak'i koru
      'time_challenge',       // X dakikada Y soru çöz
      'accuracy_challenge',   // %X doğruluk oranıyla tamamla
      'topic_mastery',        // Belirli bir konuyu tamamla
      'no_mistakes'           // Hiç hata yapmadan tamamla
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🎯'
  },
  difficulty: {
    type: String,
    enum: ['Kolay', 'Orta', 'Zor'],
    default: 'Orta'
  },
  target: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String, // 'lessons', 'xp', 'minutes', 'questions', 'percentage'
      required: true
    }
  },
  rewards: {
    xp: {
      type: Number,
      default: 50
    },
    gems: {
      type: Number,
      default: 5
    },
    streakFreeze: {
      type: Boolean,
      default: false
    },
    unlimitedHearts: {
      duration: {
        type: Number, // dakika cinsinden
        default: 0
      }
    }
  },
  validForGrades: [{
    type: Number,
    min: 1,
    max: 9
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'special'],
    default: 'daily'
  }
}, {
  timestamps: true
});

const userChallengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyChallenge',
    required: true
  },
  challengeType: {
    type: String,
    required: true
  },
  title: String,
  description: String,
  target: {
    value: Number,
    unit: String
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  rewards: {
    xp: Number,
    gems: Number,
    streakFreeze: Boolean,
    unlimitedHearts: {
      duration: Number
    }
  },
  rewardsClaimed: {
    type: Boolean,
    default: false
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// İndeksler
userChallengeSchema.index({ userId: 1, assignedDate: -1 });
userChallengeSchema.index({ userId: 1, isCompleted: 1 });
userChallengeSchema.index({ expiresAt: 1 }); // TTL için

// İlerlemeyi güncelle
userChallengeSchema.methods.updateProgress = function(currentValue) {
  this.progress.current = Math.min(currentValue, this.target.value);
  this.progress.percentage = Math.round((this.progress.current / this.target.value) * 100);
  
  if (this.progress.current >= this.target.value && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  return this.isCompleted;
};

// Ödülleri uygula
userChallengeSchema.methods.claimRewards = async function() {
  if (!this.isCompleted || this.rewardsClaimed) {
    return false;
  }
  
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  
  if (!user) return false;
  
  // XP ekle
  if (this.rewards.xp) {
    user.gamification.xp += this.rewards.xp;
  }
  
  // Gem ekle
  if (this.rewards.gems) {
    user.gamification.gems += this.rewards.gems;
  }
  
  // Streak freeze ekle
  if (this.rewards.streakFreeze) {
    user.gamification.streak.freezes += 1;
  }
  
  // Unlimited hearts aktifleştir
  if (this.rewards.unlimitedHearts && this.rewards.unlimitedHearts.duration > 0) {
    user.gamification.hearts.unlimited = true;
    // Duration sonrası otomatik kapanması için ayrı bir mekanizma gerekli
  }
  
  await user.save();
  
  this.rewardsClaimed = true;
  await this.save();
  
  return true;
};

// Günlük challenge'ları oluştur
challengeSchema.statics.generateDailyChallenges = async function(userId, gradeLevel) {
  const UserChallenge = mongoose.model('UserChallenge');
  
  // Bugünün tarihi
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Bugün zaten challenge var mı kontrol et
  const existing = await UserChallenge.findOne({
    userId: userId,
    assignedDate: { $gte: today, $lt: tomorrow }
  });
  
  if (existing) {
    return null; // Zaten var
  }
  
  // Aktif daily challenge'ları getir
  const availableChallenges = await this.find({
    isActive: true,
    frequency: 'daily',
    validForGrades: gradeLevel
  });
  
  if (availableChallenges.length === 0) {
    return null;
  }
  
  // Rastgele 3 challenge seç
  const selectedChallenges = availableChallenges
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  
  // User challenge'ları oluştur
  const userChallenges = await Promise.all(
    selectedChallenges.map(challenge => {
      const expiresAt = new Date(tomorrow);
      expiresAt.setHours(23, 59, 59, 999);
      
      return UserChallenge.create({
        userId: userId,
        challengeId: challenge._id,
        challengeType: challenge.type,
        title: challenge.title,
        description: challenge.description,
        target: challenge.target,
        rewards: challenge.rewards,
        assignedDate: today,
        expiresAt: expiresAt
      });
    })
  );
  
  return userChallenges;
};

const DailyChallenge = mongoose.model('DailyChallenge', challengeSchema);
const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);

module.exports = { DailyChallenge, UserChallenge };
