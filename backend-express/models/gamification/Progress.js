const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  activity: {
    type: String,
    enum: [
      'lesson_completed',
      'lesson_attempted',
      'quiz_completed', 
      'streak_maintained',
      'exercise_completed',
      'challenge_completed',
      'achievement_unlocked',
      'level_up',
      'perfect_score',
      'heart_lost',
      'heart_refilled'
    ],
  
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath.units.lessons',
    default: null
  },
  
  unitNumber: {
    type: Number,
    default: null
  },
  
  lessonNumber: {
    type: Number,
    default: null
  },
  
    required: true
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  
  gemsEarned: {
    type: Number,
    default: 0
  
  },
  date: {
    type: Date,
    default: Date.now
  
  },
  details: {
    score: Number,
    timeSpent: Number,
    correctAnswers: Number,
    totalQuestions: Number,
    accuracy: Number,
    difficulty: String,
    heartsLost: Number,
    mistakes: [{
      questionId: String,
      correctAnswer: String,
      userAnswer: String
    }],
    metadata: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// İndeksler
progressSchema.index({ userId: 1, date: -1 });
progressSchema.index({ userId: 1, activity: 1 });
progressSchema.index({ date: -1 });

// Statik metod: Kullanıcının son X günlük aktivitesini getir
progressSchema.statics.getRecentActivity = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.find({
    userId: userId,
    date: { $gte: startDate }
  })
  .sort({ date: -1 })
  .limit(100);
};

// Statik metod: Günlük aktivite özeti
progressSchema.statics.getDailySummary = async function(userId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const activities = await this.find({
    userId: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
  
  const summary = {
    totalXP: 0,
    totalGems: 0,
    lessonsCompleted: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    activities: activities.length
  };
  
  let totalScore = 0;
  let scoreCount = 0;
  
  activities.forEach(activity => {
    summary.totalXP += activity.xpEarned || 0;
    summary.totalGems += activity.gemsEarned || 0;
    
    if (activity.activity === 'lesson_completed') {
      summary.lessonsCompleted += 1;
    }
    
    if (activity.details?.timeSpent) {
      summary.totalTimeSpent += activity.details.timeSpent;
    }
    
    if (activity.details?.score !== undefined) {
      totalScore += activity.details.score;
      scoreCount += 1;
    }
  });
  
  summary.averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
  
  return summary;
};

// Statik metod: Haftalık XP grafiği
progressSchema.statics.getWeeklyXPChart = async function(userId) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const activities = await this.find({
    userId: userId,
    date: { $gte: sevenDaysAgo }
  });
  
  // Günlere göre grupla
  const dailyXP = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dailyXP[dateStr] = 0;
  }
  
  activities.forEach(activity => {
    const dateStr = activity.date.toISOString().split('T')[0];
    if (dailyXP.hasOwnProperty(dateStr)) {
      dailyXP[dateStr] += activity.xpEarned || 0;
    }
  });
  
  return Object.entries(dailyXP).map(([date, xp]) => ({
    date: date,
    xp: xp
  }));
};

const Progress = mongoose.model('Progress', progressSchema);
module.exports = Progress;