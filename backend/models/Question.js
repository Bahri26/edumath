const mongoose = require('mongoose');

// Şıklar için alt şema
const OptionSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  image: { type: String, default: '' } 
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String },
  subject: { type: String, default: 'Matematik', index: true },

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
  type: { type: String, enum: ['multiple-choice', 'true-false', 'fill-blank'], default: 'multiple-choice' },
  correctAnswer: { type: String, required: true },
  solution: { type: String, default: '' },
  options: [OptionSchema],
  
  // Kaynak (Manuel/AI)
  source: { type: String, enum: ['Manuel', 'AI'], default: 'Manuel', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

QuestionSchema.index({ text: 'text' });

module.exports = mongoose.model('Question', QuestionSchema);