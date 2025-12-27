const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
    index: true
  },
  avatar: { type: String },
  branch: { type: String }, // Öğretmenler için
  grade: { type: String },  // Öğrenciler için
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  language: { type: String, enum: ['TR', 'EN'], default: 'TR' },
  notifications: { type: Boolean, default: true },
  bio: { type: String },
  phone: { type: String },
  // Gamification fields
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  level: { type: String, default: '1' },
  diamonds: { type: Number, default: 0 },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]

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