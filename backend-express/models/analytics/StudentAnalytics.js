// backend-express/models/analytics/StudentAnalytics.js
const mongoose = require('mongoose');

// Topic Performance Schema
const topicPerformanceSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  level: { type: String, enum: ['Kolay', 'Orta', 'Zor'], required: true },
  totalAttempts: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }, // Percentage
  averageTimePerQuestion: { type: Number, default: 0 }, // Seconds
  totalXPEarned: { type: Number, default: 0 },
  lastAttemptDate: { type: Date },
  strongestAreas: [String], // Subcategories where student excels
  weakestAreas: [String], // Subcategories needing improvement
  improvementRate: { type: Number, default: 0 } // % change in accuracy over time
});

// Weekly Stats Schema
const weeklyStatsSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  totalExercises: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  totalXP: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 }, // Minutes
  averageAccuracy: { type: Number, default: 0 },
  daysActive: { type: Number, default: 0 },
  topicsStudied: [String]
});

// Daily Activity Schema
const dailyActivitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  exercisesCompleted: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // Minutes
  topicsStudied: [String]
});

// Attempt History Schema (for tracking individual attempts)
const attemptHistorySchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'InteractiveExercise' },
  topic: String,
  level: String,
  questionsCount: Number,
  correctCount: Number,
  wrongCount: Number,
  accuracy: Number,
  xpEarned: Number,
  timeSpent: Number, // Seconds
  timestamp: { type: Date, default: Date.now },
  isPracticeMode: { type: Boolean, default: false }
});

// Main Student Analytics Schema
const studentAnalyticsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  
  // Overall Statistics
  totalExercisesCompleted: { type: Number, default: 0 },
  totalQuestionsAnswered: { type: Number, default: 0 },
  totalCorrectAnswers: { type: Number, default: 0 },
  totalWrongAnswers: { type: Number, default: 0 },
  overallAccuracy: { type: Number, default: 0 },
  totalXPEarned: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 }, // Minutes
  
  // Performance by Topic
  topicPerformance: [topicPerformanceSchema],
  
  // Time-based Stats
  weeklyStats: [weeklyStatsSchema],
  dailyActivity: [dailyActivitySchema],
  
  // Attempt History (last 100 attempts)
  attemptHistory: [attemptHistorySchema],
  
  // Strongest & Weakest Topics
  strongestTopics: [{
    topic: String,
    accuracy: Number,
    level: String
  }],
  weakestTopics: [{
    topic: String,
    accuracy: Number,
    level: String
  }],
  
  // Learning Patterns
  mostActiveDay: { type: String }, // 'Monday', 'Tuesday', etc.
  mostActiveHour: { type: Number }, // 0-23
  averageSessionDuration: { type: Number, default: 0 }, // Minutes
  
  // Progress Tracking
  currentLevel: { type: String, default: 'Başlangıç' },
  nextLevelProgress: { type: Number, default: 0 }, // Percentage to next level
  
  lastUpdated: { type: Date, default: Date.now }
});

// Index for efficient queries
studentAnalyticsSchema.index({ userId: 1 });
studentAnalyticsSchema.index({ 'topicPerformance.topic': 1 });
studentAnalyticsSchema.index({ 'weeklyStats.weekStart': -1 });
studentAnalyticsSchema.index({ 'dailyActivity.date': -1 });

// Static method to get or create analytics
studentAnalyticsSchema.statics.getOrCreate = async function(userId) {
  let analytics = await this.findOne({ userId });
  if (!analytics) {
    analytics = await this.create({ userId });
  }
  return analytics;
};

// Instance method to record an exercise attempt
studentAnalyticsSchema.methods.recordAttempt = async function(attemptData) {
  const { exerciseId, topic, level, questionsCount, correctCount, timeSpent, xpEarned, isPracticeMode } = attemptData;
  
  const wrongCount = questionsCount - correctCount;
  const accuracy = questionsCount > 0 ? (correctCount / questionsCount) * 100 : 0;
  
  // Add to attempt history (keep last 100)
  this.attemptHistory.unshift({
    exerciseId,
    topic,
    level,
    questionsCount,
    correctCount,
    wrongCount,
    accuracy,
    xpEarned,
    timeSpent,
    isPracticeMode,
    timestamp: new Date()
  });
  if (this.attemptHistory.length > 100) {
    this.attemptHistory = this.attemptHistory.slice(0, 100);
  }
  
  // Update overall stats (skip if practice mode)
  if (!isPracticeMode) {
    this.totalExercisesCompleted += 1;
    this.totalQuestionsAnswered += questionsCount;
    this.totalCorrectAnswers += correctCount;
    this.totalWrongAnswers += wrongCount;
    this.totalXPEarned += xpEarned;
    this.totalTimeSpent += Math.round(timeSpent / 60); // Convert to minutes
    this.overallAccuracy = this.totalQuestionsAnswered > 0 
      ? (this.totalCorrectAnswers / this.totalQuestionsAnswered) * 100 
      : 0;
  }
  
  // Update topic performance
  await this.updateTopicPerformance(topic, level, correctCount, wrongCount, timeSpent, xpEarned);
  
  // Update daily activity
  await this.updateDailyActivity(topic, correctCount, xpEarned, timeSpent);
  
  // Update weekly stats
  await this.updateWeeklyStats(topic, correctCount, questionsCount, xpEarned, timeSpent);
  
  this.lastUpdated = new Date();
  await this.save();
  
  return this;
};

