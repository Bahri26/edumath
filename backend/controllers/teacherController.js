const User = require('../models/User');
const Student = require('../models/Student');
const Question = require('../models/Question');
const Survey = require('../models/Survey');
const Exam = require('../models/Exam');
const mongoose = require('mongoose');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  const teacher = await User.findById(teacherId);
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

  const teacherStudents = await Student.find({ teacherId: teacher._id })
    .select('averageScore')
    .lean();

  const totalQuestions = await Question.countDocuments({ subject: branch });
  const todayQuestions = await Question.countDocuments({
    subject: branch,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  const totalExams = await Exam.countDocuments({ subject: branch });
  const todayExams = await Exam.countDocuments({
    subject: branch,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  const totalStudents = teacherStudents.length;
  const totalTeachers = await User.countDocuments({ role: 'teacher' });

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
    totalSurveys: 0,
    todaySurveys: 0,
    totalExams,
    todayExams,
    classAverage,
    topTopic: branch || '',
    activeExams: totalExams,
    timestamp: new Date()
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

// ✅ 2. SINIF RAPORLARINI GETIR (Konu Bazlı Başarı)
exports.getClassReports = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Konu bazlı başarı oranları
    const topicPerformance = await Question.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(teacherId) } },
      { $group: { 
        _id: '$subject', 
        total: { $sum: 1 },
        avgDifficulty: { $avg: { 
          $cond: [
            { $eq: ['$difficulty', 'Kolay'] }, 1,
            { $cond: [{ $eq: ['$difficulty', 'Orta'] }, 2, 3] }
          ]
        }}
      }},
      { $sort: { total: -1 } }
    ]);

    // Öğrenci risk analizi (Düşük başarılı öğrenciler)
    const studentRisks = await Student.find({ teacherId })
      .select('name email averageScore grade')
      .sort({ averageScore: 1 })
      .limit(5);

    // Sınıf başarı trend (Son 7 gün)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Exam.aggregate([
      { $match: { 
        createdBy: new mongoose.Types.ObjectId(teacherId),
        createdAt: { $gte: sevenDaysAgo }
      }},
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        avgScore: { $avg: 72 }, // Mock veri (gerçekte submissions'dan hesaplanır)
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      topicPerformance,
      studentRisks,
      dailyTrend,
      generatedAt: new Date()
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
    const studentPerformance = exams.map(exam => ({
      examName: exam.title,
      score: exam.submissions?.find(s => s.studentId.toString() === studentId)?.score || 0,
      maxScore: 100
    }));

    res.json({
      student,
      performance: studentPerformance,
      averageScore: studentPerformance.length > 0 
        ? (studentPerformance.reduce((sum, p) => sum + p.score, 0) / studentPerformance.length).toFixed(1)
        : 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Öğrenci detayları alınamadı', error: err.message });
  }
};

