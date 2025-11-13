// backend-express/models/Survey.js
const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  // Optional target class; null means all classes
  targetClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Optional questions for rendering in client
  questions: [
    {
      qid: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      text: { type: String, required: true },
      type: { type: String, enum: ['text', 'single', 'multi'], default: 'text' },
      options: [{ type: String }], // for single/multi
    }
  ],
  // Basic response schema; can be extended later
  responses: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      answers: [{ questionId: String, value: mongoose.Schema.Types.Mixed }],
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Survey', surveySchema);
