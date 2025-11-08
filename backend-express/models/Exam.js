const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Sınav başlığı zorunludur.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  duration: {
    type: Number,
    required: [true, 'Sınav süresi zorunludur.'],
    min: 1
  },
  category: {
    type: String,
    required: [true, 'Sınav kategorisi zorunludur.']
  },
  difficulty: {
    type: String,
    enum: ['Kolay', 'Orta', 'Zor'],
    default: 'Orta'
  },
  passMark: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  allowRetake: {
    type: Boolean,
    default: false
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  associatedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    lowestScore: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

ExamSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isPublished) return 'Taslak';
  if (this.startDate && now < this.startDate) return 'Planlandı';
  if (this.endDate && now > this.endDate) return 'Sona Erdi';
  return 'Aktif';
});

ExamSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  if (hours > 0) {
    return hours + ' saat ' + minutes + ' dakika';
  }
  return minutes + ' dakika';
});

ExamSchema.methods.publish = function() {
  this.isPublished = true;
  this.isActive = true;
  return this.save();
};

ExamSchema.methods.close = function() {
  this.isActive = false;
  return this.save();
};

ExamSchema.methods.updateStatistics = async function() {
  const Result = mongoose.model('Result');
  const results = await Result.find({ examId: this._id });
  
  if (results.length > 0) {
    const scores = results.map(r => r.score);
    this.statistics.totalAttempts = results.length;
    this.statistics.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    this.statistics.highestScore = Math.max(...scores);
    this.statistics.lowestScore = Math.min(...scores);
    this.statistics.completionRate = (results.filter(r => r.completed).length / results.length) * 100;
  }
  
  return this.save();
};

module.exports = mongoose.model('Exam', ExamSchema);
