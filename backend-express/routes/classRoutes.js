// backend-express/routes/classRoutes.js (YENİ DOSYA)

const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const {
  createClass,
  getClassesByGrade,
  deleteClass
} = require('../controllers/classController');

// Koruma: Bu rotaların tamamı sadece giriş yapmış öğretmenler içindir
router.use(protect, checkRole('teacher'));

// GET /api/classes?gradeLevel=9  (Bir seviyedeki sınıfları getir)
// POST /api/classes              (Yeni bir sınıf oluştur)
router.route('/')
  .get(getClassesByGrade)
  .post(createClass);

// DELETE /api/classes/:id        (Bir sınıfı sil)
router.route('/:id')
  .delete(deleteClass);
// .put(updateClass); // -> Güncelleme eklenebilir

module.exports = router;