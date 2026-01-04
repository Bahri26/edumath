const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participantIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastMessageAt: {
      type: Date
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    subject: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for faster queries
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
