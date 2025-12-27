


const express = require('express');
const router = express.Router();

const pdfController = require('../controllers/pdfController');
const multer = require('multer');
const uploadPdf = multer({ dest: 'uploads/temp/' });
// 6. PDF'den Soru Yükleme (AI'sız, sadece metin)
router.post('/upload-pdf', uploadPdf.single('pdf'), pdfController.extractQuestionsFromPdf);

const questionController = require('../controllers/questionController');
const path = require('path');
const fs = require('fs');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

// --- MULTER AYARLARI (Dosya Yükleme) ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { 
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});

// .any() ile hem ana resim (image) hem şık resimlerini (optionImage_0...) kabul ediyoruz
const upload = multer({ storage: storage });


// --- ROUTE TANIMLARI ---

// 1. Listeleme (Tüm giriş yapmış kullanıcılar)
router.get('/', protect, questionController.getQuestions);

// 1.5. Öğretmen sorularını getir (Öğretmen için özel endpoint)
router.get('/teacher/my-questions', protect, role(['teacher', 'admin']), questionController.getTeacherQuestions);

// 2. AI Toplu Ekleme (Sadece öğretmen/admin)
router.post('/batch', protect, role(['teacher', 'admin']), questionController.batchCreateQuestions);

// 3. Manuel Yeni Ekleme (Sadece öğretmen/admin)
router.post('/', protect, role(['teacher', 'admin']), upload.any(), questionController.createQuestion);

// 4. Güncelleme (Sadece öğretmen/admin)
router.put('/:id', protect, role(['teacher', 'admin']), upload.any(), questionController.updateQuestion);

// 5. Silme (Sadece öğretmen/admin)
router.delete('/:id', protect, role(['teacher', 'admin']), questionController.deleteQuestion);

module.exports = router;