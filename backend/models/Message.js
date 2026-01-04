const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    attachments: [{
      type: String,
      url: String
    }],
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    editedAt: {
      type: Date
    },
    deletedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
