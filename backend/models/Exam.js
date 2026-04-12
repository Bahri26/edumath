const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subject: { type: String, default: 'Matematik', index: true },
  topic: { type: String, default: '', index: true },
  classLevel: { type: String, default: '9. Sınıf' },
  duration: { type: Number, default: 60 }, 
  startAt: { type: Date },
  endAt: { type: Date },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'completed', 'draft'], default: 'active' },
  examType: { type: String, default: 'manual' },
  learningOutcomes: [{ type: String }],
  mebReference: { type: String, default: '' },
  
  // Öğrenci Sonuçları
  results: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: String,
    score: Number,
    correctCount: Number,
    wrongCount: Number,
    topicStats: [{ topic: String, wrong: Number }],
    weakTopics: [String], 
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true, collection: 'exams' });

module.exports = mongoose.model('Exam', ExamSchema);