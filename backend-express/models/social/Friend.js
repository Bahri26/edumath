// backend-express/models/social/Friend.js
const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  friendId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date }
});

// Compound index to prevent duplicate friendships
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

// Static method to send friend request
friendSchema.statics.sendRequest = async function(fromUserId, toUserId) {
  // Check if friendship already exists
  const existing = await this.findOne({
    $or: [
      { userId: fromUserId, friendId: toUserId },
      { userId: toUserId, friendId: fromUserId }
    ]
  });

  if (existing) {
    throw new Error('Friend request already exists');
  }

  // Create bidirectional friendship (pending)
  await this.create([
    {
      userId: fromUserId,
      friendId: toUserId,
      status: 'pending',
      requestedBy: fromUserId
    },
    {
      userId: toUserId,
      friendId: fromUserId,
      status: 'pending',
      requestedBy: fromUserId
    }
  ]);

  return true;
};

// Static method to accept friend request
friendSchema.statics.acceptRequest = async function(userId, friendId) {
  const result = await this.updateMany(
    {
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ],
      status: 'pending'
    },
    {
      $set: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    }
  );

  return result.modifiedCount > 0;
};

// Static method to remove friendship
friendSchema.statics.removeFriend = async function(userId, friendId) {
  await this.deleteMany({
    $or: [
      { userId, friendId },
      { userId: friendId, friendId: userId }
    ]
  });

  return true;
};

// Static method to get friends list
friendSchema.statics.getFriends = async function(userId) {
  const friends = await this.find({
    userId,
    status: 'accepted'
  }).populate('friendId', 'name email');

  return friends.map(f => f.friendId);
};

// Static method to get pending requests
friendSchema.statics.getPendingRequests = async function(userId) {
  const requests = await this.find({
    userId,
    status: 'pending',
    requestedBy: { $ne: userId } // Requests sent TO this user
  }).populate('friendId', 'name email');

  return requests.map(r => ({
    requestId: r._id,
    user: r.friendId,
    createdAt: r.createdAt
  }));
};

module.exports = mongoose.model('Friend', friendSchema);
