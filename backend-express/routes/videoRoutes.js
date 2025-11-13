// backend-express/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  listVideos,
  getVideo,
  incrementView,
  getPopularVideos,
  getVideosByTopic,
  createVideo,
  updateVideo,
  deleteVideo,
  getTopicsList
} = require('../controllers/videoController');

// Public routes
router.get('/', listVideos);
router.get('/popular', getPopularVideos);
router.get('/topics/list', getTopicsList);
router.get('/topic/:topic', getVideosByTopic);
router.get('/:id', getVideo);

// Protected routes
router.post('/:id/view', protect, incrementView);
router.post('/', protect, createVideo); // Teacher/Admin only (add role check if needed)
router.put('/:id', protect, updateVideo); // Teacher/Admin only
router.delete('/:id', protect, deleteVideo); // Admin only

module.exports = router;
