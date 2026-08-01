const express = require('express');
const router = express.Router();
const Joi = require('joi');
const userController = require('../controllers/userController'); // Controller'ı çağır
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).max(128).required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

// /api/users/search?query=ahmet
router.get('/search', userController.searchStudents);

// Bu rotalara girmek için Token şart (authMiddleware)
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), userController.changePassword);

// Hesap silme
router.delete('/delete', authMiddleware, userController.deleteAccount);
module.exports = router;