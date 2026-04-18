const mongoose = require('mongoose');

// Şıklar için alt şema
const OptionSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  image: { type: String, default: '' } 
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String },
  visualPrompt: { type: String, default: '' },
  subject: { type: String, default: 'Matematik', index: true },
  // Konu başlığı (ör. "Örüntüler")
  topic: { type: String, default: '', index: true },
  learningOutcome: { type: String, default: '' },
  mebReference: { type: String, default: '' },
  curriculumNote: { type: String, default: '' },

  // 🚨 GÜNCELLENDİ: 1. Sınıftan 12. Sınıfa Kadar + Mezun
  classLevel: { 
    type: String, 
    enum: [
      '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', // İlkokul
      '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', // Ortaokul
      '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', // Lise
    ], 
    default: '9. Sınıf',
    index: true 
  },

  difficulty: { type: String, enum: ['Kolay', 'Orta', 'Zor'], default: 'Orta', index: true },
  type: { type: String, enum: ['multiple-choice', 'true-false', 'fill-blank', 'matching', 'sequence'], default: 'multiple-choice' },
  interactiveType: { type: String, enum: ['none', 'matching', 'sequence'], default: 'none' },
  interactionData: { type: mongoose.Schema.Types.Mixed, default: null },
  correctAnswer: { type: String, required: true },
  solution: { type: String, default: '' },
  options: [OptionSchema],
  
  // Kaynak (Manuel/AI)
  source: { type: String, enum: ['Manuel', 'AI'], default: 'Manuel', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true, collection: 'questions' });

QuestionSchema.index({ text: 'text' });
QuestionSchema.index({ createdBy: 1, createdAt: -1 }, { name: 'questions_created_by_created_at' });
QuestionSchema.index({ subject: 1, classLevel: 1, difficulty: 1, createdAt: -1 }, { name: 'questions_subject_class_difficulty_created_at' });
QuestionSchema.index({ subject: 1, classLevel: 1, topic: 1, createdAt: -1 }, { name: 'questions_subject_class_topic_created_at' });

module.exports = mongoose.model('Question', QuestionSchema);