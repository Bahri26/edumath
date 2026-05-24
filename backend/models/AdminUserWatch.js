const mongoose = require('mongoose');

const AdminUserWatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    note: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'admin_user_watches' }
);

module.exports = mongoose.model('AdminUserWatch', AdminUserWatchSchema);
