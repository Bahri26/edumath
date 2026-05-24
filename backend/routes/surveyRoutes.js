const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { ensureStudentLinkedToTeacher } = require('../utils/studentRosterSync');
const { recordUserActivity } = require('../services/activityLogger');
const User = require('../models/User');

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

    const teacher = await User.findById(req.user.id).select('name email role').lean();
    await recordUserActivity(req, {
      user: teacher,
      action: 'survey_create',
      category: 'content',
      summary: `Anket oluşturdu: ${savedSurvey.title || 'Anket'}`,
      targetType: 'survey',
      targetId: savedSurvey._id,
      targetLabel: savedSurvey.title || '',
    });

    res.status(201).json(savedSurvey);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ÖĞRENCİ: Cevaplanabilir anketler (aktif + daha önce cevaplamadıkları)
router.get('/student/available', protect, role(['student']), async (req, res) => {
  try {
    const surveys = await Survey.find({
      status: 'active',
      responses: { $not: { $elemMatch: { studentId: req.user.id } } },
    }).sort({ createdAt: -1 });
    return res.json({ surveys });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ANKET DETAYI (Korumalı)
router.get('/:id', protect, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Anket bulunamadı' });

    if (req.user.role === 'teacher') {
      if (String(survey.createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Bu ankete erişim yetkiniz yok' });
      }
    } else if (req.user.role === 'student') {
      const hasResponded = (survey.responses || []).some((r) => String(r.studentId) === String(req.user.id));
      if (survey.status !== 'active' && !hasResponded) {
        return res.status(403).json({ message: 'Bu ankete erişim yetkiniz yok' });
      }
    }

    return res.json(survey);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ANKET İSTATİSTİKLERİ (Teacher/Admin)
router.get('/:id/stats', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).lean();
    if (!survey) return res.status(404).json({ message: 'Anket bulunamadı' });

    if (req.user.role === 'teacher' && String(survey.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bu ankete erişim yetkiniz yok' });
    }

    const questions = survey.questions || [];
    const responses = survey.responses || [];
    const totalResponses = responses.length;

    const questionStats = questions.map((q, index) => {
      const questionKey = String(q?._id || index);
      const counts = {};
      for (const opt of q.options || []) counts[opt] = 0;
      let answered = 0;

      for (const resp of responses) {
        const answer = (resp.answers || []).find((a) =>
          String(a.questionId) === questionKey || String(a.questionId) === String(index)
        );
        if (!answer) continue;
        answered += 1;
        const value = String(answer.answer || '');
        counts[value] = (counts[value] || 0) + 1;
      }

      return {
        index,
        questionId: questionKey,
        questionText: q.questionText,
        type: q.type,
        answered,
        counts,
      };
    });

    return res.json({ totalResponses, questionStats });
  } catch (err) {
    return res.status(500).json({ message: err.message });
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

    if (survey.createdBy) {
      await ensureStudentLinkedToTeacher(survey.createdBy, req.user.id);
    }

    const student = await User.findById(req.user.id).select('name email role').lean();
    await recordUserActivity(req, {
      user: student,
      action: 'survey_respond',
      category: 'learning',
      summary: `Ankete cevap verdi: ${survey.title || 'Anket'}`,
      targetType: 'survey',
      targetId: survey._id,
      targetLabel: survey.title || '',
    });

    res.json({ message: "Cevap kaydedildi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;