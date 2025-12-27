const express = require('express');
const multer = require('multer');
const { analyzePdfWithGemini } = require('../services/geminiService');

const router = express.Router();

// Dosyayı hafızada (RAM) tut, diske kaydetme (Hızlı olsun diye)
const upload = multer({ storage: multer.memoryStorage() });

router.post('/pdf-ai', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Lütfen bir PDF dosyası yükleyin." });
    }

    // AI Servisine gönder
    console.log("PDF Analiz ediliyor... Bu işlem 10-20 saniye sürebilir.");
    const questions = await analyzePdfWithGemini(req.file.buffer);

    res.json({ 
        success: true, 
        message: `${questions.length} soru başarıyla ayıklandı.`,
        data: questions 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "İşlem başarısız oldu.", error: error.message });
  }
});

module.exports = router;
