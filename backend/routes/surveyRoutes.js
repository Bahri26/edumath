const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

// TÜM ANKETLERİ GETİR (Korumalı)
router.get('/', protect, async (req, res) => {
  try {
    let surveys;
    if (req.user.role === 'teacher') {
      // Öğretmen kendi anketlerini görsün
      surveys = await Survey.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      // Öğrenci aktif anketleri görsün
      surveys = await Survey.find({ status: 'active' }).sort({ createdAt: -1 });
    } else {
      surveys = await Survey.find().sort({ createdAt: -1 });
    }
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// YENİ ANKET OLUŞTUR (Sadece Öğretmen)
router.post('/', protect, role(['teacher']), async (req, res) => {
  try {
    const newSurvey = new Survey({
      ...req.body,
      createdBy: req.user.id
    });
    const savedSurvey = await newSurvey.save();
    res.status(201).json(savedSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ANKET GÜNCELLE (Sadece Öğretmen)
router.put('/:id', protect, role(['teacher']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Anket bulunamadı' });
    if (survey.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu anketi düzenleye yetkiniz yok' });
    }
    
    const updatedSurvey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ANKET SİL (Sadece Öğretmen)
router.delete('/:id', protect, role(['teacher']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Anket bulunamadı' });
    if (survey.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu anketi silemezsiniz' });
    }
    
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ message: 'Silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CEVAP GÖNDER (Öğrenci)
router.post('/:id/respond', protect, role(['student']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: "Anket bulunamadı" });

    survey.responses.push({
      studentId: req.user.id,
      answers: req.body.answers
    });
    
    await survey.save();
    res.json({ message: "Cevap kaydedildi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;