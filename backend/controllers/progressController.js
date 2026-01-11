const Progress = require('../models/Progress');

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
    const { xp = 0, subject = 'Matematik' } = req.body;
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
    // Basic skill point accumulation
    const skill = p.skills.find(s => s.subject === subject);
    if (skill) skill.points += xp; else p.skills.push({ subject, level: 1, points: xp });
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
