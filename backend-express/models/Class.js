// backend-express/models/Class.js (YENİ DOSYA)

const mongoose = require('mongoose');

// Bu şema, "9-A Matematik" gibi bir ŞUBEYİ temsil eder.
const classSchema = new mongoose.Schema({
  // Şubeyi oluşturan öğretmen
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  
  // Şubenin adı (örn: "9-A Fen Grubu")
  name: {
    type: String,
    required: [true, 'Sınıf (şube) adı zorunludur.'],
    trim: true
  },
  
  // Şubenin ana dersi (örn: "Matematik")
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  // URL'den gelen seviye (örn: "9", "10", "11")
  // Bunu filtreleme (GET) için kullanacağız
  gradeLevel: {
    type: String, 
    required: [true, 'Sınıf seviyesi zorunludur.'] 
  },
  
  // Öğrencilerin katılmak için kullanacağı kod
  classCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Bu şubeye kayıtlı öğrenciler
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]

}, { timestamps: true });

// Sınıf kodu oluşturmak için (isteğe bağlı, şimdilik controller'da yapacağız)
// classSchema.pre('save', function(next) { ... });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;