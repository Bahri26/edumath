const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const Exam = require('../models/Exam');
const User = require('../models/User');
const ExamResultShare = require('../models/ExamResultShare');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

const SHARE_TTL_DAYS = 14;

const publicShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

function publicDisplayName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'Öğrenci';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function sanitizeResultPayload(exam, result, studentName) {
  return {
    examTitle: exam.title || 'Sınav',
    studentName: publicDisplayName(studentName || result.studentName),
    score: result.score,
    correctCount: result.correctCount,
    wrongCount: result.wrongCount,
    weakTopics: Array.isArray(result.weakTopics) ? result.weakTopics : [],
    totalTimeSpentSeconds: result.totalTimeSpentSeconds ?? null,
    hintsUsedCount: result.hintsUsedCount ?? null,
    submittedAt: result.submittedAt || null,
  };
}

/** Öğrenci: sonuç için kısa paylaşım linki oluştur (veya mevcut geçerliyi döndür) */
router.post(
  '/exams/:id/share',
  authMiddleware,
  roleMiddleware(['student']),
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id).select('title results');
      if (!exam) {
        return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
      }

      const result = (exam.results || []).find(
        (r) => String(r.studentId) === String(req.user.id),
      );
      if (!result) {
        return res.status(404).json({ success: false, message: 'Sonuç bulunamadı' });
      }

      const now = new Date();
      let share = await ExamResultShare.findOne({
        examId: exam._id,
        studentId: req.user.id,
        revokedAt: null,
        expiresAt: { $gt: now },
      }).sort({ createdAt: -1 });

      if (!share) {
        share = await ExamResultShare.create({
          token: crypto.randomBytes(18).toString('base64url'),
          examId: exam._id,
          studentId: req.user.id,
          expiresAt: new Date(now.getTime() + SHARE_TTL_DAYS * 86400000),
        });
      }

      const path = `/share/exam/${share.token}`;
      res.status(201).json({
        success: true,
        data: {
          token: share.token,
          path,
          expiresAt: share.expiresAt,
          ttlDays: SHARE_TTL_DAYS,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

/** Herkese açık özet (cevap detayı yok) */
router.get('/public/exam-results/:token', publicShareLimiter, async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token || token.length < 16) {
      return res.status(400).json({ success: false, message: 'Geçersiz bağlantı' });
    }

    const share = await ExamResultShare.findOne({ token }).lean();
    if (!share || share.revokedAt) {
      return res.status(404).json({ success: false, message: 'Bağlantı bulunamadı veya iptal edildi' });
    }
    if (new Date(share.expiresAt) <= new Date()) {
      return res.status(410).json({ success: false, message: 'Bağlantının süresi dolmuş' });
    }

    const exam = await Exam.findById(share.examId).select('title results');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }

    const result = (exam.results || []).find(
      (r) => String(r.studentId) === String(share.studentId),
    );
    if (!result) {
      return res.status(404).json({ success: false, message: 'Sonuç bulunamadı' });
    }

    const user = await User.findById(share.studentId).select('name').lean();
    res.json({
      success: true,
      data: {
        ...sanitizeResultPayload(exam, result, user?.name),
        expiresAt: share.expiresAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
