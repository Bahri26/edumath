const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const meController = require('../controllers/meController');

router.get('/teachers', protect, role(['student']), meController.getMyTeachers);
router.get('/flashcards', protect, role(['student']), meController.getFlashcards);

module.exports = router;
