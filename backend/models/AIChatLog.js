const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const aiChatLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messages: { type: [aiMessageSchema], default: [] },
    lastInteractionAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: 'ai_chat_logs' }
);

aiChatLogSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('AIChatLog', aiChatLogSchema);
