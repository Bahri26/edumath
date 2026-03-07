const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignmentsController');
const requireRole = require('../middleware/requireRole');

// only teachers and admins may create/update assignments
router.use(requireRole('teacher', 'admin'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
