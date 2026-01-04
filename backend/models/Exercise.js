const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  classLevel: { type: String, required: true }, // Örn: "9. Sınıf"
  subject: { type: String, default: 'Matematik' },
  difficulty: [String], // ['Kolay', 'Orta', 'Zor'] - mix yapılabilir
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  totalQuestions: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Öğretmen
  
  // Öğrenci İlerleme Takibi
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: String,
    score: Number,
    completedQuestions: Number,
    status: { type: String, enum: ['started', 'completed', 'abandoned'], default: 'started' },
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      answer: String,
      correct: Boolean,
      timeSpent: Number // saniye
    }],
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    totalTimeSpent: Number // saniye
  }],
  
  isActive: { type: Boolean, default: true },
  gameMode: { type: String, enum: ['practice', 'challenge', 'timed'], default: 'practice' }, // Eğlenceli mod
  pointsPerQuestion: { type: Number, default: 10 }, // Gamification
  timeLimit: { type: Number, default: null }, // dakika cinsinden (null = sınırsız)
  
}, { timestamps: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);
