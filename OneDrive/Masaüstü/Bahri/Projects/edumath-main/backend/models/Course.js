const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'quiz', 'coding-java', 'math-interactive'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  xpReward: { type: Number, default: 10 },
  content: { type: mongoose.Schema.Types.Mixed }, // Video URL, quiz questions, kodlama starter, vs.
  order: { type: Number, default: 0 }
});

const unitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [lessonSchema],
  order: { type: Number, default: 0 }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  units: [unitSchema],
  category: { type: String },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  icon: { type: String },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = {
  Course: mongoose.model('Course', courseSchema),
  Unit: mongoose.model('Unit', unitSchema),
  Lesson: mongoose.model('Lesson', lessonSchema)
};
