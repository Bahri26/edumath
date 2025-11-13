const mongoose = require('mongoose');

// Use distinct model name to avoid clashing with main LearningPath
const analyticsLearningPathSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentLevel: { type: Number, default: 1 },
  recommendedTopics: [ { topic: String, priority: Number, reason: String } ],
  completedTopics: [ { topic: String, completedAt: Date, score: Number } ],
  nextMilestones: [ { topic: String, targetDate: Date, requirements: [String] } ],
  adaptiveLearning: {
    preferredLearningStyle: String,
    difficultyLevel: String,
    pacePreference: String
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.AnalyticsLearningPath || mongoose.model('AnalyticsLearningPath', analyticsLearningPathSchema);