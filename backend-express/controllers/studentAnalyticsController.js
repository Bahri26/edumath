// backend-express/controllers/studentAnalyticsController.js
const StudentAnalytics = require('../models/analytics/StudentAnalytics');
const Progress = require('../models/gamification/Progress');
const Result = require('../models/Result');

// GET /api/student-analytics/overview - Get student overview
const getOverview = async (req, res) => {
  try {
    const analytics = await StudentAnalytics.getOrCreate(req.user._id);
    const progress = await Progress.findOne({ userId: req.user._id });
    
    res.json({
      totalExercises: analytics.totalExercisesCompleted,
      totalQuestions: analytics.totalQuestionsAnswered,
      overallAccuracy: analytics.overallAccuracy.toFixed(1),
      totalXP: analytics.totalXPEarned,
      totalTimeSpent: analytics.totalTimeSpent, // Minutes
      currentLevel: progress?.level || 1,
      currentXP: progress?.xp || 0
    });
  } catch (err) {
    console.error('Get overview error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/student-analytics/topic-performance - Get performance by topic
const getTopicPerformance = async (req, res) => {
  try {
    const analytics = await StudentAnalytics.getOrCreate(req.user._id);
    
    // Sort by accuracy descending
    const topicPerformance = analytics.topicPerformance
      .map(tp => ({
        topic: tp.topic,
        level: tp.level,
        totalAttempts: tp.totalAttempts,
        accuracy: tp.accuracy.toFixed(1),
        averageTimePerQuestion: tp.averageTimePerQuestion.toFixed(1),
        totalXPEarned: tp.totalXPEarned,
        lastAttemptDate: tp.lastAttemptDate
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
    
    res.json({ topicPerformance });
  } catch (err) {
    console.error('Get topic performance error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/student-analytics/daily-activity - Get daily activity (last 30 days)
const getDailyActivity = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await StudentAnalytics.getOrCreate(req.user._id);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const dailyActivity = analytics.dailyActivity
      .filter(da => new Date(da.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(da => ({
        date: da.date.toISOString().split('T')[0],
        exercisesCompleted: da.exercisesCompleted,
        questionsAnswered: da.questionsAnswered,
        correctAnswers: da.correctAnswers,
        accuracy: da.questionsAnswered > 0 
          ? ((da.correctAnswers / da.questionsAnswered) * 100).toFixed(1) 
          : 0,
        xpEarned: da.xpEarned,
        timeSpent: da.timeSpent,
        topicsStudied: da.topicsStudied
      }));
    
    res.json({ dailyActivity });
  } catch (err) {
    console.error('Get daily activity error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/student-analytics/weekly-stats - Get weekly stats (last 12 weeks)
const getWeeklyStats = async (req, res) => {
  try {
    const analytics = await StudentAnalytics.getOrCreate(req.user._id);
    
    const weeklyStats = analytics.weeklyStats
      .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
      .slice(0, 12)
      .map(ws => ({
        weekStart: ws.weekStart.toISOString().split('T')[0],
        weekEnd: ws.weekEnd.toISOString().split('T')[0],
        totalExercises: ws.totalExercises,
        totalQuestions: ws.totalQuestions,
        correctAnswers: ws.correctAnswers,
        averageAccuracy: ws.averageAccuracy.toFixed(1),
        totalXP: ws.totalXP,
        totalTimeSpent: ws.totalTimeSpent,
        daysActive: ws.daysActive,
        topicsStudied: ws.topicsStudied
      }));
    
    res.json({ weeklyStats });
  } catch (err) {
    console.error('Get weekly stats error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/student-analytics/attempt-history - Get recent attempts
const getAttemptHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const analytics = await StudentAnalytics.getOrCreate(req.user._id);
    
    const attemptHistory = analytics.attemptHistory
      .slice(0, parseInt(limit))
      .map(ah => ({
        exerciseId: ah.exerciseId,
        topic: ah.topic,
        level: ah.level,
        questionsCount: ah.questionsCount,
        correctCount: ah.correctCount,
        wrongCount: ah.wrongCount,
        accuracy: ah.accuracy.toFixed(1),
        xpEarned: ah.xpEarned,
        timeSpent: ah.timeSpent,
        timestamp: ah.timestamp,
        isPracticeMode: ah.isPracticeMode
      }));
    
    res.json({ attemptHistory });
  } catch (err) {
    console.error('Get attempt history error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/student-analytics/performance-trends - Get performance trends
const getPerformanceTrends = async (req, res) => {
  try {
    const analytics = await StudentAnalytics.getOrCreate(req.user._id);
    
    // Calculate trends from last 30 attempts
    const recentAttempts = analytics.attemptHistory.slice(0, 30);
    
    if (recentAttempts.length === 0) {
      return res.json({
        accuracyTrend: [],
        xpTrend: [],
        timeSpentTrend: [],
        overallTrend: 'neutral'
      });
    }
    
    // Group by day
    const trendByDay = {};
    recentAttempts.forEach(attempt => {
      const day = new Date(attempt.timestamp).toISOString().split('T')[0];
      if (!trendByDay[day]) {
        trendByDay[day] = {
          totalQuestions: 0,
          correctAnswers: 0,
          totalXP: 0,
          totalTime: 0,
          count: 0
        };
      }
      trendByDay[day].totalQuestions += attempt.questionsCount;
      trendByDay[day].correctAnswers += attempt.correctCount;
      trendByDay[day].totalXP += attempt.xpEarned;
      trendByDay[day].totalTime += attempt.timeSpent;
      trendByDay[day].count += 1;
    });
    
    const days = Object.keys(trendByDay).sort();
    const accuracyTrend = days.map(day => ({
      date: day,
      value: trendByDay[day].totalQuestions > 0 
        ? ((trendByDay[day].correctAnswers / trendByDay[day].totalQuestions) * 100).toFixed(1)
        : 0
    }));
    
    const xpTrend = days.map(day => ({
      date: day,
      value: trendByDay[day].totalXP
    }));
    
    const timeSpentTrend = days.map(day => ({
      date: day,
      value: Math.round(trendByDay[day].totalTime / 60) // Minutes
    }));
    
    // Calculate overall trend (comparing first half vs second half)
    const midPoint = Math.floor(recentAttempts.length / 2);
    const firstHalf = recentAttempts.slice(midPoint);
    const secondHalf = recentAttempts.slice(0, midPoint);
    
    const firstHalfAccuracy = firstHalf.reduce((sum, a) => sum + a.accuracy, 0) / firstHalf.length;
    const secondHalfAccuracy = secondHalf.reduce((sum, a) => sum + a.accuracy, 0) / secondHalf.length;
    
    let overallTrend = 'neutral';
    if (secondHalfAccuracy > firstHalfAccuracy + 5) overallTrend = 'improving';
    else if (secondHalfAccuracy < firstHalfAccuracy - 5) overallTrend = 'declining';
    
    res.json({
      accuracyTrend,
      xpTrend,
      timeSpentTrend,
      overallTrend,
      averageAccuracyChange: (secondHalfAccuracy - firstHalfAccuracy).toFixed(1)
    });
  } catch (err) {
    console.error('Get performance trends error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/student-analytics/strongest-weakest - Get strongest and weakest topics
const getStrongestWeakest = async (req, res) => {
  try {
    const analytics = await StudentAnalytics.getOrCreate(req.user._id);
    
    const topicsWithData = analytics.topicPerformance
      .filter(tp => tp.totalAttempts >= 3) // At least 3 attempts
      .map(tp => ({
        topic: tp.topic,
        level: tp.level,
        accuracy: tp.accuracy,
        totalAttempts: tp.totalAttempts
      }));
    
    const strongest = topicsWithData
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);
    
    const weakest = topicsWithData
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
    
    res.json({ strongest, weakest });
  } catch (err) {
    console.error('Get strongest/weakest error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/student-analytics/comparison - Compare with class average
const getComparison = async (req, res) => {
  try {
    const { classId } = req.query;
    
    if (!classId) {
      return res.status(400).json({ message: 'Class ID gerekli.' });
    }
    
    // Get current student's analytics
    const studentAnalytics = await StudentAnalytics.getOrCreate(req.user._id);
    
    // Get all students in class
    const Class = require('../models/Class');
    const classData = await Class.findById(classId).populate('students');
    
    if (!classData) {
      return res.status(404).json({ message: 'Sınıf bulunamadı.' });
    }
    
    const studentIds = classData.students.map(s => s._id);
    const allAnalytics = await StudentAnalytics.find({ userId: { $in: studentIds } });
    
    // Calculate class averages
    const classAverage = {
      accuracy: 0,
      xp: 0,
      exercises: 0,
      timeSpent: 0
    };
    
    if (allAnalytics.length > 0) {
      classAverage.accuracy = allAnalytics.reduce((sum, a) => sum + a.overallAccuracy, 0) / allAnalytics.length;
      classAverage.xp = allAnalytics.reduce((sum, a) => sum + a.totalXPEarned, 0) / allAnalytics.length;
      classAverage.exercises = allAnalytics.reduce((sum, a) => sum + a.totalExercisesCompleted, 0) / allAnalytics.length;
      classAverage.timeSpent = allAnalytics.reduce((sum, a) => sum + a.totalTimeSpent, 0) / allAnalytics.length;
    }
    
    // Student's rank
    const sortedByXP = allAnalytics.sort((a, b) => b.totalXPEarned - a.totalXPEarned);
    const studentRank = sortedByXP.findIndex(a => a.userId.toString() === req.user._id.toString()) + 1;
    
    res.json({
      student: {
        accuracy: studentAnalytics.overallAccuracy.toFixed(1),
        xp: studentAnalytics.totalXPEarned,
        exercises: studentAnalytics.totalExercisesCompleted,
        timeSpent: studentAnalytics.totalTimeSpent,
        rank: studentRank
      },
      classAverage: {
        accuracy: classAverage.accuracy.toFixed(1),
        xp: Math.round(classAverage.xp),
        exercises: Math.round(classAverage.exercises),
        timeSpent: Math.round(classAverage.timeSpent)
      },
      totalStudents: allAnalytics.length
    });
  } catch (err) {
    console.error('Get comparison error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  getOverview,
  getTopicPerformance,
  getDailyActivity,
  getWeeklyStats,
  getAttemptHistory,
  getPerformanceTrends,
  getStrongestWeakest,
  getComparison
};

