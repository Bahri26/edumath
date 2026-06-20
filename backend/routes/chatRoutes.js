const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const protect = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// POST /api/chat — yalnızca giriş yapmış kullanıcılar
router.post('/', protect, roleMiddleware(['student', 'teacher', 'admin']), chatController.chatWithAI);

module.exports = router;
