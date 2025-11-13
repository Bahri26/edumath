// backend-express/controllers/socialController.js
const Friend = require('../models/social/Friend');
const Challenge = require('../models/social/Challenge');
const User = require('../models/User');
const Question = require('../models/Question');

// === FRIEND SYSTEM ===

// POST /api/social/friends/request - Send friend request
const sendFriendRequest = async (req, res) => {
  try {
    const { friendEmail } = req.body;
    
    // Find friend by email
    const friend = await User.findOne({ email: friendEmail });
    if (!friend) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    
    if (friend._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Kendinize arkadaşlık isteği gönderemezsiniz.' });
    }
    
    await Friend.sendRequest(req.user._id, friend._id);
    
    res.json({ message: 'Arkadaşlık isteği gönderildi!', friend: { name: friend.name, email: friend.email } });
  } catch (err) {
    if (err.message === 'Friend request already exists') {
      return res.status(400).json({ message: 'Arkadaşlık isteği zaten mevcut.' });
    }
    console.error('Send friend request error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/social/friends/accept/:friendId - Accept friend request
const acceptFriendRequest = async (req, res) => {
  try {
    const success = await Friend.acceptRequest(req.user._id, req.params.friendId);
    
    if (!success) {
      return res.status(404).json({ message: 'Arkadaşlık isteği bulunamadı.' });
    }
    
    res.json({ message: 'Arkadaşlık isteği kabul edildi!' });
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/social/friends/:friendId - Remove friend
const removeFriend = async (req, res) => {
  try {
    await Friend.removeFriend(req.user._id, req.params.friendId);
    res.json({ message: 'Arkadaş kaldırıldı.' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/social/friends - Get friends list
const getFriends = async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user._id);
    res.json({ friends });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/social/friends/pending - Get pending friend requests
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Friend.getPendingRequests(req.user._id);
    res.json({ requests });
  } catch (err) {
    console.error('Get pending requests error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// === CHALLENGE SYSTEM ===

// POST /api/social/challenges/create - Create a challenge
const createChallenge = async (req, res) => {
  try {
    const { opponentId, topic, difficulty, questionsCount } = req.body;
    
    // Check if opponent exists and is a friend
    const friendship = await Friend.findOne({
      userId: req.user._id,
      friendId: opponentId,
      status: 'accepted'
    });
    
    if (!friendship) {
      return res.status(400).json({ message: 'Sadece arkadaşlarınıza challenge gönderebilirsiniz.' });
    }
    
    const challenge = await Challenge.create({
      challenger: req.user._id,
      opponent: opponentId,
      topic,
      difficulty,
      questionsCount: questionsCount || 5,
      xpReward: (questionsCount || 5) * (difficulty === 'Kolay' ? 10 : difficulty === 'Orta' ? 20 : 30)
    });
    
    await challenge.populate(['challenger', 'opponent'], 'name email');
    
    res.json({ message: 'Challenge gönderildi!', challenge });
  } catch (err) {
    console.error('Create challenge error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/social/challenges/:id/accept - Accept a challenge
const acceptChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge bulunamadı.' });
    }
    
    if (challenge.opponent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu challenge sizin için değil.' });
    }
    
    await challenge.accept();
    
    res.json({ message: 'Challenge kabul edildi!', challenge });
  } catch (err) {
    console.error('Accept challenge error:', err);
    res.status(500).json({ message: err.message || 'Sunucu hatası.' });
  }
};

// POST /api/social/challenges/:id/decline - Decline a challenge
const declineChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge bulunamadı.' });
    }
    
    if (challenge.opponent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu challenge sizin için değil.' });
    }
    
    await challenge.decline();
    
    res.json({ message: 'Challenge reddedildi.' });
  } catch (err) {
    console.error('Decline challenge error:', err);
    res.status(500).json({ message: err.message || 'Sunucu hatası.' });
  }
};

// POST /api/social/challenges/:id/submit - Submit challenge score
const submitChallengeScore = async (req, res) => {
  try {
    const { correct, wrong, timeSpent } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge bulunamadı.' });
    }
    
    if (challenge.status !== 'accepted') {
      return res.status(400).json({ message: 'Challenge henüz kabul edilmedi.' });
    }
    
    const userId = req.user._id;
    if (userId.toString() !== challenge.challenger.toString() && 
        userId.toString() !== challenge.opponent.toString()) {
      return res.status(403).json({ message: 'Bu challenge sizin değil.' });
    }
    
    await challenge.submitScore(userId, { correct, wrong, timeSpent });
    
    await challenge.populate(['challenger', 'opponent', 'winner'], 'name email');
    
    res.json({ 
      message: 'Skorunuz kaydedildi!', 
      challenge,
      isCompleted: challenge.status === 'completed',
      winner: challenge.winner
    });
  } catch (err) {
    console.error('Submit challenge score error:', err);
    res.status(500).json({ message: err.message || 'Sunucu hatası.' });
  }
};

// GET /api/social/challenges/my - Get my challenges
const getMyChallenges = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {
      $or: [
        { challenger: req.user._id },
        { opponent: req.user._id }
      ]
    };
    
    if (status) {
      filter.status = status;
    }
    
    const challenges = await Challenge.find(filter)
      .populate('challenger opponent winner', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ challenges });
  } catch (err) {
    console.error('Get my challenges error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/social/challenges/:id/questions - Get questions for challenge
const getChallengeQuestions = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge bulunamadı.' });
    }
    
    // Check if user is part of challenge
    if (challenge.challenger.toString() !== req.user._id.toString() && 
        challenge.opponent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu challenge sizin değil.' });
    }
    
    // Get random questions
    const questions = await Question.find({
      topic: challenge.topic,
      difficulty: challenge.difficulty
    })
    .limit(challenge.questionsCount)
    .select('-correctAnswer'); // Don't send correct answer
    
    res.json({ questions, challenge });
  } catch (err) {
    console.error('Get challenge questions error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/social/leaderboard/friends - Friends leaderboard
const getFriendsLeaderboard = async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user._id);
    const friendIds = friends.map(f => f._id);
    friendIds.push(req.user._id); // Include self
    
    const Progress = require('../models/gamification/Progress');
    
    const leaderboard = await Progress.aggregate([
      { $match: { userId: { $in: friendIds } } },
      { $group: {
        _id: '$userId',
        totalXP: { $sum: '$xpEarned' },
        exercisesCompleted: { $sum: 1 }
      }},
      { $sort: { totalXP: -1 } },
      { $limit: 50 }
    ]);
    
    // Populate user details
    await User.populate(leaderboard, { path: '_id', select: 'name email' });
    
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      user: entry._id,
      totalXP: entry.totalXP,
      exercisesCompleted: entry.exercisesCompleted
    }));
    
    res.json({ leaderboard: formattedLeaderboard });
  } catch (err) {
    console.error('Get friends leaderboard error:', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  submitChallengeScore,
  getMyChallenges,
  getChallengeQuestions,
  getFriendsLeaderboard
};

