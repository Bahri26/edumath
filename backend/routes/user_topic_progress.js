const express = require('express');
const ctrl = require('../controllers/user_topic_progressController');
const router = express.Router();

// GET /api/user_topic_progress?user_id=123
router.get('/', ctrl.list);
// GET /api/user_topic_progress/:topicId?user_id=123
router.get('/:topicId', ctrl.getOne);
// POST /api/user_topic_progress/:topicId/review { correct: true }
router.post('/:topicId/review', ctrl.recordReview);

module.exports = router;
