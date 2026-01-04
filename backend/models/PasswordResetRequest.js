const mongoose = require('mongoose');

const PasswordResetRequestSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  note: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending', index: true },
  requesterUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approverUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tokenIssued: { type: Boolean, default: false },
  issuedTokenHash: { type: String },
  expiresAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
