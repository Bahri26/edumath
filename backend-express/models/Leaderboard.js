// backend-express/models/Leaderboard.js

const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rank: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  // Değişim (önceki haftaya göre)
  rankChange: {
    type: Number,
    default: 0 // pozitif: yükseldi, negatif: düştü
  },
  previousRank: {
    type: Number,
    default: 0
  }
});

const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['global', 'class', 'grade', 'weekly', 'monthly'],
    required: true
  },
  scope: {
    // class için: classId
    // grade için: gradeLevel
    // global/weekly/monthly için: null
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    gradeLevel: {
      type: Number,
      min: 1,
      max: 9,
      default: null
    }
  },
  period: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  metric: {
    type: String,
    enum: ['xp', 'lessons_completed', 'streak', 'accuracy', 'total_score'],
    default: 'xp'
  },
  entries: [leaderboardEntrySchema],
  totalParticipants: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// İndeksler
leaderboardSchema.index({ type: 1, 'scope.gradeLevel': 1, isActive: 1 });
leaderboardSchema.index({ type: 1, 'scope.referenceId': 1, isActive: 1 });
leaderboardSchema.index({ 'entries.userId': 1 });

// Leaderboard'u güncelle
leaderboardSchema.methods.updateRankings = async function() {
  const User = mongoose.model('User');
  
  let query = { isStudent: true };
  
  // Scope'a göre filtreleme
  if (this.type === 'class' && this.scope.referenceId) {
    query.classId = this.scope.referenceId;
  } else if (this.type === 'grade' && this.scope.gradeLevel) {
    query.gradeLevel = this.scope.gradeLevel;
  } else if (this.type === 'weekly' || this.type === 'monthly') {
    // Zaman aralığına göre aktivite filtresi
    query['analytics.lastActivity'] = {
      $gte: this.period.startDate,
      $lte: this.period.endDate || new Date()
    };
  }
  
  // Metriğe göre sıralama
  let sortField = 'gamification.xp';
  if (this.metric === 'lessons_completed') {
    sortField = 'analytics.completedTopics';
  } else if (this.metric === 'streak') {
    sortField = 'gamification.streak.current';
  } else if (this.metric === 'accuracy') {
    sortField = 'analytics.performanceMetrics.accuracy';
  }
  
  // Kullanıcıları getir ve sırala
  const users = await User.find(query)
    .select('firstName lastName gamification analytics')
    .sort({ [sortField]: -1 })
    .limit(100); // Top 100
  
  // Önceki sıralamaları sakla
  const previousRankings = new Map(
    this.entries.map(entry => [entry.userId.toString(), entry.rank])
  );
  
  // Yeni entries oluştur
  this.entries = users.map((user, index) => {
    const userId = user._id.toString();
    const currentRank = index + 1;
    const previousRank = previousRankings.get(userId) || 0;
    const rankChange = previousRank > 0 ? previousRank - currentRank : 0;
    
    let score = 0;
    if (this.metric === 'xp') {
      score = user.gamification.xp;
    } else if (this.metric === 'streak') {
      score = user.gamification.streak.current;
    } else if (this.metric === 'lessons_completed') {
      score = user.analytics.completedTopics || 0;
    } else if (this.metric === 'accuracy') {
      score = user.analytics.performanceMetrics?.accuracy || 0;
    }
    
    return {
      userId: user._id,
      rank: currentRank,
      score: score,
      rankChange: rankChange,
      previousRank: previousRank
    };
  });
  
  this.totalParticipants = this.entries.length;
  this.lastUpdated = new Date();
  
  await this.save();
  return this;
};

// Kullanıcının sıralamasını getir
leaderboardSchema.methods.getUserRank = function(userId) {
  const entry = this.entries.find(e => e.userId.toString() === userId.toString());
  
  if (!entry) {
    return null;
  }
  
  return {
    rank: entry.rank,
    score: entry.score,
    rankChange: entry.rankChange,
    totalParticipants: this.totalParticipants,
    percentile: Math.round((1 - (entry.rank / this.totalParticipants)) * 100)
  };
};

// Kullanıcının etrafındaki sıralamayı getir (±5)
leaderboardSchema.methods.getNearbyRanks = function(userId, range = 5) {
  const userIndex = this.entries.findIndex(e => e.userId.toString() === userId.toString());
  
  if (userIndex === -1) {
    return [];
  }
  
  const start = Math.max(0, userIndex - range);
  const end = Math.min(this.entries.length, userIndex + range + 1);
  
  return this.entries.slice(start, end);
};

// Statik metod: Belirli bir tip için leaderboard oluştur veya getir
leaderboardSchema.statics.getOrCreate = async function(type, scope = {}, metric = 'xp') {
  const query = {
    type: type,
    metric: metric,
    isActive: true
  };
  
  if (scope.referenceId) {
    query['scope.referenceId'] = scope.referenceId;
  }
  if (scope.gradeLevel) {
    query['scope.gradeLevel'] = scope.gradeLevel;
  }
  
  let leaderboard = await this.findOne(query);
  
  if (!leaderboard) {
    // Yeni leaderboard oluştur
    const period = {};
    if (type === 'weekly') {
      period.startDate = new Date();
      period.startDate.setDate(period.startDate.getDate() - period.startDate.getDay()); // Haftanın başı
      period.endDate = new Date(period.startDate);
      period.endDate.setDate(period.endDate.getDate() + 7);
    } else if (type === 'monthly') {
      period.startDate = new Date();
      period.startDate.setDate(1); // Ayın başı
      period.endDate = new Date(period.startDate);
      period.endDate.setMonth(period.endDate.getMonth() + 1);
    }
    
    leaderboard = await this.create({
      type: type,
      scope: scope,
      metric: metric,
      period: period
    });
  }
  
  // Son güncellemeden 1 saatten fazla geçmişse güncelle
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (leaderboard.lastUpdated < oneHourAgo) {
    await leaderboard.updateRankings();
  }
  
  return leaderboard;
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
module.exports = Leaderboard;
