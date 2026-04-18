const fs = require('fs');
const Question = require('../models/Question');
const { uploadBuffer } = require('../services/storageService');

exports.uploadAndProcess = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Lütfen bir resim yükleyin.' });

    const imageBuffer = req.file.buffer || fs.readFileSync(req.file.path);
    const { classLevel = '9. Sınıf' } = req.body;
    const uploaded = await uploadBuffer(imageBuffer, {
      originalName: req.file.originalname || 'vision-upload.png',
      mimeType: req.file.mimetype,
      prefix: 'vision-uploads',
    });

    // AI devre dışı — görseli manuel soru olarak kaydet
    const saved = await Question.create({
      text: 'Görselden alınan soru (AI bağlı değil, metni düzenleyin)',
      image: uploaded.url,
      imageKey: uploaded.key,
      imageProvider: uploaded.provider,
      subject: 'Matematik',
      classLevel,
      difficulty: 'Orta',
      type: 'multiple-choice',
      options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
      correctAnswer: '',
      source: 'Manuel'
    });
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(201).json({ success: true, data: saved, message: 'AI kapalı; görsel kaydedildi, metni elle tamamlayın.' });
    // Not using AI parsing here; advanced crop/parse removed
    // Clean temp file will be handled by upload middleware elsewhere if needed
    
    // No further processing; return early above
  } catch (error) {
    console.error('uploadAndProcess error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Görsel işlenemedi.', error: error?.message });
  }
};
