const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, default: '' },
  level: { type: Number, default: 1 },
  points: { type: Number, default: 0 },
  mastery: { type: Number, default: 0 }, // 0-100
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: null },
  dailyGoal: { type: Number, default: 30 }, // minutes or XP target
  badges: [{ key: String, earnedAt: Date, meta: { type: Object, default: {} } }],
  skills: [SkillSchema],
}, { timestamps: true });

module.exports = mongoose.model('Progress', ProgressSchema);
