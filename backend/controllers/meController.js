const Exercise = require('../models/Exercise');
const Student = require('../models/Student');
const User = require('../models/User');

/** GET /api/me/teachers — öğrencinin bağlı öğretmenleri */
exports.getMyTeachers = async (req, res) => {
  try {
    const links = await Student.find({ userId: req.user.id })
      .populate('teacherId', 'name email role')
      .select('teacherId grade')
      .lean();

    const teachers = links
      .filter((l) => l.teacherId)
      .map((l) => ({
        teacherId: l.teacherId._id,
        name: l.teacherId.name || '',
        email: l.teacherId.email || '',
        grade: l.grade || '',
      }));

    // Tekrarları temizle
    const seen = new Set();
    const unique = teachers.filter((t) => {
      const id = String(t.teacherId);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.json({ success: true, data: unique });
  } catch (err) {
    res.status(500).json({ message: 'Öğretmenler alınamadı', error: err.message });
  }
};

/** GET /api/me/flashcards — sınıf egzersizlerinden çalışma kartları */
exports.getFlashcards = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('grade').lean();
    const grade = student?.grade;
    if (!grade) {
      return res.status(400).json({ message: 'Öğrenci sınıf bilgisi bulunamadı' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 80);
    const exercises = await Exercise.find({ classLevel: grade, isActive: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate({
        path: 'questions',
        select: 'text image correctAnswer solution type topic subject options',
      })
      .lean();

    const cards = [];
    for (const ex of exercises) {
      for (const q of ex.questions || []) {
        if (!q || q.type === 'matching' || q.type === 'sequence') continue;
        const answer = typeof q.correctAnswer === 'string' ? q.correctAnswer : String(q.correctAnswer ?? '');
        if (!String(q.text || '').trim() && !q.image) continue;
        cards.push({
          id: String(q._id),
          exerciseId: String(ex._id),
          exerciseName: ex.name,
          text: q.text || '',
          image: q.image || '',
          answer,
          solution: q.solution || '',
          topic: q.topic || '',
          subject: q.subject || 'Matematik',
        });
        if (cards.length >= limit) break;
      }
      if (cards.length >= limit) break;
    }

    res.json({ success: true, data: cards, total: cards.length });
  } catch (err) {
    res.status(500).json({ message: 'Flashcardlar alınamadı', error: err.message });
  }
};
