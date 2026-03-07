const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/shopController');
const requireRole = require('../middleware/requireRole');

router.get('/items', ctrl.items);
router.get('/inventory', requireRole('student', 'teacher', 'admin'), ctrl.inventory);
router.post('/buy', requireRole('student', 'teacher', 'admin'), ctrl.buy);
router.put('/equip/:inventoryId', requireRole('student', 'teacher', 'admin'), ctrl.equip);

module.exports = router;
