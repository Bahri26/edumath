// backend-express/models/Question.js (GÜNCEL HALİ)

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Soruyu oluşturan öğretmenin kimliği
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // User modeline bağlanır
  },

  // --- YENİ ALANLAR (Adım 1 Formundan) ---
  subject: {
    type: String,
    required: [true, 'Ders alanı zorunludur.'],
    trim: true,
  },
  classLevel: {
    type: String,
    required: [true, 'Sınıf seviyesi zorunludur.'],
    trim: true,
  },
  topic: {
    type: String,
    required: [true, 'Konu alanı zorunludur.'],
    trim: true,
  },
  learningOutcome: {
    type: String,
    required: [true, 'Kazanım alanı zorunludur.'],
    trim: true,
  },
  questionType: {
    type: String,
    required: [true, 'Soru tipi zorunludur.'],
    // enum, bu alanın sadece bu değerleri alabileceğini garantiler
    enum: ['test', 'dogru-yanlis', 'bosluk-doldurma', 'eslestirme'],
    default: 'test'
  },
  // --- YENİ ALANLAR BİTİŞİ ---
  
  // Soru metni
  text: {
    type: String,
    required: [true, 'Soru metni zorunludur.'],
    trim: true
  },
  
  // Seçenekler (Dinamik Zorunluluk)
  options: {
    type: [String],
    // Sadece 'test' veya 'dogru-yanlis' ise zorunludur.
    // 'bosluk-doldurma' için zorunlu DEĞİLDİR.
    required: function() {
      return this.questionType === 'test' || this.questionType === 'dogru-yanlis';
    }
  },
  
  // Doğru cevap
  // 'test' -> "Seçenek metni"
  // 'dogru-yanlis' -> "Doğru" veya "Yanlış"
  // 'bosluk-doldurma' -> "Gelecek kelime"
  correctAnswer: {
    type: String,
    required: [true, 'Doğru cevap zorunludur.']
  }

}, { timestamps: true }); // createdAt ve updatedAt'i otomatik ekler

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;