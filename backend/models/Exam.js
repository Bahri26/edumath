const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  classLevel: { type: String, default: '9. Sınıf' },
  duration: { type: Number, default: 60 }, 
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'completed', 'draft'], default: 'active' },
  
  // Öğrenci Sonuçları
  results: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: String,
    score: Number,
    correctCount: Number,
    wrongCount: Number,
    weakTopics: [String], 
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);