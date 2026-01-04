const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  title: { 
    type: String, 
    required: true 
  },
  
  message: { 
    type: String, 
    required: true 
  },
  
  type: { 
    type: String, 
    enum: ['assignment', 'exam', 'survey', 'message', 'grade', 'system'], 
    default: 'system' 
  },
  
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  relatedModel: {
    type: String,
    enum: ['Assignment', 'Exam', 'Survey', 'Message', 'Question'],
    default: null
  },
  
  actionUrl: { 
    type: String 
  },
  
  isRead: { 
    type: Boolean, 
    default: false,
    index: true
  },
  
  readAt: {
    type: Date
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, { timestamps: true });

// Indexing for faster queries
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);