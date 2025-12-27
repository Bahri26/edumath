const mongoose = require('mongoose');

const lastPositionSchema = new mongoose.Schema({
  videoTimestamp: { type: Number }, // saniye
  codeSnippet: { type: String },
  questionIndex: { type: Number },
  mathStep: { type: String }
}, { _id: false });

const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
  status: { type: String, enum: ['locked', 'in-progress', 'completed'], default: 'locked' },
  completionPercentage: { type: Number, default: 0 },
  lastPosition: { type: lastPositionSchema, default: {} },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

userProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
