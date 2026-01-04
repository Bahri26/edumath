const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  avatar: { type: String },
  // Öğretmen için branş, öğrenci için sınıf seviyesi
  branch: { type: String }, // Öğretmenler için
  grade: { type: String },  // Öğrenciler için
  // Tema ve bildirim ayarları
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  language: { type: String, enum: ['TR', 'EN'], default: 'TR' },
  notifications: { type: Boolean, default: true },
  // Sadece profile özgü genel bilgiler (Opsiyonel)
  bio: { type: String },
  phone: { type: String },
  // Güvenlik alanları
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
  ,
  // Hesap durumu ve zorunlu şifre değişimi
  status: { type: String, enum: ['active', 'pending', 'disabled'], default: 'active' },
  mustChangePassword: { type: Boolean, default: false }

}, { timestamps: true });

// Şifre hashleme
UserSchema.pre('save', async function() {
  // Eğer password değiştirilmemişse, pas geç
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Şifre karşılaştırma
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);