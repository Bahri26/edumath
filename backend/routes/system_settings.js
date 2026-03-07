const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/system_settingsController');

router.get('/', ctrl.list);
router.get('/by-key/:key', ctrl.getByKey);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/by-key/:key', ctrl.upsertByKey);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
