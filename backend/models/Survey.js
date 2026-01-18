const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questions: [{
    questionText: { type: String, required: true },
    type: { type: String, default: 'text' }, // 'text' or 'multiple-choice'
    options: [{ type: String }], // Only for multiple-choice
  }],
  responses: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [{ questionId: String, answer: String }],
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Survey', SurveySchema);