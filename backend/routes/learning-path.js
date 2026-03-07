const express = require('express');
const router = express.Router();
// Reuse the existing learning_paths controller to support frontend path '/learning-path'
const ctrl = require('../controllers/learning_pathsController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, ctrl.list);
router.get('/daily', authenticate, ctrl.daily);
router.post('/daily/complete/:id', authenticate, ctrl.completeDaily);

module.exports = router;
