const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  classLevel: { type: String, required: true }, // Örn: "9. Sınıf"
  subject: { type: String, default: 'Matematik' },
  /** Egzersiz oluşturulurken seçilen konu filtresi (gösterim) */
  topic: { type: String, default: '' },
  difficulty: [String], // havuzdan türetilir; artık formda seçilmez
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
  /** Öğrenci ekranı: classic = sorunun kayıtlı tipi; game_show = aynı cevapla oyunvari UI (sayı/şekil/büyük seçenekler) */
  playTransform: { type: String, enum: ['classic', 'game_show'], default: 'classic' },
  pointsPerQuestion: { type: Number, default: 10 }, // Gamification
  timeLimit: { type: Number, default: null }, // dakika cinsinden (null = sınırsız)
  
}, { timestamps: true, collection: 'exercises' });

ExerciseSchema.index({ createdBy: 1, createdAt: -1 }, { name: 'exercises_created_by_created_at' });

module.exports = mongoose.model('Exercise', ExerciseSchema);
