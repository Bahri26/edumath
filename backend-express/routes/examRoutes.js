// backend-express/routes/examRoutes.js

const express = require('express');
const { createExam, getExams } = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

// POST /api/exams  -> Yeni sınav oluştur (7 kolay, 7 orta, 7 zor kuralının uygulanacağı yer)
// GET /api/exams   -> Tüm sınavları listele

router.route('/')
    .get(protect, getExams) // Tüm sınavları görmek için yetkili olmalı
    .post(protect, createExam); // Sınav oluşturmak için yetkili olmalı

// Diğer route'lar (örn: Sınavı başlatma, sonuçları kaydetme) daha sonra eklenecek.

module.exports = router;