// ✅ 7. ÖĞRETMENIN SORULARINI GETİR (PAGINATION + FİLTRELEME)
exports.getMyQuestions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, subject, classLevel, difficulty, topic } = req.query;

    const query = { createdBy: teacherId };
    
    if (subject && subject !== 'Tümü') query.subject = subject;
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;
    if (topic && topic !== 'Tümü') query.topic = topic;
    applyClassLevelFilter(query, classLevel);
    const searchMeta = buildQuestionSearch(query, search, 'text');

    let total = await Question.countDocuments(query);
    let effectiveQuery = query;

    if (searchMeta?.mode === 'text' && total === 0) {
      effectiveQuery = { createdBy: teacherId };
      if (subject && subject !== 'Tümü') effectiveQuery.subject = subject;
      if (difficulty && difficulty !== 'Tümü') effectiveQuery.difficulty = difficulty;
      if (topic && topic !== 'Tümü') effectiveQuery.topic = topic;
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
    };

    const sort = searchMeta?.mode === 'text' && effectiveQuery.$and?.some((clause) => clause.$text)
      ? { score: { $meta: 'textScore' }, createdAt: -1 }
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
    const teacher = await User.findById(teacherId).select('branch');
    const branch = teacher?.branch || 'Matematik';
    const stats = await buildTeacherStats(teacherId);
    const teacherStudents = await Student.find({ teacherId })
      .select('grade averageScore createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const topicPerformance = await Question.aggregate([
      { $match: { subject: { $regex: `^${branch}$`, $options: 'i' }, topic: { $exists: true, $ne: '' } } },
      { $group: { 
        _id: '$topic', 
        total: { $sum: 1 },
        avgDifficulty: { $avg: { 
          $cond: [
            { $eq: ['$difficulty', 'Kolay'] }, 1,
            { $cond: [{ $eq: ['$difficulty', 'Orta'] }, 2, 3] }
          ]
        }}
      }},
      { $sort: { total: -1 } }
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Exam.aggregate([
      { $match: { 
        subject: { $regex: `^${branch}$`, $options: 'i' },
        createdAt: { $gte: sevenDaysAgo }
      }},
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        avgScore: { $avg: '$averageScore' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    const recentQuestions = await Question.find({ subject: { $regex: `^${branch}$`, $options: 'i' } })
      .select('text difficulty classLevel createdAt image')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const recentExams = await Exam.find({ subject: { $regex: `^${branch}$`, $options: 'i' } })
      .select('title classLevel createdAt status results')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.json({
      stats,
      reports: {
        topicPerformance,
        dailyTrend,
        recentQuestions,
        recentExams,
        recentStudents: teacherStudents,
        generatedAt: new Date()
      }
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
    return res.json({
      data: exams,
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
    const AdminAudit = require('../models/AdminAudit');

    const user = await User.findById(teacherId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    if (user.role !== 'teacher') return res.status(403).json({ message: 'Sadece öğretmenler branş talebi oluşturabilir.' });

    const changed = user.branch !== branch;
    user.branch = branch;
    user.branchApproval = 'pending';
    await user.save();

    // Basit bildirim: adminlere sistem mesajı (opsiyonel, burada sadece kendine not bırakıyoruz)
    try {
      await AdminAudit.create({ actorId: teacherId, action: 'request_branch', targetUserId: teacherId, targetEmail: user.email, metadata: { branch, changed } });
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
    const { search, classLevel, difficulty, topic } = req.query;

    // Önce branş (subject) eşleşmesini zorunlu tut
    const query = { subject: { $regex: `^${escapeRegex(subject)}$`, $options: 'i' } };
    // İsteğe bağlı konu filtresi
    if (topic && topic !== 'Tümü') {
      query.topic = { $regex: `^${escapeRegex(topic)}$`, $options: 'i' };
    }
    applyClassLevelFilter(query, classLevel);
    if (difficulty && difficulty !== 'Tümü') query.difficulty = difficulty;
    const searchMeta = buildQuestionSearch(query, search, 'text');

    let total = await Question.countDocuments(query);
    let effectiveQuery = query;

    if (searchMeta?.mode === 'text' && total === 0) {
      effectiveQuery = { subject: { $regex: `^${escapeRegex(subject)}$`, $options: 'i' } };
      if (topic && topic !== 'Tümü') {
        effectiveQuery.topic = { $regex: `^${escapeRegex(topic)}$`, $options: 'i' };
      }
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
      if (looseQuery.topic?.$regex) {
        looseQuery.topic = { $regex: topic || '', $options: 'i' };
      }
      const looseTotal = await Question.countDocuments(looseQuery);
      if (looseTotal > 0) {
        questions = await Question.find(looseQuery, projection)
          .sort({ createdAt: -1 })
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
    const topics = await Question.distinct('topic', query);
    // Bazı veri setlerinde topic alanı olmayabilir; bu durumda boş dizi döner
    res.json({ success: true, topics: topics.filter(Boolean).sort() });
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
    res.json({ data: exams, total, pages: Math.ceil(total / limit), currentPage: page });
  } catch (err) {
    res.status(500).json({ message: 'Branşa göre sınavlar alınamadı', error: err.message });
  }
};
