const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const protect = require('../middlewares/authMiddleware');



// Listeleme
router.get('/', protect, studentController.getMyStudents);

// Detay Görüntüleme
router.get('/:id', protect, studentController.getStudentDetails);

module.exports = router;