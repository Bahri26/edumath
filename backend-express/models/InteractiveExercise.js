// backend-express/models/InteractiveExercise.js
const mongoose = require('mongoose');

const interactiveExerciseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  topic: {
    type: String,
    required: true,
    enum: [
      'arithmetic', 'algebra', 'geometry', 'patterns', 
      'fractions', 'decimals', 'percentages', 'equations',
      'word-problems', 'logic', 'statistics', 'probability'
    ]
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  gradeLevel: {
    type: Number,
    min: 1,
    max: 12,
    required: true
  },
  exerciseType: {
    type: String,
    required: true,
    enum: [
      'multiple-choice',
      'fill-in-blank',
      'drag-drop',
      'matching',
      'sorting',
      'drawing',
      'number-line',
      'fraction-visual',
      'graph-plot',
      'equation-builder'
    ]
  },
  questions: [{
    questionId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    text: {
      type: String,
      required: true
    },
    // Visual elements
    image: String,
    video: String,
    animation: String,
    
    // Interactive components
    interactiveData: {
      // For drag-drop
      draggableItems: [{
        id: String,
        content: String,
        category: String
      }],
      dropZones: [{
        id: String,
        accepts: [String],
        label: String
      }],
      
      // For matching
      leftItems: [{
        id: String,
        content: String
      }],
      rightItems: [{
        id: String,
        content: String
      }],
      correctPairs: [{
        left: String,
        right: String
      }],
      
      // For sorting
      itemsToSort: [{
        id: String,
        content: String,
        correctPosition: Number
      }],
      
      // For number line
      numberLine: {
        min: Number,
        max: Number,
        step: Number,
        correctValue: Number
      },
      
      // For graph plotting
      graphData: {
        xRange: [Number],
        yRange: [Number],
        correctPoints: [[Number]]
      }
    },
    
    // Answer options for multiple choice
    options: [{
      id: String,
      text: String,
      isCorrect: Boolean
    }],
    
    // Correct answer (for fill-in-blank, etc)
    correctAnswer: mongoose.Schema.Types.Mixed,
    
    // Hints (Duolingo-style)
    hints: [{
      cost: {
        type: Number,
        default: 10 // XP cost
      },
      text: String,
      revealed: {
        type: Boolean,
        default: false
      }
    }],
    
    // Explanation shown after answer
    explanation: String,
    explanationVideo: String,
    
    // Scoring
    points: {
      type: Number,
      default: 10
    },
    xpReward: {
      type: Number,
      default: 5
    },
    
    // Time limit (seconds)
    timeLimit: Number
  }],
  
  // Exercise settings
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    allowSkip: {
      type: Boolean,
      default: false
    },
    heartsRequired: {
      type: Number,
      default: 5
    }
  },
  
  // Completion requirements
  passingScore: {
    type: Number,
    default: 70
  },
  
  // Stats
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes
interactiveExerciseSchema.index({ topic: 1, difficulty: 1 });
interactiveExerciseSchema.index({ gradeLevel: 1 });
interactiveExerciseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('InteractiveExercise', interactiveExerciseSchema);
