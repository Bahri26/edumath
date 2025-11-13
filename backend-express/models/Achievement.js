// backend-express/models/Achievement.js
const mongoose = require('mongoose');

const AchievementDefinitionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏆' },
  category: { 
    type: String, 
    enum: ['exercises', 'streak', 'xp', 'social', 'special'],
    default: 'exercises'
  },
  requirement: {
    type: { 
      type: String, 
      enum: ['count', 'streak', 'xp_total', 'perfect_score', 'speed', 'custom'],
      required: true 
    },
    target: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  rewards: {
    xp: { type: Number, default: 0 },
    badge: { type: String },
    title: { type: String }
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  }
}, { timestamps: true });

const UserAchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false }
}, { timestamps: true });

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

const AchievementDefinition = mongoose.model('AchievementDefinition', AchievementDefinitionSchema);
const UserAchievement = mongoose.model('UserAchievement', UserAchievementSchema);

module.exports = { AchievementDefinition, UserAchievement };
