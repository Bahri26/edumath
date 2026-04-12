const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Question = require('../models/Question');

// Helper: map label to index
function labelToIndex(label) {
  const idx = ['A','B','C','D'].indexOf(String(label).toUpperCase());
  return idx >= 0 ? idx : 0;
}

exports.uploadAndProcess = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Lütfen bir resim yükleyin.' });

    const imagePath = req.file.path; // temp path from multer
    const imageBuffer = fs.readFileSync(imagePath);
    const { classLevel = '9. Sınıf' } = req.body;

    // AI devre dışı — görseli manuel soru olarak kaydet
    const filename = path.basename(imagePath);
    const saved = await Question.create({
      text: 'Görselden alınan soru (AI bağlı değil, metni düzenleyin)',
      image: `/uploads/${filename}`,
      subject: 'Matematik',
      classLevel,
      difficulty: 'Orta',
      type: 'multiple-choice',
      options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
      correctAnswer: '',
      source: 'Manuel'
    });
    return res.status(201).json({ success: true, data: saved, message: 'AI kapalı; görsel kaydedildi, metni elle tamamlayın.' });
    // Not using AI parsing here; advanced crop/parse removed
    // Clean temp file will be handled by upload middleware elsewhere if needed
    
    // No further processing; return early above
  } catch (error) {
    console.error('uploadAndProcess error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Görsel işlenemedi.', error: error?.message });
  }
};
