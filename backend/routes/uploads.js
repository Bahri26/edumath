const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/uploadsController');

router.post('/image', requireRole('teacher', 'admin'), (req, res, next) => {
  ctrl.upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Yükleme başarısız.' });
    }
    return next();
  });
}, ctrl.uploadImage);

module.exports = router;
