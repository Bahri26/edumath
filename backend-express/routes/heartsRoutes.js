// backend-express/routes/heartsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getHearts,
  loseHeart,
  refillHearts,
  buyUnlimitedHearts,
  practiceRestore,
  getHeartHistory
} = require('../controllers/heartsController');

// All routes require authentication
router.use(protect);

router.get('/', getHearts);
router.post('/lose', loseHeart);
router.post('/refill', refillHearts);
router.post('/buy-unlimited', buyUnlimitedHearts);
router.post('/practice-restore', practiceRestore);
router.get('/history', getHeartHistory);

module.exports = router;
