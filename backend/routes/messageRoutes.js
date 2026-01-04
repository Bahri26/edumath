const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tüm rotalar giriş yapmış kullanıcı içindir
router.use(authMiddleware);

// Konuşmaları getir
router.get('/conversations', messageController.getConversations);

// Konuşmanın mesajlarını getir
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Mesaj gönder
router.post('/send', messageController.sendMessage);

// Mesajı oku
router.put('/:messageId/read', messageController.markAsRead);

// Konuşmadaki tüm mesajları oku
router.put('/conversations/:conversationId/read', messageController.markConversationAsRead);

// Mesajı düzenle
router.put('/:messageId', messageController.editMessage);

// Mesajı sil
router.delete('/:messageId', messageController.deleteMessage);

// Okunmamış mesajları say
router.get('/unread-count', messageController.getUnreadCount);

module.exports = router;
