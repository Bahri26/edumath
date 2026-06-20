const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Student = require('../models/Student');
const User = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { gradeQuestionAnswer } = require('../utils/questionGrading');
const { ensureStudentLinkedToTeacher } = require('../utils/studentRosterSync');
const { recordUserActivity } = require('../services/activityLogger');
const { canManageExam } = require('../utils/examAccess');
const {
  syncExamStatusIfNeeded,
  assertStudentCanTake,
  stripQuestionForStudent,
  attachExamScheduleMeta,
} = require('../utils/examSchedule');

async function resolveStudentGrade(userId) {
  const user = await User.findById(userId).select('grade role');
  if (user?.grade) return user.grade;
  const student = await Student.findOne({ userId }).select('grade');
  return student?.grade || null;
}

async function syncAndAttach(exam, studentId = null) {
  await syncExamStatusIfNeeded(exam);
  return attachExamScheduleMeta(exam, studentId);
}

// 1. TÜM SINAVLARI GETİR (öğretmen/admin — öğrenci sonuçları gizli)
router.get('/', authMiddleware, roleMiddleware(['teacher', 'admin']), async (req, res) => {
  try {
    const exams = await Exam.find()
      .sort({ createdAt: -1 })
      .select('-results')
      .lean();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ÖĞRENCİ: Sınıfa göre sınavlar (zaman durumu + tamamlanma bilgisi)
router.get('/by-class', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const grade = await resolveStudentGrade(req.user.id);
    if (!grade) {
      return res.status(400).json({ message: 'Öğrenci sınıf bilgisi bulunamadı.' });
    }

    const exams = await Exam.find({ classLevel: grade, status: { $ne: 'draft' } })
      .sort({ createdAt: -1 })
      .select('-questions');

    const enriched = await Promise.all(
      exams.map((exam) => syncAndAttach(exam, req.user.id)),
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ÖĞRENCİ: Sınava başla (cevap anahtarı gizli)
router.get('/:id/take', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });

    await syncExamStatusIfNeeded(exam);
    const grade = await resolveStudentGrade(req.user.id);
    if (grade && exam.classLevel !== grade) {
      return res.status(403).json({ message: 'Bu sınav sizin sınıfınıza ait değil.' });
    }

    const check = assertStudentCanTake(exam, req.user.id);
    if (!check.ok) {
      return res.status(check.code).json({ message: check.message });
    }

    const payload = attachExamScheduleMeta(exam, req.user.id);
    payload.questions = (exam.questions || []).map(stripQuestionForStudent);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SINAV DETAYI GETİR (öğretmen / admin — cevap anahtarı dahil)
router.get('/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });

    const user = await User.findById(req.user.id).select('role branch branchApproval');
    if (!user) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    if (!canManageExam(user, exam)) {
      return res.status(403).json({ message: 'Bu sınavı görüntüleme yetkiniz yok.' });
    }

    await syncExamStatusIfNeeded(exam);
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MANUEL SINAV OLUŞTUR (TEACHER)
router.post('/', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { name, description, classLevel, duration, questions, startAt, endAt } = req.body;

    if (!name || !questions || questions.length !== 21) {
      return res.status(400).json({ message: 'Sınav adı ve 21 soru gerekli' });
    }

    const questionIds = questions.map((q) => q._id || q);
    const questionsData = await Question.find({ _id: { $in: questionIds } });

    if (questionsData.length !== 21) {
      return res.status(400).json({ message: 'Tüm sorular bulunamadı' });
    }

    let subject = undefined;
    try {
      const teacher = await User.findById(req.user.id).select('branch branchApproval role');
      if (teacher && teacher.role === 'teacher' && teacher.branch && teacher.branchApproval === 'approved') {
        subject = teacher.branch;
      }
    } catch {}

    const now = new Date();
    const newExam = await Exam.create({
      title: name,
      description: description || '',
      classLevel,
      duration,
      questions: questionIds,
      createdBy: req.user.id,
      ...(subject ? { subject } : {}),
      status: 'active',
      startAt: startAt ? new Date(startAt) : now,
      endAt: endAt ? new Date(endAt) : new Date(now.getTime() + 90 * 86400000),
    });

    const actor = await User.findById(req.user.id).select('name email role').lean();
    await recordUserActivity(req, {
      user: actor,
      action: 'exam_create',
      category: 'content',
      summary: `Sınav oluşturdu: ${name}`,
      targetType: 'exam',
      targetId: newExam._id,
      targetLabel: name,
    });

    res.status(201).json({ success: true, message: 'Sınav oluşturuldu', data: newExam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// OTOMATİK SINAV OLUŞTUR (TEACHER)
router.post('/auto-generate', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { title, duration, classLevel, subject, topic, startAt, endAt } = req.body;
    const matchStage = { classLevel };
    if (subject) matchStage.subject = { $regex: subject, $options: 'i' };
    if (topic) matchStage.topic = topic;

    const easyQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Kolay' } },
      { $sample: { size: 7 } },
    ]);
    const mediumQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Orta' } },
      { $sample: { size: 7 } },
    ]);
    const hardQuestions = await Question.aggregate([
      { $match: { ...matchStage, difficulty: 'Zor' } },
      { $sample: { size: 7 } },
    ]);

    if (easyQuestions.length < 7 || mediumQuestions.length < 7 || hardQuestions.length < 7) {
      return res.status(400).json({
        message: `Her zorluk seviyesinden 7'şer soru bulunamadı! (Kolay: ${easyQuestions.length}, Orta: ${mediumQuestions.length}, Zor: ${hardQuestions.length})`,
      });
    }

    const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
    const questionIds = allQuestions.map((q) => q._id);
    const learningOutcomes = Array.from(new Set(allQuestions.map((question) => question.learningOutcome).filter(Boolean)));

    const now = new Date();
    const newExam = new Exam({
      title,
      description: topic ? `${topic} konusu için otomatik oluşturulan kazanım odaklı sınav.` : '',
      duration: duration || 25,
      classLevel: classLevel || '9. Sınıf',
      questions: questionIds,
      status: 'active',
      createdBy: req.user.id,
      ...(subject ? { subject } : {}),
      ...(topic ? { topic } : {}),
      ...(learningOutcomes.length ? { learningOutcomes } : {}),
      startAt: startAt ? new Date(startAt) : now,
      endAt: endAt ? new Date(endAt) : new Date(now.getTime() + 90 * 86400000),
    });
    await newExam.save();
    res.status(201).json(newExam);
  } catch (err) {
    res.status(500).json({ message: 'Sınav oluşturulurken hata: ' + err.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    const actor = await User.findById(req.user.id).select('role branch branchApproval').lean();
    if (!canManageExam({ ...actor, id: req.user.id }, exam)) {
      return res.status(403).json({ message: 'Bu sınavı silme yetkiniz yok' });
    }
    await exam.deleteOne();
    res.json({ message: 'Sınav silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['teacher', 'admin']), async (req, res) => {
  try {
    const allowed = ['title', 'description', 'duration', 'status', 'startAt', 'endAt'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        update[k] = ['startAt', 'endAt'].includes(k) ? new Date(req.body[k]) : req.body[k];
      }
    }
    let exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    const actor = await User.findById(req.user.id).select('role branch branchApproval').lean();
    if (!canManageExam({ ...actor, id: req.user.id }, exam)) {
      return res.status(403).json({ message: 'Bu sınavı güncelleme yetkiniz yok' });
    }
    exam = await Exam.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    await syncExamStatusIfNeeded(exam);
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/submit', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { answers, totalTimeSpentSeconds, questionTimes } = req.body;
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });

    await syncExamStatusIfNeeded(exam);
    const check = assertStudentCanTake(exam, req.user.id);
    if (!check.ok) {
      return res.status(check.code).json({ message: check.message });
    }

    let correctCount = 0;
    const weakTopicsSet = new Set();
    const topicCounts = new Map();
    const timesMap = questionTimes && typeof questionTimes === 'object' ? questionTimes : {};

    exam.questions.forEach((q) => {
      const focusArea = q.learningOutcome || q.topic || q.subject;
      const qid = String(q._id);
      const rawAnswer = answers[q._id] ?? answers[qid];
      const ok = gradeQuestionAnswer(q, rawAnswer);

      if (!ok) {
        if (focusArea) {
          weakTopicsSet.add(focusArea);
          topicCounts.set(focusArea, (topicCounts.get(focusArea) || 0) + 1);
        }
      } else {
        correctCount += 1;
      }
    });

    const totalQuestions = exam.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const wrongCount = totalQuestions - correctCount;

    const studentName = (await User.findById(req.user.id).select('name'))?.name || 'Öğrenci';
    const topicStats = Array.from(topicCounts.entries()).map(([topic, wrong]) => ({ topic, wrong }));
    const parsedQuestionTimes = exam.questions
      .map((q) => {
        const sec = Number(timesMap[String(q._id)] ?? timesMap[q._id]);
        if (!Number.isFinite(sec) || sec < 0) return null;
        return { questionId: q._id, timeSpentSeconds: Math.round(sec) };
      })
      .filter(Boolean);

    const parsedTotalTime = Number(totalTimeSpentSeconds);
    exam.results.push({
      studentId: req.user.id,
      studentName,
      score,
      correctCount,
      wrongCount,
      topicStats,
      weakTopics: Array.from(weakTopicsSet),
      totalTimeSpentSeconds: Number.isFinite(parsedTotalTime) && parsedTotalTime >= 0
        ? Math.round(parsedTotalTime)
        : null,
      questionTimes: parsedQuestionTimes,
    });

    await exam.save();
    await ensureStudentLinkedToTeacher(exam.createdBy, req.user.id);

    // Öğrenci ortalama puanını güncelle
    const allResults = await Exam.aggregate([
      { $unwind: '$results' },
      { $match: { 'results.studentId': new mongoose.Types.ObjectId(String(req.user.id)) } },
      { $group: { _id: null, avg: { $avg: '$results.score' } } },
    ]);
    if (allResults[0]?.avg != null) {
      await Student.updateMany(
        { userId: req.user.id },
        { $set: { averageScore: Math.round(allResults[0].avg) } },
      );
    }

    const studentUser = await User.findById(req.user.id).select('name email role').lean();
    await recordUserActivity(req, {
      user: studentUser,
      action: 'exam_submit',
      category: 'learning',
      summary: `Sınav tamamladı: ${exam.title} (%${score})`,
      targetType: 'exam',
      targetId: exam._id,
      targetLabel: exam.title,
      metadata: { score, correctCount, wrongCount, totalTimeSpentSeconds: parsedTotalTime },
    });

    res.json({
      message: 'Sınav tamamlandı',
      score,
      correctCount,
      wrongCount,
      topicStats,
      weakTopics: Array.from(weakTopicsSet),
      totalTimeSpentSeconds: Number.isFinite(parsedTotalTime) && parsedTotalTime >= 0
        ? Math.round(parsedTotalTime)
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/my-result', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });
    const my = (exam.results || []).find((r) => String(r.studentId) === String(req.user.id));
    if (!my) return res.status(404).json({ message: 'Sonuç bulunamadı' });
    res.json(my);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
