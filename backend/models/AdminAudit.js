const mongoose = require('mongoose');

const AdminAuditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true }, // e.g., approve_reset, deny_reset, set_password, approve_user
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetEmail: { type: String },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PasswordResetRequest' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

AdminAuditSchema.index({ actorId: 1, createdAt: -1 });
AdminAuditSchema.index({ targetUserId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminAudit', AdminAuditSchema);
