// backend-express/models/LearningPath.js

const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  lessonNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  objectiveId: {
    type: String, // MEB kazanım ID'si (örn: "4-A-1")
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'complete-the-sequence',
      'build-the-pattern', 
      'whats-the-rule',
      'next-shape',
      'find-the-algebraic-rule',
      'multiple-choice',
      'fill-in-blank',
      'drag-and-drop',
      'matching',
      'interactive-simulation'
    ],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Kolay', 'Orta', 'Zor'],
    default: 'Orta'
  },
  xpReward: {
    type: Number,
    default: 10
  },
  gemReward: {
    type: Number,
    default: 1
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  unlockRequirements: {
    previousLessonCompleted: {
      type: Boolean,
      default: true
    },
    minScore: {
      type: Number,
      default: 0 // Önceki dersten minimum skor
    }
  },
  isLocked: {
    type: Boolean,
    default: true
  }
});

const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: '📐' // Emoji veya icon ismi
  },
  color: {
    type: String,
    default: '#4834d4'
  },
  lessons: [lessonSchema],
  totalXP: {
    type: Number,
    default: 0
  },
  isUnlocked: {
    type: Boolean,
    default: false
  }
});

const learningPathSchema = new mongoose.Schema({
  gradeLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 9 // 1. sınıftan 9. sınıfa kadar
  },
  subject: {
    type: String,
    default: 'Matematik',
    trim: true
  },
  topic: {
    type: String,
    default: 'Örüntüler',
    trim: true
  },
  units: [unitSchema],
  totalLessons: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: String, // "4 hafta", "10 ders" gibi
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Toplam ders sayısını otomatik hesapla
learningPathSchema.pre('save', function(next) {
  this.totalLessons = this.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  
  // Her ünitenin toplam XP'sini hesapla
  this.units.forEach(unit => {
    unit.totalXP = unit.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
  });
  
  next();
});

// Öğrenci için path'i kopyala ve kişiselleştir
learningPathSchema.methods.initializeForStudent = function(studentId) {
  const studentPath = {
    studentId: studentId,
    pathId: this._id,
    gradeLevel: this.gradeLevel,
    units: this.units.map((unit, unitIndex) => ({
      unitNumber: unit.unitNumber,
      title: unit.title,
      isUnlocked: unitIndex === 0, // İlk ünite açık
      lessons: unit.lessons.map((lesson, lessonIndex) => ({
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        isLocked: !(unitIndex === 0 && lessonIndex === 0), // İlk ders açık
        isCompleted: false,
        score: 0,
        attempts: 0,
        completedAt: null
      }))
    })),
    progress: {
      completedLessons: 0,
      totalXP: 0,
      currentUnit: 1,
      currentLesson: 1
    }
  };
  
  return studentPath;
};

const LearningPath = mongoose.model('LearningPath', learningPathSchema);
module.exports = LearningPath;
