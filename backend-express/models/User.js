// backend-express/models/User.js (GÜNCEL HALİ)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'E-posta adresi zorunludur.'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Şifre zorunludur.'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır.'],
    select: false, // findOne ile şifreyi otomatik çekme
  },
  firstName: {
    type: String,
    required: [true, 'Ad zorunludur.'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Soyad zorunludur.'],
    trim: true,
  },
  // --- ROLLER ---
  isStudent: {
    type: Boolean,
    default: false,
  },
  isTeacher: {
    type: Boolean,
    default: false,
  },

  // --- YENİ EKLENEN ALANLAR ---
  birthDate: {
    type: Date,
    required: [true, 'Doğum tarihi zorunludur.'],
  },
  gradeLevel: {
    type: Number,
    min: 1,
    max: 12,
    // Sınıf düzeyi, SADECE kullanıcı öğrenciyse zorunludur.
    required: [
        function() { return this.isStudent; }, // 'this' dokümanı temsil eder
        'Öğrenciler için sınıf düzeyi zorunludur.'
    ]
  }
  // --- YENİ EKLENEN ALANLAR BİTİŞ ---

}, { timestamps: true }); // createdAt ve updatedAt'i otomatik ekler

// Sanal Alan (Virtual Property) - Ad ve Soyad'ı birleştirir
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Şifreyi Kaydetmeden Önce Hash'le (pre-save hook)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre Doğrulama Metodu
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;