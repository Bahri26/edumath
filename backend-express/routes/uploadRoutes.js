// backend-express/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { protect, teacherCheck } = require('../middleware/authMiddleware');
const {
  uploadProfile,
  uploadQuestion,
  uploadVideo,
  uploadMultipleQuestions,
  handleUploadError
} = require('../middleware/uploadMiddleware');
const {
  uploadProfilePicture,
  uploadQuestionImage,
  uploadMultipleQuestionImages,
  uploadVideo: uploadVideoController,
  deleteFile,
  getFileInfo
} = require('../controllers/uploadController');

// All upload routes require authentication
router.use(protect);

/**
 * Profile picture upload
 * POST /api/upload/profile
 * Body: FormData with 'profile' field
 * Max size: 5MB
 * Allowed: JPEG, PNG, GIF, WebP
 */
router.post('/profile', uploadProfile, handleUploadError, uploadProfilePicture);

/**
 * Question image upload (single)
 * POST /api/upload/question
 * Body: FormData with 'question' field
 * Max size: 10MB
 * Allowed: JPEG, PNG, GIF, WebP
 * Access: Teacher only
 */
router.post('/question', teacherCheck, uploadQuestion, handleUploadError, uploadQuestionImage);

/**
 * Question images upload (multiple)
 * POST /api/upload/questions-multiple
 * Body: FormData with 'questions' field (array)
 * Max files: 10
 * Max size per file: 10MB
 * Allowed: JPEG, PNG, GIF, WebP
 * Access: Teacher only
 */
router.post('/questions-multiple', teacherCheck, uploadMultipleQuestions, handleUploadError, uploadMultipleQuestionImages);

/**
 * Video upload
 * POST /api/upload/video
 * Body: FormData with 'video' field
 * Max size: 100MB
 * Allowed: MP4, MPEG, MOV, AVI, WebM
 * Access: Teacher only
 */
router.post('/video', teacherCheck, uploadVideo, handleUploadError, uploadVideoController);

/**
 * Delete file
 * DELETE /api/upload/:type/:filename
 * Params: type (profiles|questions|videos), filename
 */
router.delete('/:type/:filename', deleteFile);

/**
 * Get file info
 * GET /api/upload/info/:type/:filename
 * Params: type (profiles|questions|videos), filename
 */
router.get('/info/:type/:filename', getFileInfo);

module.exports = router;
