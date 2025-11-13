// backend-express/models/social/Challenge.js
const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Kolay', 'Orta', 'Zor'],
    required: true
  },
  questionsCount: {
    type: Number,
    default: 5,
    min: 3,
    max: 20
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  challengerScore: {
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date
  },
  opponentScore: {
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  xpReward: {
    type: Number,
    default: 50
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

// Index for efficient queries
challengeSchema.index({ challenger: 1, status: 1 });
challengeSchema.index({ opponent: 1, status: 1 });
challengeSchema.index({ expiresAt: 1 });

// Instance method to accept challenge
challengeSchema.methods.accept = async function() {
  if (this.status !== 'pending') {
    throw new Error('Challenge is not pending');
  }
  
  this.status = 'accepted';
  await this.save();
  return this;
};

// Instance method to decline challenge
challengeSchema.methods.decline = async function() {
  if (this.status !== 'pending') {
    throw new Error('Challenge is not pending');
  }
  
  this.status = 'declined';
  await this.save();
  return this;
};

// Instance method to submit score
challengeSchema.methods.submitScore = async function(userId, scoreData) {
  const { correct, wrong, timeSpent } = scoreData;
  
  if (userId.toString() === this.challenger.toString()) {
    this.challengerScore = {
      correct,
      wrong,
      timeSpent,
      completed: true,
      completedAt: new Date()
    };
  } else if (userId.toString() === this.opponent.toString()) {
    this.opponentScore = {
      correct,
      wrong,
      timeSpent,
      completed: true,
      completedAt: new Date()
    };
  } else {
    throw new Error('User not part of this challenge');
  }
  
  // Check if both completed
  if (this.challengerScore.completed && this.opponentScore.completed) {
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Determine winner
    if (this.challengerScore.correct > this.opponentScore.correct) {
      this.winner = this.challenger;
    } else if (this.opponentScore.correct > this.challengerScore.correct) {
      this.winner = this.opponent;
    } else {
      // Tie: faster time wins
      if (this.challengerScore.timeSpent < this.opponentScore.timeSpent) {
        this.winner = this.challenger;
      } else if (this.opponentScore.timeSpent < this.challengerScore.timeSpent) {
        this.winner = this.opponent;
      }
      // If still tie, no winner (draw)
    }
  }
  
  await this.save();
  return this;
};

// Static method to check and expire old challenges
challengeSchema.statics.expireOldChallenges = async function() {
  const now = new Date();
  
  await this.updateMany(
    {
      status: { $in: ['pending', 'accepted'] },
      expiresAt: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

module.exports = mongoose.model('Challenge', challengeSchema);
