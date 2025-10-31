// backend-express/routes/studentRoutes.js

const express = require('express');
const { getAssignedExams } = require('../controllers/studentController');
const { protect, studentCheck } = require('../middleware/authMiddleware'); // Öğrenci kontrolü varsayılır

const router = express.Router();

// GET /api/student/assignments - Öğrenci için atanmış sınavları listeler
router.get('/assignments', protect, studentCheck, getAssignedExams);


module.exports = router;