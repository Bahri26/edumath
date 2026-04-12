const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  order: { type: Number, default: 0 },
  content: { type: String, default: '' }, // Text, video URL, vb.
  quiz: [{
    question: { type: String, required: true },
    options: [{ text: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' }
  }],
}, { collection: 'lessons' });

module.exports = mongoose.model('Lesson', LessonSchema);
