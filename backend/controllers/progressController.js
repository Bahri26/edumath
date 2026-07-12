const Progress = require('../models/Progress');
const LearningEvent = require('../models/LearningEvent');
const UserProgress = require('../models/UserProgress');

const DEFAULT_DAILY_XP_GOAL = 30;
const DEFAULT_WEEKLY_XP_GOAL = 100;

function utcDayKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

/** İki UTC gün anahtarı arasındaki gün farkı (b - a) */
function utcDayDiff(fromKey, toKey) {
  const a = Date.parse(`${fromKey}T00:00:00.000Z`);
  const b = Date.parse(`${toKey}T00:00:00.000Z`);
  return Math.round((b - a) / 86400000);
}

function applyStreakOnActivity(progress, now = new Date()) {
  const today = utcDayKey(now);
  const last = progress.lastActive ? utcDayKey(progress.lastActive) : null;
  if (!last) {
    progress.streak = 1;
  } else {
    const gap = utcDayDiff(last, today);
    if (gap === 0) {
      if (!progress.streak || progress.streak < 1) progress.streak = 1;
    } else if (gap === 1) {
      progress.streak = (progress.streak || 0) + 1;
    } else if (gap > 1) {
      progress.streak = 1;
    }
  }
  progress.lastActive = now;
  return progress;
}

exports.getMyProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let p = await Progress.findOne({ userId });
    if (!p) p = await Progress.create({ userId, xp: 0, streak: 0, lastActive: null });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
};

exports.addXP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { xp = 0, subject = 'Matematik', topic = '' } = req.body;
    let p = await Progress.findOne({ userId });
    const now = new Date();
    if (!p) {
      p = await Progress.create({ userId, xp: 0, streak: 0, lastActive: null });
    }
    applyStreakOnActivity(p, now);
    p.xp += xp;
    const skill = p.skills.find(s => s.subject === subject && (s.topic || '') === (topic || ''));
    if (skill) {
      skill.points += xp;
      skill.lastUpdated = now;
      const level = Math.floor(skill.points / 100) + 1;
      const mastery = Math.min(100, Math.round((skill.points % 100)));
      skill.level = level;
      skill.mastery = mastery;
    } else {
      const points = xp;
      const level = Math.floor(points / 100) + 1;
      const mastery = Math.min(100, Math.round(points % 100));
      p.skills.push({ subject, topic, level, points, mastery, lastUpdated: now });
    }
    await LearningEvent.create({ userId, type: 'xp', subject, topic, xp, meta: { source: 'addXP' } });
    await p.save();
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const top = await Progress.find({}).populate('userId', 'name grade avatar').sort({ xp: -1 }).limit(20);
    const list = top.map((p) => ({
      name: p.userId?.name || 'Öğrenci',
      xp: p.xp,
      streak: p.streak,
      grade: p.userId?.grade || '',
      avatar: p.userId?.avatar || ''
    }));
    res.json({ success: true, data: list });
  } catch (e) { next(e); }
};

exports.getSkills = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let p = await Progress.findOne({ userId });
    if (!p) p = await Progress.create({ userId, xp: 0, streak: 0, lastActive: null });
    const skills = (p.skills || []).map(s => ({
      subject: s.subject,
      topic: s.topic || '',
      level: s.level || 1,
      points: s.points || 0,
      mastery: s.mastery || 0,
      lastUpdated: s.lastUpdated || p.updatedAt,
    }));
    res.json({ success: true, data: { xp: p.xp, streak: p.streak, skills } });
  } catch (e) { next(e); }
};

exports.getTrends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const mongoose = require('mongoose');
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'xp', createdAt: { $gte: since } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          totalXp: { $sum: '$xp' }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const raw = await LearningEvent.aggregate(pipeline);
    const map = new Map(raw.map(r => [r._id, r.totalXp]));
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key, xp: map.get(key) || 0 });
    }

    const p = await Progress.findOne({ userId });
    const weekSlice = out.slice(-7);
    const weekXp = weekSlice.reduce((sum, d) => sum + Number(d.xp || 0), 0);
    const activeDaysThisWeek = weekSlice.filter((d) => Number(d.xp || 0) > 0).length;
    const dailyGoal = Number(p?.dailyGoal) > 0 ? Number(p.dailyGoal) : DEFAULT_DAILY_XP_GOAL;
    const weeklyGoal = Math.max(DEFAULT_WEEKLY_XP_GOAL, dailyGoal * 5);

    res.json({
      success: true,
      data: {
        streak: p?.streak || 0,
        days: out,
        weekXp,
        weeklyGoal,
        dailyGoal,
        activeDaysThisWeek,
      },
    });
  } catch (e) {
    console.error('getTrends error:', e);
    next(e);
  }
};

exports.getLessonProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rows = await UserProgress.find({ userId })
      .select('lessonId completed xp correctCount wrongCount lastAttempt')
      .lean();
    res.json({ success: true, items: rows });
  } catch (e) {
    next(e);
  }
};

exports.logEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, subject = '', topic = '', duration = 0, errorType = '', meta = {} } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'type gerekli' });
    const evt = await LearningEvent.create({ userId, type, subject, topic, duration, errorType, meta });
    res.json({ success: true, data: evt });
  } catch (e) { next(e); }
};
