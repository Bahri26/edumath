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
    enum: [
      // Klasik Sorular
      'test', 'dogru-yanlis', 'bosluk-doldurma', 'acik-uclu',
      // İnteraktif Sorular - Eşleştirme Tabanlı
      'eslestirme', 'surukle-birak', 'hafiza-karti', 'eslesmeyi-bul',
      // İnteraktif Sorular - Sıralama Tabanlı
      'siralama', 'kelime-corbasi', 'grup-siralama', 'anagram',
      // İnteraktif Sorular - Görsel/Çizim
      'cizim', 'grafik-ciz', 'sayi-dogrusu', 'kesir-gorsel', 'geometri-cizim',
      // İnteraktif Sorular - Özel
      'denklem-kur', 'carkifelek', 'kutu-ac', 'eslesme-oyunu', 'cumle-tamamla'
    ],
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

  // İnteraktif soru tipleri için ekstra konfigürasyon
  interactiveConfig: {
    // Eşleştirme, Sürükle-Bırak, Hafıza Kartı için
    leftItems: [String],
    rightItems: [String],
    matchingPairs: mongoose.Schema.Types.Mixed, // JSON object
    
    // Sıralama, Anagram için
    items: [String],
    correctOrder: [String],
    
    // Çizim, Grafik, Geometri için
    drawingType: String,
    expectedResult: mongoose.Schema.Types.Mixed,
    
    // Sayı Doğrusu için
    numberLineMin: Number,
    numberLineMax: Number,
    
    // Kesir Görseli için
    fractionType: String,
    totalParts: Number,
    
    // Denklem Kurma için
    operators: String,
    variables: String,
    
    // Genel amaçlı
    options: [String],
    hints: [String]
  },

  solutionText: {
    type: String,
    trim: true,
    default: ''
  }

}, { timestamps: true }); 

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;