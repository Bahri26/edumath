// backend-express/models/VideoResource.js
const mongoose = require('mongoose');

const videoResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  youtubeId: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Kolay', 'Orta', 'Zor', 'Tümü'],
    default: 'Tümü'
  },
  classLevel: {
    type: String,
    enum: ['5', '6', '7', '8', 'Tümü'],
    default: 'Tümü'
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  thumbnailUrl: {
    type: String
  },
  channelName: {
    type: String,
    default: 'EduMath'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  language: {
    type: String,
    default: 'tr'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
videoResourceSchema.index({ topic: 1, difficulty: 1 });
videoResourceSchema.index({ classLevel: 1 });
videoResourceSchema.index({ isActive: 1 });

// Virtual for YouTube embed URL
videoResourceSchema.virtual('embedUrl').get(function() {
  return `https://www.youtube.com/embed/${this.youtubeId}`;
});

// Virtual for YouTube watch URL
videoResourceSchema.virtual('watchUrl').get(function() {
  return `https://www.youtube.com/watch?v=${this.youtubeId}`;
});

// Instance method to increment view count
videoResourceSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
  return this;
};

// Static method to get popular videos
videoResourceSchema.statics.getPopularVideos = async function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ viewCount: -1 })
    .limit(limit);
};

// Static method to get videos by topic
videoResourceSchema.statics.getByTopic = async function(topic, options = {}) {
  const { difficulty, classLevel, limit = 20 } = options;
  
  const filter = { topic, isActive: true };
  
  if (difficulty && difficulty !== 'Tümü') {
    filter.$or = [
      { difficulty },
      { difficulty: 'Tümü' }
    ];
  }
  
  if (classLevel && classLevel !== 'Tümü') {
    filter.$or = filter.$or || [];
    filter.$or.push(
      { classLevel },
      { classLevel: 'Tümü' }
    );
  }
  
  return this.find(filter)
    .sort({ viewCount: -1 })
    .limit(limit);
};

// Ensure virtuals are included in JSON
videoResourceSchema.set('toJSON', { virtuals: true });
videoResourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VideoResource', videoResourceSchema);
