// backend-express/routes/socialRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/socialController');

// All routes require authentication
router.use(protect);

// === FRIEND ROUTES ===
router.post('/friends/request', sendFriendRequest);
router.post('/friends/accept/:friendId', acceptFriendRequest);
router.delete('/friends/:friendId', removeFriend);
router.get('/friends', getFriends);
router.get('/friends/pending', getPendingRequests);

// === CHALLENGE ROUTES ===
router.post('/challenges/create', createChallenge);
router.post('/challenges/:id/accept', acceptChallenge);
router.post('/challenges/:id/decline', declineChallenge);
router.post('/challenges/:id/submit', submitChallengeScore);
router.get('/challenges/my', getMyChallenges);
router.get('/challenges/:id/questions', getChallengeQuestions);

// === LEADERBOARD ===
router.get('/leaderboard/friends', getFriendsLeaderboard);

module.exports = router;