// Update topic performance
studentAnalyticsSchema.methods.updateTopicPerformance = async function(topic, level, correctCount, wrongCount, timeSpent, xpEarned) {
  let topicData = this.topicPerformance.find(tp => tp.topic === topic && tp.level === level);
  
  if (!topicData) {
    topicData = {
      topic,
      level,
      totalAttempts: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      accuracy: 0,
      averageTimePerQuestion: 0,
      totalXPEarned: 0
    };
    this.topicPerformance.push(topicData);
    topicData = this.topicPerformance[this.topicPerformance.length - 1];
  }
  
  topicData.totalAttempts += 1;
  topicData.correctAnswers += correctCount;
  topicData.wrongAnswers += wrongCount;
  topicData.totalXPEarned += xpEarned;
  topicData.lastAttemptDate = new Date();
  
  const totalQuestions = topicData.correctAnswers + topicData.wrongAnswers;
  topicData.accuracy = totalQuestions > 0 ? (topicData.correctAnswers / totalQuestions) * 100 : 0;
  topicData.averageTimePerQuestion = totalQuestions > 0 ? timeSpent / totalQuestions : 0;
};

// Update daily activity
studentAnalyticsSchema.methods.updateDailyActivity = async function(topic, correctCount, xpEarned, timeSpent) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyData = this.dailyActivity.find(da => {
    const activityDate = new Date(da.date);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });
  
  if (!dailyData) {
    dailyData = {
      date: today,
      exercisesCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      xpEarned: 0,
      timeSpent: 0,
      topicsStudied: []
    };
    this.dailyActivity.push(dailyData);
    dailyData = this.dailyActivity[this.dailyActivity.length - 1];
  }
  
  dailyData.exercisesCompleted += 1;
  dailyData.questionsAnswered += correctCount + (correctCount > 0 ? 1 : 0); // Approximate
  dailyData.correctAnswers += correctCount;
  dailyData.xpEarned += xpEarned;
  dailyData.timeSpent += Math.round(timeSpent / 60);
  
  if (!dailyData.topicsStudied.includes(topic)) {
    dailyData.topicsStudied.push(topic);
  }
  
  // Keep only last 90 days
  if (this.dailyActivity.length > 90) {
    this.dailyActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.dailyActivity = this.dailyActivity.slice(0, 90);
  }
};

// Update weekly stats
studentAnalyticsSchema.methods.updateWeeklyStats = async function(topic, correctCount, questionsCount, xpEarned, timeSpent) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  let weekData = this.weeklyStats.find(ws => {
    const wsStart = new Date(ws.weekStart);
    wsStart.setHours(0, 0, 0, 0);
    return wsStart.getTime() === weekStart.getTime();
  });
  
  if (!weekData) {
    weekData = {
      weekStart,
      weekEnd,
      totalExercises: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      totalXP: 0,
      totalTimeSpent: 0,
      averageAccuracy: 0,
      daysActive: 1,
      topicsStudied: []
    };
    this.weeklyStats.push(weekData);
    weekData = this.weeklyStats[this.weeklyStats.length - 1];
  }
  
  weekData.totalExercises += 1;
  weekData.totalQuestions += questionsCount;
  weekData.correctAnswers += correctCount;
  weekData.totalXP += xpEarned;
  weekData.totalTimeSpent += Math.round(timeSpent / 60);
  weekData.averageAccuracy = weekData.totalQuestions > 0 
    ? (weekData.correctAnswers / weekData.totalQuestions) * 100 
    : 0;
  
  if (!weekData.topicsStudied.includes(topic)) {
    weekData.topicsStudied.push(topic);
  }
  
  // Keep only last 12 weeks
  if (this.weeklyStats.length > 12) {
    this.weeklyStats.sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
    this.weeklyStats = this.weeklyStats.slice(0, 12);
  }
};

module.exports = mongoose.model('StudentAnalytics', studentAnalyticsSchema);
