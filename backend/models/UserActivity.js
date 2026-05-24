const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, trim: true, index: true },
    userName: { type: String, trim: true },
    userRole: { type: String, enum: ['student', 'teacher', 'admin', ''], default: '' },

    action: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['auth', 'content', 'learning', 'admin', 'system'],
      default: 'system',
      index: true,
    },
    summary: { type: String, required: true },

    targetType: { type: String, default: '' },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetLabel: { type: String, default: '' },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true, collection: 'user_activities' }
);

UserActivitySchema.index({ createdAt: -1 });
UserActivitySchema.index({ userId: 1, createdAt: -1 });
UserActivitySchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);
