const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tüm rotalar giriş yapmış kullanıcı içindir
router.use(authMiddleware);

// Bildirim listesi (sayfalama ve filtreleme ile)
router.get('/', notificationController.getNotifications);

// Tüm bildirimleri okundu yap (parametreli rotadan önce olmalı)
router.put('/mark-all-read', notificationController.markAllAsRead);

// Bildirim okundu olarak işaretle
router.put('/:id/read', notificationController.markAsRead);

// Bildirim sil
router.delete('/:id', notificationController.deleteNotification);

// Tüm bildirimleri sil
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;
