const examsRepo = require('../repos/examsRepo');
const usersRepo = require('../repos/usersRepo');
const knex = require('../db/knex');

async function getExamsByTeacher(req, res) {
  try {
    const teacherId = Number(req.params.id) || Number(req.user && req.user.id);
    if (!teacherId) return res.status(400).json({ error: 'invalid teacher id' });
    const { page = 1, limit = 20 } = req.query;
    const result = await examsRepo.findAll({ page: Number(page), limit: Number(limit), filters: { creator_id: teacherId } });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getStudentsByTeacher(req, res) {
  try {
    const teacherId = Number(req.params.id) || Number(req.user && req.user.id);
    if (!teacherId) return res.status(400).json({ error: 'invalid teacher id' });
    // Two-pronged approach:
    // 1) students who attempted exams created by the teacher
    // 2) students with course_enrollments assigned_by the teacher
    const studentsFromAttempts = await knex('users as u')
      .distinct('u.*')
      .join('user_exam_attempts as ue', 'ue.user_id', 'u.user_id')
      .join('exams as e', 'e.exam_id', 'ue.exam_id')
      .where('e.creator_id', teacherId)
      .limit(1000);

    const studentsFromEnrollments = await knex('users as u')
      .distinct('u.*')
      .join('course_enrollments as ce', 'ce.user_id', 'u.user_id')
      .where('ce.assigned_by', teacherId)
      .limit(1000);

    // merge unique by user_id
    const map = new Map();
    for (const r of studentsFromAttempts.concat(studentsFromEnrollments)) {
      map.set(r.user_id, r);
    }
    const rows = Array.from(map.values()).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    const safe = rows.map(u => { const { password_hash, api_token, reset_token, ...s } = u || {}; return s; });
    res.json({ rows: safe, total: safe.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getStudentExamAttempts(req, res) {
  try {
    const teacherId = Number(req.params.id) || Number(req.user && req.user.id);
    const studentId = Number(req.params.studentId);
    if (!teacherId || !studentId) return res.status(400).json({ error: 'invalid ids' });
    // ensure teacher-student relation exists (basic check)
    // allow if student attempted an exam by this teacher OR was assigned by teacher to a course
    const attempted = await knex('user_exam_attempts as ue')
      .join('exams as e', 'e.exam_id', 'ue.exam_id')
      .where('e.creator_id', teacherId)
      .andWhere('ue.user_id', studentId)
      .first();
    const assigned = await knex('course_enrollments as ce')
      .where('ce.assigned_by', teacherId)
      .andWhere('ce.user_id', studentId)
      .first();
    if (!attempted && !assigned) return res.status(403).json({ error: 'access denied' });

    const rows = await knex('user_exam_attempts as ue')
      .select('ue.*', 'e.title')
      .join('exams as e', 'e.exam_id', 'ue.exam_id')
      .where('ue.user_id', studentId)
      .andWhere('e.creator_id', teacherId)
      .orderBy('ue.created_at', 'desc')
      .limit(100);
    res.json({ rows, total: rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getDashboard(req, res) {
  try {
    const teacherId = Number(req.params.id) || Number(req.user && req.user.id);
    if (!teacherId) return res.status(400).json({ error: 'invalid teacher id' });

    // total exams created by teacher
    const [{ total_exams } = { total_exams: 0 }] = await knex('exams').where({ creator_id: teacherId }).count({ total_exams: '*' });
    // published exams
    const [{ published_exams } = { published_exams: 0 }] = await knex('exams').where({ creator_id: teacherId, is_published: 1 }).count({ published_exams: '*' });

    // distinct students: from attempts and enrollments assigned_by
    const studentsFromAttempts = await knex('user_exam_attempts as ue').join('exams as e', 'e.exam_id', 'ue.exam_id').where('e.creator_id', teacherId).distinct('ue.user_id');
    const studentsFromEnroll = await knex('course_enrollments').where('assigned_by', teacherId).distinct('user_id');
    const studentIds = new Set();
    studentsFromAttempts.forEach(r => studentIds.add(r.user_id));
    studentsFromEnroll.forEach(r => studentIds.add(r.user_id));
    const total_students = studentIds.size;

    // recent attempts (last 10) on teacher's exams
    const recent_attempts = await knex('user_exam_attempts as ue')
      .select('ue.*', 'e.title')
      .join('exams as e', 'e.exam_id', 'ue.exam_id')
      .where('e.creator_id', teacherId)
      .orderBy('ue.created_at', 'desc')
      .limit(10);

    // recent surveys responses for surveys that teacher created (if surveys table has creator)
    let recent_survey_responses = [];
    try {
      recent_survey_responses = await knex('survey_responses as sr')
        .select('sr.*', 's.title')
        .join('surveys as s', 's.survey_id', 'sr.survey_id')
        .where('s.creator_id', teacherId)
        .orderBy('sr.created_at', 'desc')
        .limit(10);
    } catch (e) {
      // ignore if surveys schema different
      recent_survey_responses = [];
    }

    res.json({
      total_exams: Number(total_exams) || 0,
      published_exams: Number(published_exams) || 0,
      total_students,
      recent_attempts,
      recent_survey_responses
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { getExamsByTeacher, getStudentsByTeacher, getStudentExamAttempts, getDashboard };
