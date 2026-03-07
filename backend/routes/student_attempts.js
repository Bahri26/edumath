const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/student_attemptsController');
const requireRole = require('../middleware/requireRole');

// allow students, teachers and admins
router.use(requireRole('student', 'teacher', 'admin'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
