const Progress = require('../models/Progress');
const LearningEvent = require('../models/LearningEvent');

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
      p = await Progress.create({ userId, xp: 0, streak: 0, lastActive: now });
    }
    // Streak logic: if lastActive was yesterday, increment; if older than 1 day gap, reset
    if (p.lastActive) {
      const days = Math.floor((now - p.lastActive) / (1000*60*60*24));
      if (days === 1) p.streak += 1; else if (days > 1) p.streak = 1; // first day back
    } else {
      p.streak = 1;
    }
    p.lastActive = now;
    p.xp += xp;
    // Basic skill point accumulation + mastery update
    const skill = p.skills.find(s => s.subject === subject && (s.topic || '') === (topic || ''));
    if (skill) {
      skill.points += xp;
      skill.lastUpdated = now;
      // mastery hesaplaması: basit eşik, her 100 puanda seviye, yüzdelik kalan
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
    // LearningEvent kaydı (xp)
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

// Öğrencinin beceri/ustalık özetini getirir
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

// Son X gün için günlük XP trendleri
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
    // Günleri doldur (eksik günler 0)
    const map = new Map(raw.map(r => [r._id, r.totalXp]));
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0,10);
      out.push({ day: key, xp: map.get(key) || 0 });
    }

    const p = await Progress.findOne({ userId });
    res.json({ success: true, data: { streak: p?.streak || 0, days: out } });
  } catch (e) {
    console.error('getTrends error:', e);
    next(e);
  }
};

// Genel öğrenme olayı kaydı (ipucu, yanlış türü vb.)
exports.logEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, subject = '', topic = '', duration = 0, errorType = '', meta = {} } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'type gerekli' });
    const evt = await LearningEvent.create({ userId, type, subject, topic, duration, errorType, meta });
    res.json({ success: true, data: evt });
  } catch (e) { next(e); }
};
