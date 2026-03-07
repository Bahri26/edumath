const express = require('express');
const router = express.Router();
// Reuse the existing learning_paths controller to support frontend path '/learning-path'
const ctrl = require('../controllers/learning_pathsController');

router.get('/', ctrl.list);
router.get('/daily', ctrl.daily);

module.exports = router;
