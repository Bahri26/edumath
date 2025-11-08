// backend-express/models/Curriculum.js

const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
  // Müfredatı oluşturan öğretmen/admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  // Müfredatın ait olduğu sınıf seviyesi (örn: 1, 2, ..., 12)
  gradeLevel: {
    type: Number,
    required: [true, 'Sınıf seviyesi zorunludur.'],
    min: 1,
    max: 12
  },
  // Ünite adı (örn: "Örüntüler ve Süslemeler", "Doğal Sayılar")
  unitName: {
    type: String,
    required: [true, 'Ünite adı zorunludur.'],
    trim: true
  },
  // Ünite hakkında kısa açıklama (isteğe bağlı)
  description: {
    type: String,
    trim: true
  },
  // Üniteye ait kazanımlar
  objectives: [
    {
      id: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }
  ]
}, { timestamps: true });

// Aynı sınıf seviyesi için aynı ünite adının tekrar etmesini engelle
curriculumSchema.index({ gradeLevel: 1, unitName: 1 }, { unique: true });

const Curriculum = mongoose.model('Curriculum', curriculumSchema);
module.exports = Curriculum;
