const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // unique / index → aşağıdaki explicit index(...) ile Atlas’taki sabit index adları eşlenir.
  username: { type: String, trim: true },
  usernameLower: { type: String, trim: true },
  email: { type: String, required: true },
  emailLower: { type: String, trim: true },
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
  mustChangePassword: { type: Boolean, default: false },
  privacyConsentAt: { type: Date },
  privacyConsentVersion: { type: String, default: '' },

}, { timestamps: true, collection: 'users' });

// Index adları Atlas/eskı kurulumlarla uyumlu: email_unique yaygın; mongoose'un email_1 üretmesi engellenir.
UserSchema.index({ email: 1 }, { unique: true, name: 'email_unique' });
UserSchema.index({ emailLower: 1 }, { unique: true, name: 'emailLower_1' });
UserSchema.index(
  { username: 1 },
  { unique: true, sparse: true, name: 'username_1' }
);
UserSchema.index(
  { usernameLower: 1 },
  { unique: true, sparse: true, name: 'usernameLower_1' }
);

// Mongoose 8: document pre hook'larına `next` verilmez; senkron veya async/Promise kullanın.
UserSchema.pre('validate', function() {
  if (typeof this.email === 'string') {
    this.email = this.email.trim();
    this.emailLower = this.email.toLowerCase();
  }

  if (typeof this.username === 'string') {
    this.username = this.username.trim();
  }

  if (this.username) {
    this.usernameLower = String(this.username).toLowerCase();
  } else {
    this.usernameLower = undefined;
  }
});

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

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  const salt = await bcrypt.genSalt(saltRounds);
  this.password = await bcrypt.hash(pwd, salt);
});

// Şifre karşılaştırma
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.syncLoginIdentifiers = async function syncLoginIdentifiers() {
  const users = await this.find({
    $or: [
      { emailLower: { $exists: false } },
      { emailLower: null },
      { emailLower: '' },
      {
        $and: [
          { username: { $exists: true, $ne: null } },
          {
            $or: [
              { usernameLower: { $exists: false } },
              { usernameLower: null },
              { usernameLower: '' },
            ],
          },
        ],
      },
    ],
  })
    .select('_id email username')
    .lean();

  if (!users.length) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  const operations = users.map((user) => {
    const update = {
      emailLower: String(user.email || '').trim().toLowerCase(),
    };

    const username = String(user.username || '').trim();
    if (username) {
      update.usernameLower = username.toLowerCase();
    } else {
      update.usernameLower = undefined;
    }

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: update,
        },
      },
    };
  });

  const result = await this.bulkWrite(operations, { ordered: false });
  return {
    matchedCount: result.matchedCount || users.length,
    modifiedCount: result.modifiedCount || 0,
  };
};

module.exports = mongoose.model('User', UserSchema);