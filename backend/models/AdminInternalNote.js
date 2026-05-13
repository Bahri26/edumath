const mongoose = require('mongoose');

const REF_TYPES = ['user', 'password_reset_request'];

const AdminInternalNoteSchema = new mongoose.Schema({
  refType: { type: String, enum: REF_TYPES, required: true, index: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 4000 },
}, { timestamps: true, collection: 'admin_internal_notes' });

AdminInternalNoteSchema.index({ refType: 1, refId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminInternalNote', AdminInternalNoteSchema);
