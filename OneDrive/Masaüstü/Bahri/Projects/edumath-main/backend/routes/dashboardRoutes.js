const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Öğrenci dashboard verisi
router.get('/student', authMiddleware, dashboardController.getStudentDashboardData);

module.exports = router;
