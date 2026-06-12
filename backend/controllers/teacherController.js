const { sortPatternTopics, buildTopicMongoClause } = require('../constants/patternTopics');
const User = require('../models/User');
const Student = require('../models/Student');
const Question = require('../models/Question');
const Survey = require('../models/Survey');
const Exam = require('../models/Exam');
const UserProgress = require('../models/UserProgress');
const mongoose = require('mongoose');
const { syncTeacherRosterFromTeacherContent } = require('../utils/studentRosterSync');
const {
  syncExamStatusIfNeeded,
  attachExamScheduleMeta,
  buildTopicAnalysis,
} = require('../utils/examSchedule');
const { canManageExam } = require('../utils/examAccess');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function applyQuestionTypeFilter(query, typesRaw) {
  if (!typesRaw) return;
  const types = String(typesRaw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (types.length === 1) query.type = types[0];
  else if (types.length > 1) query.type = { $in: types };
}

const addAndClause = (query, clause) => {
  if (!clause) {
    return;
  }

  if (!query.$and) {
    query.$and = [];
  }

  query.$and.push(clause);
};

const applyClassLevelFilter = (query, classLevel) => {
  if (!classLevel || classLevel === 'Tümü') {
    return;
  }

  addAndClause(query, {
    $or: [
    { classLevel },
    { class_level: classLevel },
    { grade_level: classLevel },
    ],
  });
};

const mapQuestionRecord = (question) => ({
  ...question,
  classLevel: question.classLevel || question.class_level || question.grade_level || '',
});

const buildQuestionSearch = (query, search, mode = 'text') => {
  const term = String(search || '').trim();
  if (!term) {
    return null;
  }

  if (mode === 'text' && term.length >= 3) {
    addAndClause(query, { $text: { $search: term } });
    return { mode: 'text', term };
  }

  const regex = { $regex: escapeRegex(term), $options: 'i' };
  addAndClause(query, {
    $or: [
      { text: regex },
      { topic: regex },
      { learningOutcome: regex },
    ],
  });
  return { mode: 'regex', term };
};

const buildDifficultyCounts = async (query) => {
  const rows = await Question.aggregate([
    { $match: query },
    { $group: { _id: '$difficulty', count: { $sum: 1 } } },
  ]);

  return rows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, { Kolay: 0, Orta: 0, Zor: 0 });
};

