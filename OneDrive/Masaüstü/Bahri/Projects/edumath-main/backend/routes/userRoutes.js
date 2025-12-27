const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Controller'ı çağır
const authMiddleware = require('../middlewares/authMiddleware');

// /api/users/search?query=ahmet
router.get('/search', userController.searchStudents);

// Bu rotalara girmek için Token şart (authMiddleware)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/change-password', authMiddleware, userController.changePassword);
module.exports = router;