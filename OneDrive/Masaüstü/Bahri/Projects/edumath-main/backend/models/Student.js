const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  // 1. Hangi Öğrenci? (User tablosuna bağlar)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // 2. Hangi Öğretmenin Listesinde?
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // 3. Bu öğretmenin sınıfındaki bilgileri
  schoolNumber: { type: String, default: '' }, // Öğretmen A için numara 101 olabilir
  grade: { type: String, default: '9. Sınıf' }, // Öğretmen A'nın 9. sınıfındadır

  // İleride buraya o derse özel notlar eklenebilir
  averageScore: { type: Number, default: 0 }

}, { timestamps: true });

// Bir öğrenci aynı öğretmene iki kere eklenemesin
StudentSchema.index({ userId: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);