// backend-express/models/Question.js (RESİM URL'İ EKLENMİŞ SON HALİ)

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
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
    enum: ['test', 'dogru-yanlis', 'bosluk-doldurma', 'eslestirme'],
    default: 'test'
  },
  difficulty: {
    type: String,
    required: [true, 'Zorluk seviyesi zorunludur.'],
    enum: ['Kolay', 'Orta', 'Zor'],
    default: 'Orta'
  },
  text: {
    type: String,
    required: [true, 'Soru metni zorunludur.'],
    trim: true
  },
  options: {
    type: [String],
    required: function() {
      return this.questionType === 'test' || this.questionType === 'dogru-yanlis';
    }
  },
  correctAnswer: {
    type: String,
    required: [true, 'Doğru cevap zorunludur.']
  },

  solutionText: {
    type: String,
    trim: true,
    default: ''
  }

}, { timestamps: true }); 

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;