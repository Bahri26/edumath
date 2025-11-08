// backend-express/models/StudentProgress.js

const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  lessonNumber: {
    type: Number,
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId
  },
  title: String,
  isLocked: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 0
  },
  bestScore: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // saniye cinsinden
    default: 0
  },
  stars: {
    type: Number, // 0-3 yıldız
    default: 0,
    min: 0,
    max: 3
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastAttemptAt: {
    type: Date,
    default: null
  }
});

const unitProgressSchema = new mongoose.Schema({
  unitNumber: {
    type: Number,
    required: true
  },
  title: String,
  isUnlocked: {
    type: Boolean,
    default: false
  },
  lessons: [lessonProgressSchema],
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalXPEarned: {
    type: Number,
    default: 0
  }
});

const studentProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true
  },
  gradeLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 9
  },
  units: [unitProgressSchema],
  
  // Genel ilerleme metrikleri
  progress: {
    completedLessons: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalXPEarned: {
      type: Number,
      default: 0
    },
    currentUnit: {
      type: Number,
      default: 1
    },
    currentLesson: {
      type: Number,
      default: 1
    },
    averageScore: {
      type: Number,
      default: 0
    },
    totalStars: {
      type: Number,
      default: 0
    }
  },
  
  // Öğrenme istatistikleri
  stats: {
    totalTimeSpent: {
      type: Number, // saniye
      default: 0
    },
    averageTimePerLesson: {
      type: Number,
      default: 0
    },
    totalAttempts: {
      type: Number,
      default: 0
    },
    perfectScores: {
      type: Number, // 100 puan alınan ders sayısı
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    }
  },
  
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// İndeksler
studentProgressSchema.index({ studentId: 1, pathId: 1 }, { unique: true });
studentProgressSchema.index({ studentId: 1, gradeLevel: 1 });

// İlerleme yüzdesini hesapla
studentProgressSchema.methods.calculateProgress = function() {
  const totalLessons = this.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completedLessons = this.units.reduce((sum, unit) => 
    sum + unit.lessons.filter(lesson => lesson.isCompleted).length, 0
  );
  
  this.progress.totalLessons = totalLessons;
  this.progress.completedLessons = completedLessons;
  this.progress.completionPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;
  
  // Ortalama skoru hesapla
  const allScores = this.units.flatMap(unit => 
    unit.lessons.filter(l => l.isCompleted).map(l => l.score)
  );
  this.progress.averageScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;
  
  // Toplam yıldız sayısı
  this.progress.totalStars = this.units.reduce((sum, unit) => 
    sum + unit.lessons.reduce((s, l) => s + l.stars, 0), 0
  );
};

// Bir dersi tamamla
studentProgressSchema.methods.completeLesson = function(unitNumber, lessonNumber, score, timeSpent) {
  const unit = this.units.find(u => u.unitNumber === unitNumber);
  if (!unit) return false;
  
  const lesson = unit.lessons.find(l => l.lessonNumber === lessonNumber);
  if (!lesson) return false;
  
  // Ders bilgilerini güncelle
  lesson.attempts += 1;
  lesson.lastAttemptAt = new Date();
  lesson.timeSpent += timeSpent;
  lesson.score = score;
  
  if (score > lesson.bestScore) {
    lesson.bestScore = score;
  }
  
  // İlk kez tamamlanıyorsa
  if (!lesson.isCompleted && score >= 60) { // 60+ geçer not
    lesson.isCompleted = true;
    lesson.completedAt = new Date();
    
    // Yıldız hesapla
    if (score >= 95) lesson.stars = 3;
    else if (score >= 80) lesson.stars = 2;
    else if (score >= 60) lesson.stars = 1;
    
    // Bir sonraki dersi aç
    const nextLesson = unit.lessons.find(l => l.lessonNumber === lessonNumber + 1);
    if (nextLesson) {
      nextLesson.isLocked = false;
    } else {
      // Ünitedeki tüm dersler bittiyse, bir sonraki üniteyi aç
      const nextUnit = this.units.find(u => u.unitNumber === unitNumber + 1);
      if (nextUnit) {
        nextUnit.isUnlocked = true;
        if (nextUnit.lessons[0]) {
          nextUnit.lessons[0].isLocked = false;
        }
      }
    }
  }
  
  // İstatistikleri güncelle
  unit.completionRate = Math.round(
    (unit.lessons.filter(l => l.isCompleted).length / unit.lessons.length) * 100
  );
  
  this.calculateProgress();
  this.lastActivity = new Date();
  
  return true;
};

// Sonraki yapılabilir dersi bul
studentProgressSchema.methods.getNextLesson = function() {
  for (const unit of this.units) {
    if (!unit.isUnlocked) break;
    
    for (const lesson of unit.lessons) {
      if (!lesson.isLocked && !lesson.isCompleted) {
        return {
          unitNumber: unit.unitNumber,
          unitTitle: unit.title,
          lessonNumber: lesson.lessonNumber,
          lessonTitle: lesson.title
        };
      }
    }
  }
  return null;
};

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);
module.exports = StudentProgress;
