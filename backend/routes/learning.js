const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/learningController');
const authenticate = require('../middleware/authenticate');

router.get('/next', authenticate, ctrl.next);
router.post('/answer', authenticate, ctrl.answer);
router.post('/activity', authenticate, ctrl.activity);
router.get('/progress', authenticate, ctrl.progress);

module.exports = router;