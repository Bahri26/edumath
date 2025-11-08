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
    select: false,
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
  isStudent: {
    type: Boolean,
    default: false,
  },
  isTeacher: {
    type: Boolean,
    default: false,
  },
  isStaff: {
    type: Boolean,
    default: false,
  },
  birthDate: {
    type: Date,
    required: [true, 'Doğum tarihi zorunludur.'],
  },
  gradeLevel: {
    type: Number,
    min: 1,
    max: 12,
    required: [
      function() { return this.isStudent; },
      'Öğrenciler için sınıf düzeyi zorunludur.'
    ]
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  gamification: {
    xp: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    gems: {
      type: Number,
      default: 0
    },
    hearts: {
      current: {
        type: Number,
        default: 5,
        max: 5
      },
      lastRefillTime: {
        type: Date,
        default: Date.now
      },
      unlimited: {
        type: Boolean,
        default: false
      }
    },
    streak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastActivity: {
        type: Date,
        default: null
      },
      freezes: {
        type: Number,
        default: 0
      }
    },
    dailyGoal: {
      target: {
        type: Number,
        default: 20 // Günlük XP hedefi
      },
      progress: {
        type: Number,
        default: 0
      },
      lastReset: {
        type: Date,
        default: Date.now
      },
      completedDays: {
        type: Number,
        default: 0
      }
    },
    achievements: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    }],
    badges: [{
      type: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum']
      },
      category: String,
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  analytics: {
    lastActivity: Date,
    totalTimeSpent: Number,
    averageScore: Number,
    completedTopics: Number,
    learningStyle: String,
    performanceMetrics: {
      accuracy: Number,
      speed: Number,
      consistency: Number
    }
  }
}, { 
  timestamps: true
});

UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;

