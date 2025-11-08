// backend-express/routes/learningPathRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllPaths,
  getPathByGrade,
  createPath,
  initializePathForStudent,
  getMyProgress,
  getPathProgress,
  completeLesson,
  getNextLesson,
  updatePath,
  deletePath
} = require('../controllers/learningPathController');

// Teacher/Admin
router.post('/', protect, createPath);
router.put('/:pathId', protect, updatePath);
router.delete('/:pathId', protect, deletePath);

// General
router.get('/', protect, getAllPaths);
router.get('/grade/:gradeLevel', protect, getPathByGrade);

// Student
router.post('/:pathId/initialize', protect, initializePathForStudent);
router.get('/my-progress', protect, getMyProgress);
router.get('/:pathId/progress', protect, getPathProgress);
router.post('/:pathId/complete-lesson', protect, completeLesson);
router.get('/:pathId/next-lesson', protect, getNextLesson);

module.exports = router;