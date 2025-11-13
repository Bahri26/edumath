// backend-express/models/gamification/Streak.js
const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  streakFreezes: {
    type: Number,
    default: 0
  },
  totalDaysActive: {
    type: Number,
    default: 0
  },
  streakHistory: [{
    date: Date,
    maintained: Boolean,
    xpEarned: Number,
    freezeUsed: { type: Boolean, default: false },
    dayOfWeek: Number // 0-6 (Sunday-Saturday)
  }],
  weeklyStats: [{
    weekStart: Date,
    daysActive: Number,
    totalXP: Number
  }],
  // Duolingo-style: If user doesn't practice for a day, can use a freeze
  freezeUsedToday: {
    type: Boolean,
    default: false
  },
  // Bonus XP for maintaining streak
  streakBonusXP: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Methods
streakSchema.methods.updateStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = this.lastActivityDate ? new Date(this.lastActivityDate) : null;
  if (lastDate) {
    lastDate.setHours(0, 0, 0, 0);
  }

  // Check if already updated today
  if (lastDate && lastDate.getTime() === today.getTime()) {
    return { message: 'Streak already updated today', currentStreak: this.currentStreak };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!lastDate || lastDate.getTime() === yesterday.getTime()) {
    // Continue streak
    this.currentStreak += 1;
    this.totalDaysActive += 1;
    
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }

    // Bonus XP for milestones
    let bonusXP = 0;
    if (this.currentStreak % 7 === 0) bonusXP = 50; // Weekly milestone
    if (this.currentStreak % 30 === 0) bonusXP = 200; // Monthly milestone
    if (this.currentStreak === 100) bonusXP = 1000; // 100 day milestone
    
    this.streakBonusXP += bonusXP;
    this.streakHistory.push({
      date: today,
      maintained: true,
      xpEarned: bonusXP
    });

  } else {
    // Streak broken - check if freeze available
    if (this.streakFreezes > 0 && !this.freezeUsedToday) {
      this.streakFreezes -= 1;
      this.freezeUsedToday = true;
      this.streakHistory.push({
        date: today,
        maintained: true,
        xpEarned: 0
      });
    } else {
      // Reset streak
      this.currentStreak = 1;
      this.totalDaysActive += 1;
      this.streakHistory.push({
        date: today,
        maintained: false,
        xpEarned: 0
      });
    }
  }

  this.lastActivityDate = today;
  this.freezeUsedToday = false; // Reset for next day
  await this.save();

  return {
    currentStreak: this.currentStreak,
    longestStreak: this.longestStreak,
    bonusXPEarned: this.streakHistory[this.streakHistory.length - 1].xpEarned
  };
};

streakSchema.methods.buyStreakFreeze = function() {
  this.streakFreezes += 1;
  return this.save();
};

// Instance method to use a streak freeze
streakSchema.methods.useStreakFreeze = async function() {
  if (this.streakFreezes <= 0) {
    throw new Error('No streak freezes available');
  }
  
  this.streakFreezes -= 1;
  
  // Mark today as freeze used
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingEntry = this.streakHistory.find(h => 
    new Date(h.date).toDateString() === today.toDateString()
  );
  
  if (existingEntry) {
    existingEntry.freezeUsed = true;
    existingEntry.maintained = true;
  } else {
    this.streakHistory.push({
      date: today,
      maintained: true,
      xpEarned: 0,
      freezeUsed: true,
      dayOfWeek: today.getDay()
    });
  }
  
  await this.save();
  return this;
};

// Instance method to update weekly stats
streakSchema.methods.updateWeeklyStats = async function() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  
  // Get this week's history
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const weekHistory = this.streakHistory.filter(h => {
    const date = new Date(h.date);
    return date >= weekStart && date < weekEnd;
  });
  
  const daysActive = weekHistory.filter(h => h.maintained).length;
  const totalXP = weekHistory.reduce((sum, h) => sum + (h.xpEarned || 0), 0);
  
  // Find or create this week's stat
  const existingStat = this.weeklyStats.find(s => 
    new Date(s.weekStart).toDateString() === weekStart.toDateString()
  );
  
  if (existingStat) {
    existingStat.daysActive = daysActive;
    existingStat.totalXP = totalXP;
  } else {
    this.weeklyStats.push({
      weekStart,
      daysActive,
      totalXP
    });
  }
  
  await this.save();
  return this;
};

// Static methods
streakSchema.statics.getOrCreate = async function(userId) {
  let streak = await this.findOne({ userId });
  if (!streak) {
    streak = await this.create({ userId });
  }
  return streak;
};

module.exports = mongoose.model('Streak', streakSchema);
