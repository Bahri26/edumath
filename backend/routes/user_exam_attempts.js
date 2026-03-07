const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user_exam_attemptsController');
const requireRole = require('../middleware/requireRole');

router.get('/', requireRole('admin', 'teacher'), ctrl.list);
router.get('/:id', requireRole('admin', 'teacher'), ctrl.getOne);
router.post('/', requireRole('admin', 'teacher'), ctrl.create);
router.put('/:id', requireRole('admin', 'teacher'), ctrl.update);
router.delete('/:id', requireRole('admin', 'teacher'), ctrl.remove);

module.exports = router;
