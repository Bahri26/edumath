const knex = require('../db/knex');
const announcementsRepo = require('../repos/announcementsRepo');

async function summary(req, res) {
  try {
    const users = await knex('users').count('* as cnt');
    const courses = await knex('courses').count('* as cnt');
    const lessons = await knex('lessons').count('* as cnt');
    const announcements = await knex('announcements').count('* as cnt');

    res.json({
      users: users[0]?.cnt || 0,
      courses: courses[0]?.cnt || 0,
      lessons: lessons[0]?.cnt || 0,
      announcements: announcements[0]?.cnt || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function dailyFact(req, res) {
  try {
    // Sadece Matematik dersiyle ilgili summary materyalleri getir
    const rows = await knex('course_materials as cm')
      .join('lessons as l', 'cm.lesson_id', 'l.lesson_id')
      .select('cm.title', 'cm.content')
      .where('cm.type', 'summary')
      .andWhere('l.name', 'LIKE', '%Matematik%')
      .orderByRaw('RAND()')
      .limit(1);

    if (!rows || rows.length === 0) return res.status(404).json({ error: 'no daily fact available' });
    res.json({ fact: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function announcements(req, res) {
  try {
    const result = await announcementsRepo.findAll({ page: 1, limit: 10 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { summary, dailyFact, announcements };
