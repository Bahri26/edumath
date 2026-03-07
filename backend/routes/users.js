const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usersController');
const { validateCreate, validateUpdate } = require('../validators/usersValidator');
const requireRole = require('../middleware/requireRole');

router.get('/', requireRole('admin'), ctrl.list);
// Authenticated current user
router.get('/me', requireRole('student', 'teacher', 'admin'), ctrl.me);
router.put('/me', requireRole('student', 'teacher', 'admin'), ctrl.updateMe);
router.get('/:id', requireRole('admin'), ctrl.getOne);
router.post('/', requireRole('admin'), validateCreate, ctrl.create);
// allow authenticated users to set their theme preference
router.put('/theme', requireRole('student', 'teacher', 'admin'), ctrl.updateTheme);
router.put('/:id', requireRole('admin'), validateUpdate, ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
