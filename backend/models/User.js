const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true, trim: true },
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
  // Branş onay süreci: öğretmen seçer, admin onaylar
  branchApproval: { type: String, enum: ['none', 'pending', 'approved'], default: 'none' },
  grade: { type: String },  // Öğrenciler için
  schoolType: { type: String, enum: ['ilkokul', 'ortaokul', 'lise'], default: 'ilkokul' },
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

}, { timestamps: true, collection: 'users' });

// Şifre hashleme
UserSchema.pre('save', async function() {
  // Eğer password değiştirilmemişse, pas geç
  if (!this.isModified('password')) {
    return;
  }

  // Eğer şifre zaten bcrypt formatında ise (ör. $2b$10$...), tekrar hashleme
  // Yapma. Bu, mevcut kullanıcıları veya dışarıdan hash'lenmiş verileri içe
  // aktarırken çift hash'i önler.
  const pwd = String(this.password || '');
  const looksHashed = pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.startsWith('$2y$');
  if (looksHashed && pwd.length >= 50) {
    try {
      // getRounds hash üzerinde çalışıyorsa bu gerçek bir bcrypt hash'tir.
      const rounds = bcrypt.getRounds(pwd);
      if (typeof rounds === 'number' && rounds > 0) {
        return; // Mevcut hash'i koru
      }
    } catch {}
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(pwd, salt);
  } catch (err) {
    throw err;
  }
});

// Şifre karşılaştırma
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);