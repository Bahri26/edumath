const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'homework', 'practice'],
    required: true
  },
  metrics: {
    timeSpent: Number,
    attemptsCount: Number,
    correctAnswers: Number,
    incorrectAnswers: Number,
    accuracy: Number
  },
  topicPerformance: [{
    topic: String,
    score: Number,
    timeSpent: Number
  }],
  strengthsAndWeaknesses: {
    strengths: [String],
    weaknesses: [String]
  },
  trends: {
    daily: [{
      date: Date,
      score: Number,
      activity: Number
    }],
    weekly: [{
      week: Date,
      averageScore: Number,
      totalActivity: Number
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);