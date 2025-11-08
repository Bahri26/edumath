const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentLevel: {
    type: Number,
    required: true,
    default: 1
  },
  recommendedTopics: [{
    topic: String,
    priority: Number,
    reason: String
  }],
  completedTopics: [{
    topic: String,
    completedAt: Date,
    score: Number
  }],
  nextMilestones: [{
    topic: String,
    targetDate: Date,
    requirements: [String]
  }],
  adaptiveLearning: {
    preferredLearningStyle: String,
    difficultyLevel: String,
    pacePreference: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LearningPath', learningPathSchema);