// İç mantık: Öğretmen istatistiklerini hesapla
async function buildTeacherStats(teacherId) {
  // Öğretmen bilgisi
  const teacher = await User.findById(teacherId).select('role branch').lean();
  if (!teacher || teacher.role !== 'teacher') {
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalQuestions: 0,
      todayQuestions: 0,
      totalSurveys: 0,
      todaySurveys: 0,
      totalExams: 0,
      todayExams: 0,
      classAverage: 0,
      topTopic: '',
      activeExams: 0,
      timestamp: new Date()
    };
  }

  const branch = teacher.branch || 'Matematik';
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const teacherObjectId = new mongoose.Types.ObjectId(String(teacherId));

  const [teacherStudents, totalQuestions, todayQuestions, totalExams, todayExams, totalSurveys, todaySurveys, activeExams, totalTeachers] = await Promise.all([
    Student.find({ teacherId: teacher._id }).select('averageScore').lean(),
    Question.countDocuments({ createdBy: teacherObjectId }),
    Question.countDocuments({
      createdBy: teacherObjectId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Exam.countDocuments({ createdBy: teacherObjectId }),
    Exam.countDocuments({
      createdBy: teacherObjectId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Survey.countDocuments({ createdBy: teacherObjectId }),
    Survey.countDocuments({
      createdBy: teacherObjectId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Exam.countDocuments({ createdBy: teacherObjectId, status: 'active' }),
    User.countDocuments({ role: 'teacher' }),
  ]);

  const totalStudents = teacherStudents.length;

  let classAverage = 0;
  if (teacherStudents.length > 0) {
    classAverage = Number(
      (teacherStudents.reduce((sum, student) => sum + (student.averageScore || 0), 0) / teacherStudents.length).toFixed(1)
    );
  }

  return {
    totalStudents,
    totalTeachers,
    totalQuestions,
    todayQuestions,
    totalSurveys,
    todaySurveys,
    totalExams,
    todayExams,
    classAverage,
    topTopic: branch || '',
    activeExams,
    timestamp: new Date(),
  };
}

// ✅ 1. ÖĞRETMENİN İSTATİSTİKLERİNİ GETIR
exports.getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const stats = await buildTeacherStats(teacherId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'İstatistikler alınamadı', error: err.message });
  }
};

// ✅ 2. SINIF RAPORLARINI GETIR (Konu havuzu, sınav sonuçları, trend)
exports.getClassReports = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const oid = new mongoose.Types.ObjectId(teacherId);

    const teacherStudents = await Student.find({ teacherId })
      .select('userId averageScore')
      .lean();
    const classUserIds = teacherStudents.map((s) => s.userId).filter(Boolean);
    const classUserOid = classUserIds.map((id) => new mongoose.Types.ObjectId(String(id)));

    const classAverage =
      teacherStudents.length > 0
        ? Number(
            (
              teacherStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0) /
              teacherStudents.length
            ).toFixed(1)
          )
        : 0;

    const topicAgg = await Question.aggregate([
      { $match: { createdBy: oid } },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          avgDifficulty: {
            $avg: {
              $cond: [
                { $eq: ['$difficulty', 'Kolay'] },
                1,
                { $cond: [{ $eq: ['$difficulty', 'Orta'] }, 2, 3] },
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalPool = topicAgg.reduce((sum, row) => sum + row.total, 0);
    const topicPerformance = topicAgg.map((row) => ({
      subject: row._id || 'Belirtilmedi',
      total: row.total,
      avgDifficulty: row.avgDifficulty != null ? Number(row.avgDifficulty.toFixed(2)) : null,
      poolShare: totalPool > 0 ? Math.round((100 * row.total) / totalPool) : 0,
    }));

    const studentRisks = await Student.find({ teacherId })
      .populate('userId', 'name email')
      .select('averageScore grade')
      .sort({ averageScore: 1 })
      .limit(8)
      .lean();

    const studentRisksOut = studentRisks.map((s) => ({
      _id: s._id,
      name: s.userId?.name || 'Öğrenci',
      email: s.userId?.email || '',
      averageScore: s.averageScore ?? 0,
      grade: s.grade,
    }));

    const dailyTrendRaw = await Exam.aggregate([
      { $match: { createdBy: oid } },
      { $unwind: { path: '$results', preserveNullAndEmptyArrays: false } },
      { $match: { 'results.submittedAt': { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$results.submittedAt' },
          },
          avgScore: { $avg: '$results.score' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyTrend = dailyTrendRaw.map((d) => ({
      date: d._id,
      avgScore: d.avgScore != null ? Number(Number(d.avgScore).toFixed(1)) : 0,
      count: d.count,
    }));

    const participationAgg =
      classUserOid.length > 0
        ? await Exam.aggregate([
            { $match: { createdBy: oid } },
            { $unwind: { path: '$results', preserveNullAndEmptyArrays: false } },
            {
              $match: {
                'results.submittedAt': { $gte: since },
                'results.studentId': { $in: classUserOid },
              },
            },
            { $group: { _id: '$results.studentId' } },
          ])
        : [];

    const participationRate =
      classUserIds.length > 0
        ? Math.round((100 * participationAgg.length) / classUserIds.length)
        : 0;

    const periodScoreAgg =
      classUserOid.length > 0
        ? await Exam.aggregate([
            { $match: { createdBy: oid } },
            { $unwind: { path: '$results', preserveNullAndEmptyArrays: false } },
            {
              $match: {
                'results.submittedAt': { $gte: since },
                'results.studentId': { $in: classUserOid },
              },
            },
            { $group: { _id: null, avg: { $avg: '$results.score' }, n: { $sum: 1 } } },
          ])
        : [];

    const periodAverage =
      periodScoreAgg[0]?.n > 0 && periodScoreAgg[0].avg != null
        ? Number(Number(periodScoreAgg[0].avg).toFixed(1))
        : null;

    const weakTopicsInPeriod = await Exam.aggregate([
      { $match: { createdBy: oid } },
      { $unwind: { path: '$results', preserveNullAndEmptyArrays: false } },
      { $match: { 'results.submittedAt': { $gte: since } } },
      { $unwind: { path: '$results.weakTopics', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$results.weakTopics', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]);

    res.json({
      days,
      since,
      summary: {
        classAverage,
        periodAverage,
        participationRate,
        submissionsInPeriod: periodScoreAgg[0]?.n || 0,
        totalStudents: classUserIds.length,
        topPoolSubject: topicPerformance[0]?.subject || null,
        weakTopic: weakTopicsInPeriod[0]?._id || null,
      },
      topicPerformance,
      studentRisks: studentRisksOut,
      dailyTrend,
      weakTopicsInPeriod: weakTopicsInPeriod.map((w) => ({ topic: w._id, count: w.count })),
      generatedAt: new Date(),
    });
  } catch (err) {
    res.status(500).json({ message: 'Raporlar alınamadı', error: err.message });
  }
};

// ✅ 4. ÖĞRETMENİN ANKETLERİNİ GETIR
exports.getMySurveys = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { createdBy: teacherId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const surveys = await Survey.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Survey.countDocuments(filter);

    res.json({
      data: surveys,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ message: 'Anketler alınamadı', error: err.message });
  }
};

// ✅ 5. ÖĞRETMENİN SINIFINDAKİ ÖĞRENCİLERİNİ GETIR (DEDİKE)
exports.getClassStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;

    await syncTeacherRosterFromTeacherContent(teacherId);

    const students = await Student.find({ teacherId })
      .select('userId grade averageScore')
      .populate('userId', 'name email status')
      .sort({ averageScore: -1 });

    const normalizedStudents = students.map((student) => ({
      _id: student._id,
      userId: student.userId?._id || null,
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      status: student.userId?.status || 'active',
      grade: student.grade,
      averageScore: student.averageScore || 0,
    }));

    res.json({
      totalStudents: normalizedStudents.length,
      students: normalizedStudents,
      classAverage: normalizedStudents.length > 0 
        ? (normalizedStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0) / normalizedStudents.length).toFixed(1)
        : 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Öğrenciler alınamadı', error: err.message });
  }
};

// ✅ 6. ÖĞRENCİ AYRINTI
exports.getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    // Öğrencinin öğretmene ait olduğunu doğrula
    const student = await Student.findOne({ _id: studentId, teacherId });
    if (!student) {
      return res.status(403).json({ message: 'Bu öğrenciye erişim izniniz yok' });
    }

    // Öğrencinin sınav performansı
    const exams = await Exam.find({ createdBy: teacherId });
    const studentPerformance = exams.map((exam) => {
      const sid = String(student.userId || '');
      const row = (exam.results || []).find((r) => String(r.studentId) === sid);
      return {
        examName: exam.title,
        score: row?.score ?? 0,
        maxScore: 100,
        participated: Boolean(row),
      };
    });

    const taken = studentPerformance.filter((p) => p.participated);
    const averageScore =
      taken.length > 0
        ? (taken.reduce((sum, p) => sum + p.score, 0) / taken.length).toFixed(1)
        : 0;

    res.json({
      student,
      performance: studentPerformance,
      averageScore,
    });
  } catch (err) {
    res.status(500).json({ message: 'Öğrenci detayları alınamadı', error: err.message });
  }
};

// ✅ 6.b ÖĞRENCİ İLERLEME (Lesson quiz progress)
// UI: pages/teacher/StudentProgressDashboard.jsx -> GET /api/teacher/students/:studentId/progress
exports.getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params; // Student collection _id
    const teacherId = req.user.id;

    const student = await Student.findOne({ _id: studentId, teacherId }).select('userId');
    if (!student) {
      return res.status(403).json({ message: 'Bu öğrenciye erişim izniniz yok' });
    }

    const rows = await UserProgress.find({ userId: student.userId })
      .populate('lessonId', 'title')
      .sort({ lastAttempt: -1 })
      .lean();

    const progress = rows.map((row) => ({
      lessonId: row.lessonId?._id || row.lessonId,
      lessonTitle: row.lessonId?.title || '',
      correctCount: row.correctCount || 0,
      wrongCount: row.wrongCount || 0,
      xp: row.xp || 0,
      lastAttempt: row.lastAttempt || null,
    }));

    return res.json({ progress });
  } catch (err) {
    return res.status(500).json({ message: 'İlerleme alınamadı', error: err.message });
  }
};

// ✅ 7. ÖĞRETMENIN SORULARINI GETİR (PAGINATION + FİLTRELEME)
exports.getMyQuestions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty, topic, sortBy, types } = req.query;
    const sortByTopic = String(sortBy || '').toLowerCase() === 'topic';

    const query = { createdBy: teacherId };
    
    if (subject && subject !== 'Tümü') query.subject = subject;
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;
    const topicClause = buildTopicMongoClause(topic, escapeRegex);
    if (topicClause) query.topic = topicClause;
    applyQuestionTypeFilter(query, types);
    applyClassLevelFilter(query, classLevel);
    const searchMeta = buildQuestionSearch(query, search, 'text');

    let total = await Question.countDocuments(query);
    let effectiveQuery = query;

    if (searchMeta?.mode === 'text' && total === 0) {
      effectiveQuery = { createdBy: teacherId };
      if (subject && subject !== 'Tümü') effectiveQuery.subject = subject;
      if (difficulty && difficulty !== 'Tümü') effectiveQuery.difficulty = difficulty;
      const fc = buildTopicMongoClause(topic, escapeRegex);
      if (fc) effectiveQuery.topic = fc;
      applyQuestionTypeFilter(effectiveQuery, types);
      applyClassLevelFilter(effectiveQuery, classLevel);
      buildQuestionSearch(effectiveQuery, search, 'regex');
      total = await Question.countDocuments(effectiveQuery);
    }

    const difficultyCounts = await buildDifficultyCounts(effectiveQuery);
    const projection = {
      text: 1,
      subject: 1,
      topic: 1,
      learningOutcome: 1,
      mebReference: 1,
      curriculumNote: 1,
      classLevel: 1,
      class_level: 1,
      grade_level: 1,
      difficulty: 1,
      type: 1,
      source: 1,
      createdAt: 1,
      image: 1,
      options: 1,
      correctAnswer: 1,
      solution: 1,
      assessmentMeta: 1,
    };

    const sort = searchMeta?.mode === 'text' && effectiveQuery.$and?.some((clause) => clause.$text)
      ? { score: { $meta: 'textScore' }, createdAt: -1 }
      : sortByTopic
        ? { topic: 1, createdAt: -1 }
        : { createdAt: -1 };

    const questions = await Question.find(effectiveQuery, {
      ...projection,
      ...(sort.score ? { score: { $meta: 'textScore' } } : {}),
    })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(total / limit),
      page: page,
      total: total,
      difficultyCounts,
      data: questions.map(mapQuestionRecord)
    });
  } catch (err) {
    res.status(500).json({ message: 'Sorular alınamadı', error: err.message });
  }
};

// ✅ 8. KİPİ ÖZET (Dashboard Başlığı İçin)
exports.getDashboardSummary = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const teacherObjectId = new mongoose.Types.ObjectId(String(teacherId));

    const [stats, teacherStudents, topicPerformance, dailyTrend, recentQuestions, recentExams] = await Promise.all([
      buildTeacherStats(teacherId),
      Student.find({ teacherId })
        .select('grade averageScore createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Question.aggregate([
        {
          $match: {
            createdBy: teacherObjectId,
            topic: { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$topic',
            total: { $sum: 1 },
            avgDifficulty: {
              $avg: {
                $cond: [
                  { $eq: ['$difficulty', 'Kolay'] },
                  1,
                  { $cond: [{ $eq: ['$difficulty', 'Orta'] }, 2, 3] },
                ],
              },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Exam.aggregate([
        {
          $match: {
            createdBy: teacherObjectId,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Question.find({ createdBy: teacherObjectId })
        .select('text difficulty classLevel createdAt image topic')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Exam.find({ createdBy: teacherObjectId })
        .select('title classLevel createdAt status results')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    res.json({
      stats,
      reports: {
        topicPerformance,
        dailyTrend,
        recentQuestions,
        recentExams,
        recentStudents: teacherStudents,
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Özet alınamadı', error: err.message });
  }
};

// ✅ 9. ÖĞRETMENİN OLUŞTURDUĞU SINAVLARI GETİR
exports.getMyExams = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = String(req.query.search || '').trim();
    const classLevel = String(req.query.classLevel || '').trim();

    const query = { createdBy: teacherId };
    if (search) {
      query.title = { $regex: escapeRegex(search), $options: 'i' };
    }
    if (classLevel && classLevel !== 'Tümü') {
      query.classLevel = classLevel;
    }

    const sort = { createdAt: -1 };
    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const teacher = await User.findById(teacherId).select('role branch branchApproval').lean();
    const { attachExamAccess } = require('../utils/examAccess');
    const enriched = [];
    for (const exam of exams) {
      const doc = await Exam.findById(exam._id);
      if (doc) await syncExamStatusIfNeeded(doc);
      enriched.push({
        ...attachExamAccess({ ...teacher, id: teacherId }, exam),
        ...attachExamScheduleMeta(doc || exam),
        participantCount: (exam.results || []).length,
      });
    }
    return res.json({
      data: enriched,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: 'Sınavlar alınamadı', error: err.message });
  }
};

// ✅ 10. BRANŞ TALEBİ (Öğretmen branş seçer ve onaya gönderir)
exports.requestBranchApproval = async (req, res) => {
  try {
    console.log('[branch-request] headers:', req.headers.authorization ? 'auth present' : 'no auth');
    console.log('[branch-request] body:', req.body);
    const teacherId = req.user.id;
    const { branch } = req.body;
    if (!branch || typeof branch !== 'string') {
      return res.status(400).json({ message: 'Geçerli bir branş giriniz.' });
    }
    // Basit doğrulama: bilinen branş seti
    const allowed = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe'];
    if (!allowed.includes(branch)) {
      return res.status(400).json({ message: 'Desteklenmeyen branş. Lütfen listeden birini seçiniz.' });
    }
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const { recordAdminAudit } = require('../services/activityLogger');

    const user = await User.findById(teacherId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    if (user.role !== 'teacher') return res.status(403).json({ message: 'Sadece öğretmenler branş talebi oluşturabilir.' });

    const changed = user.branch !== branch;
    user.branch = branch;
    user.branchApproval = 'pending';
    await user.save();

    // Basit bildirim: adminlere sistem mesajı (opsiyonel, burada sadece kendine not bırakıyoruz)
    try {
      await recordAdminAudit(req, { actorId: teacherId, action: 'request_branch', targetUserId: teacherId, targetEmail: user.email, metadata: { branch, changed } });
    } catch {}

    try {
      await Notification.create({ recipientId: teacherId, senderId: teacherId, title: 'Branş Onay Talebi', message: `Branş talebiniz (${branch}) admin onayına gönderildi.`, type: 'system' });
    } catch {}

    res.json({ message: 'Branş talebi admin onayına gönderildi.', branch });
  } catch (err) {
    console.error('requestBranchApproval error:', err);
    res.status(500).json({ message: 'Branş talebi hatası', details: err?.message || String(err) });
  }
};

// ✅ 11. Branşa göre soru bankası (tüm öğretmenler tarafından oluşturulmuş, branşa uygun)
exports.getSubjectQuestions = async (req, res) => {
  try {
    const subject = req.userBranch; // branchApprovalMiddleware set eder
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, classLevel, difficulty, topic, sortBy, types } = req.query;
    const sortByTopic = String(sortBy || '').toLowerCase() === 'topic';

    // Önce branş (subject) eşleşmesini zorunlu tut
    const query = { subject: { $regex: `^${escapeRegex(subject)}$`, $options: 'i' } };
    const topicClause = buildTopicMongoClause(topic, escapeRegex);
    if (topicClause) query.topic = topicClause;
    applyQuestionTypeFilter(query, types);
    applyClassLevelFilter(query, classLevel);
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;
    const searchMeta = buildQuestionSearch(query, search, 'text');

    let total = await Question.countDocuments(query);
    let effectiveQuery = query;

    if (searchMeta?.mode === 'text' && total === 0) {
      effectiveQuery = { subject: { $regex: `^${escapeRegex(subject)}$`, $options: 'i' } };
      const fc2 = buildTopicMongoClause(topic, escapeRegex);
      if (fc2) effectiveQuery.topic = fc2;
      applyQuestionTypeFilter(effectiveQuery, types);
      applyClassLevelFilter(effectiveQuery, classLevel);
      if (difficulty && difficulty !== 'Tümü') effectiveQuery.difficulty = difficulty;
      buildQuestionSearch(effectiveQuery, search, 'regex');
      total = await Question.countDocuments(effectiveQuery);
    }

    const difficultyCounts = await buildDifficultyCounts(effectiveQuery);
    const projection = {
      text: 1,
      subject: 1,
      topic: 1,
      learningOutcome: 1,
      mebReference: 1,
      curriculumNote: 1,
      classLevel: 1,
      class_level: 1,
      grade_level: 1,
      difficulty: 1,
      type: 1,
      source: 1,
      createdAt: 1,
      image: 1,
      options: 1,
      correctAnswer: 1,
      solution: 1,
    };
    const sort = searchMeta?.mode === 'text' && effectiveQuery.$and?.some((clause) => clause.$text)
      ? { score: { $meta: 'textScore' }, createdAt: -1 }
      : sortByTopic
        ? { topic: 1, createdAt: -1 }
        : { createdAt: -1 };
    let questions = await Question.find(effectiveQuery, {
      ...projection,
      ...(sort.score ? { score: { $meta: 'textScore' } } : {}),
    })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Hiç sonuç yoksa daha esnek bir eşleşme ile tekrar dene (boşluk/çeşitlemeler)
    if (total === 0 && !searchMeta) {
      const looseQuery = { ...effectiveQuery };
      if (looseQuery.subject?.$regex) {
        looseQuery.subject = { $regex: subject, $options: 'i' }; // contains, case-insensitive
      }
      if (topic && topic !== 'Tümü') {
        const looseClause = buildTopicMongoClause(topic, escapeRegex);
        if (looseClause) looseQuery.topic = looseClause;
      }
      const looseTotal = await Question.countDocuments(looseQuery);
      if (looseTotal > 0) {
        questions = await Question.find(looseQuery, projection)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
      }
    }

    res.json({ success: true, data: questions.map(mapQuestionRecord), total, page, totalPages: Math.ceil(total / limit), difficultyCounts });
  } catch (err) {
    res.status(500).json({ message: 'Branşa göre sorular alınamadı', error: err.message });
  }
};

// ✅ 13. Branşa göre konu listesi (distinct)
exports.getSubjectTopics = async (req, res) => {
  try {
    const subject = req.userBranch;
    const classLevel = String(req.query.classLevel || '').trim();
    // Mevcut sorular üzerinden eşsiz topic değerlerini topla
    const query = { subject };
    applyClassLevelFilter(query, classLevel);
    const rawTopics = await Question.distinct('topic', query);
    const topics = sortPatternTopics(rawTopics);
    res.json({ success: true, topics });
  } catch (err) {
    res.status(500).json({ message: 'Konu listesi alınamadı', error: err.message });
  }
};

// ✅ 12. Branşa göre sınavlar
exports.getSubjectExams = async (req, res) => {
  try {
    const subject = req.userBranch;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = String(req.query.search || '').trim();
    const classLevel = String(req.query.classLevel || '').trim();
    const query = { subject };
    if (search) {
      query.title = { $regex: escapeRegex(search), $options: 'i' };
    }
    if (classLevel && classLevel !== 'Tümü') {
      query.classLevel = classLevel;
    }
    const sort = { createdAt: -1 };

    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean();
    const teacher = await User.findById(req.user.id).select('role branch branchApproval').lean();
    const { attachExamAccess } = require('../utils/examAccess');
    const enriched = [];
    for (const exam of exams) {
      const doc = await Exam.findById(exam._id);
      if (doc) await syncExamStatusIfNeeded(doc);
      enriched.push({
        ...attachExamAccess({ ...teacher, id: req.user.id }, exam),
        ...attachExamScheduleMeta(doc || exam),
        participantCount: (exam.results || []).length,
      });
    }
    res.json({
      data: enriched,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: 'Branşa göre sınavlar alınamadı', error: err.message });
  }
};

// ✅ 14. ÖĞRENCİLERİN İPUCU İSTEKLERİ (öğretmen panosu)
// UI: TeacherReports.jsx -> GET /api/teacher/hint-requests?days=30
exports.getHintRequests = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacher = await User.findById(teacherId).select('role branch').lean();
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Sadece öğretmenler erişebilir.' });
    }

    const days = Math.max(1, Math.min(180, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Öğretmenin sınıfındaki öğrencilerin userId listesi
    const myStudents = await Student.find({ teacherId }).select('userId').lean();
    const studentUserIds = myStudents
      .map((s) => s.userId)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    if (studentUserIds.length === 0) {
      return res.json({
        success: true,
        data: { totalHints: 0, byTopic: [], byStudent: [], recent: [] },
        days,
      });
    }

    const LearningEvent = require('../models/LearningEvent');
    const branch = teacher.branch || '';

    const baseMatch = {
      userId: { $in: studentUserIds },
      type: 'hint',
      createdAt: { $gte: since },
    };
    if (branch) {
      // branş filtresi: subject boş kayıtları da al (eski olaylar için), ama farklı branş varsa hariç
      baseMatch.$or = [{ subject: branch }, { subject: '' }, { subject: { $exists: false } }];
    }

    const [totalHints, byTopic, byStudentRaw, recentRaw] = await Promise.all([
      LearningEvent.countDocuments(baseMatch),
      LearningEvent.aggregate([
        { $match: baseMatch },
        { $group: { _id: { topic: { $ifNull: ['$topic', ''] } }, count: { $sum: 1 } } },
        { $project: { _id: 0, topic: '$_id.topic', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      LearningEvent.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
            lastAt: { $max: '$createdAt' },
            topics: { $addToSet: { $ifNull: ['$topic', ''] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      LearningEvent.find(baseMatch)
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
    ]);

    // userId -> name eşle
    const userIdsForLookup = new Set([
      ...byStudentRaw.map((r) => String(r._id)),
      ...recentRaw.map((r) => String(r.userId)),
    ]);
    const usersList = await User.find({ _id: { $in: Array.from(userIdsForLookup) } })
      .select('name email')
      .lean();
    const userMap = new Map(usersList.map((u) => [String(u._id), u]));

    const byStudent = byStudentRaw.map((r) => {
      const u = userMap.get(String(r._id));
      return {
        userId: String(r._id),
        name: u?.name || 'Öğrenci',
        email: u?.email || '',
        count: r.count,
        lastAt: r.lastAt,
        topics: (r.topics || []).filter(Boolean).slice(0, 5),
      };
    });

    const recent = recentRaw.map((r) => {
      const u = userMap.get(String(r.userId));
      return {
        _id: String(r._id),
        userId: String(r.userId),
        studentName: u?.name || 'Öğrenci',
        topic: r.topic || '',
        subject: r.subject || '',
        createdAt: r.createdAt,
        questionPreview: r.meta?.questionPreview || '',
        studentAnswer: r.meta?.studentAnswer || '',
      };
    });

    res.json({
      success: true,
      data: { totalHints, byTopic, byStudent, recent },
      days,
    });
  } catch (err) {
    console.error('getHintRequests error:', err);
    res.status(500).json({ message: 'İpucu istekleri alınamadı', error: err.message });
  }
};

exports.getExamResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('questions', 'text topic learningOutcome difficulty');
    if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });

    await syncExamStatusIfNeeded(exam);
    const actor = await User.findById(req.user.id).select('role branch branchApproval').lean();
    if (!canManageExam({ ...actor, id: req.user.id }, exam)) {
      return res.status(403).json({ message: 'Bu sınavın sonuçlarını görme yetkiniz yok' });
    }

    const results = exam.results || [];
    const analysis = buildTopicAnalysis(results);
    const rosterCount = await Student.countDocuments({ teacherId: req.user.id, grade: exam.classLevel });

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        classLevel: exam.classLevel,
        duration: exam.duration,
        startAt: exam.startAt,
        endAt: exam.endAt,
        status: exam.status,
        ...attachExamScheduleMeta(exam),
        questionCount: (exam.questions || []).length,
      },
      summary: {
        ...analysis,
        rosterCount,
        participationRate: rosterCount
          ? Math.round((analysis.participantCount / rosterCount) * 100)
          : null,
      },
      students: results.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        score: r.score,
        correctCount: r.correctCount,
        wrongCount: r.wrongCount,
        weakTopics: r.weakTopics || [],
        topicStats: r.topicStats || [],
        submittedAt: r.submittedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Sınav sonuçları alınamadı', error: err.message });
  }
};
