const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: null },
  dailyGoal: { type: Number, default: 30 }, // minutes or XP target
  badges: [{ key: String, earnedAt: Date }],
  skills: [{ subject: String, level: { type: Number, default: 1 }, points: { type: Number, default: 0 } }],
}, { timestamps: true });

module.exports = mongoose.model('Progress', ProgressSchema);
