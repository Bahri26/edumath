const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hashedToken: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  replacedByToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
