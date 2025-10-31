// backend-express/routes/assignmentRoutes.js

const express = require('express');
const { createAssignment, getAssignmentsByTeacher } = require('../controllers/assignmentController');
const { protect, teacherCheck } = require('../middleware/authMiddleware'); // Öğretmen kontrolü varsayılır

const router = express.Router();

// POST /api/assignments - Yeni atama oluştur
router.post('/', protect, teacherCheck, createAssignment);

// GET /api/assignments - Öğretmenin tüm atamalarını getir
router.get('/', protect, teacherCheck, getAssignmentsByTeacher);


module.exports = router;