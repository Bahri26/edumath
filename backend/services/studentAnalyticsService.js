const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Exercise = require('../models/Exercise');
const Assignment = require('../models/Assignment');
const LearningEvent = require('../models/LearningEvent');
const UserProgress = require('../models/UserProgress');
const Lesson = require('../models/Lesson');
const Topic = require('../models/Topic');
const User = require('../models/User');
const { Matrix } = require('ml-matrix');

const WEAK_THRESHOLD = Number(process.env.ML_WEAK_TOPIC_THRESHOLD || 0.55);

function toObjectId(id) {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
}

function resolveClassLevel(profile) {
  const g = String(profile?.grade || '').trim();
  if (!g) return '9. Sınıf';
  if (/sınıf/i.test(g)) return g;
  const n = parseInt(g, 10);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return `${n}. Sınıf`;
  return '9. Sınıf';
}

async function buildCurriculumSuggestions(studentId) {
  const oid = toObjectId(studentId);
  if (!oid) return [];
  const user = await User.findById(oid).select('grade').lean();
  const classLevel = resolveClassLevel(user);
  const topics = await Topic.find({ classLevel, subject: /matematik/i })
    .sort({ order: 1, name: 1 })
    .limit(6)
    .select('name')
    .lean();
  return topics.map((t, index) => ({
    topic: t.name,
    total: 0,
    correct: 0,
    accuracy: 0,
    avgTimeMs: 0,
    mastery: 0,
    distanceFromIdeal: 0.9,
    priorityScore: 0.85 - index * 0.05,
    isWeak: true,
    suggested: true,
  }));
}

function pushTopicStat(map, topic, isCorrect, timeMs = 0) {
  const key = String(topic || 'Genel').trim() || 'Genel';
  if (!map[key]) {
    map[key] = { total: 0, correct: 0, timeMs: 0 };
  }
  map[key].total += 1;
  if (isCorrect) map[key].correct += 1;
  if (timeMs > 0) map[key].timeMs += timeMs;
}

/**
 * Öğrenci cevaplarından konu bazlı özellik matrisi (ml-matrix).
 * Sütunlar: doğruluk oranı, ortalama süre (normalize), deneme sayısı (normalize)
 */
async function collectTopicStats(studentId) {
  const oid = toObjectId(studentId);
  const topicMap = {};

  if (oid) {
    const exams = await Exam.find({ 'results.studentId': oid })
      .select('results topic')
      .lean();

    for (const exam of exams) {
      const examTopic = exam.topic || 'Sınav';
      for (const r of exam.results || []) {
        if (String(r.studentId) !== String(oid)) continue;
        const correctN = Number(r.correctCount) || 0;
        const wrongN = Number(r.wrongCount) || 0;
        if (correctN + wrongN > 0) {
          pushTopicStat(topicMap, examTopic, correctN >= wrongN);
        }
        for (const ts of r.topicStats || []) {
          const topic = ts.topic || examTopic;
          const wrong = Number(ts.wrong) || 0;
          for (let i = 0; i < wrong; i += 1) pushTopicStat(topicMap, topic, false);
          if (wrong === 0) pushTopicStat(topicMap, topic, true);
        }
        for (const wt of r.weakTopics || []) {
          pushTopicStat(topicMap, wt, false);
        }
      }
    }

    const exercises = await Exercise.find({ 'submissions.studentId': oid })
      .select('submissions topic')
      .lean();
    for (const ex of exercises) {
      const topic = ex.topic || 'Çalışma';
      for (const sub of ex.submissions || []) {
        if (String(sub.studentId) !== String(oid)) continue;
        pushTopicStat(topicMap, topic, sub.status === 'completed', sub.durationMs || 0);
      }
    }

    const assignments = await Assignment.find({ 'submissions.studentId': oid })
      .select('submissions topic title')
      .lean();
    for (const a of assignments) {
      const topic = a.topic || a.title || 'Ödev';
      for (const sub of a.submissions || []) {
        if (String(sub.studentId) !== String(oid)) continue;
        pushTopicStat(topicMap, topic, sub.status === 'completed' || sub.grade >= 50);
      }
    }

    const events = await LearningEvent.find({ userId: oid })
      .sort({ createdAt: -1 })
      .limit(200)
      .select('topic type meta')
      .lean();
    for (const ev of events) {
      if (!ev.topic) continue;
      if (ev.type === 'error') pushTopicStat(topicMap, ev.topic, false);
      if (ev.type === 'hint') pushTopicStat(topicMap, ev.topic, false);
    }

    const progressRows = await UserProgress.find({ userId: oid }).lean();
    const lessonIds = progressRows.map((r) => r.lessonId).filter(Boolean);
    const lessons = lessonIds.length
      ? await Lesson.find({ _id: { $in: lessonIds } })
          .populate({ path: 'topic', select: 'name' })
          .select('title topic')
          .lean()
      : [];
    const lessonById = new Map(lessons.map((l) => [String(l._id), l]));

    for (const row of progressRows) {
      const lesson = lessonById.get(String(row.lessonId));
      const topicName = lesson?.topic?.name || lesson?.title || 'Ders quiz';
      const correctN = Number(row.correctCount) || 0;
      const wrongN = Number(row.wrongCount) || 0;
      if (correctN + wrongN > 0) {
        for (let i = 0; i < correctN; i += 1) pushTopicStat(topicMap, topicName, true);
        for (let i = 0; i < wrongN; i += 1) pushTopicStat(topicMap, topicName, false);
      } else if (row.completed) {
        pushTopicStat(topicMap, topicName, true);
      }
    }
  }

  let entries = Object.entries(topicMap).map(([topic, s]) => {
    const accuracy = s.total > 0 ? s.correct / s.total : 0.5;
    const avgTime = s.total > 0 ? s.timeMs / s.total : 0;
    return {
      topic,
      total: s.total,
      correct: s.correct,
      accuracy,
      avgTimeMs: avgTime,
      mastery: Math.round(accuracy * 100),
    };
  });

  let suggested = false;
  if (entries.length === 0 && oid) {
    entries = await buildCurriculumSuggestions(studentId);
    suggested = entries.length > 0;
  }

  if (entries.length === 0) {
    return { entries: [], matrix: null, weakTopics: [], suggested: false, hasActivity: false };
  }

  if (suggested) {
    const weakTopics = entries.map((e) => e.topic);
    return {
      entries,
      matrix: null,
      weakTopics,
      suggested: true,
      hasActivity: false,
    };
  }

  const maxAttempts = Math.max(1, ...entries.map((e) => e.total));
  const maxTime = Math.max(1, ...entries.map((e) => e.avgTimeMs));

  const rows = entries.map((e) => [
    e.accuracy,
    1 - Math.min(1, e.avgTimeMs / maxTime),
    e.total / maxAttempts,
  ]);

  const matrix = new Matrix(rows);
  const ideal = new Matrix([[1, 1, 1]]);

  const scored = entries.map((entry, i) => {
    const row = matrix.getRow(i);
    const dist = Math.sqrt(
      row.reduce((sum, v, j) => sum + (v - ideal.get(0, j)) ** 2, 0)
    );
    const priority = Math.min(1, dist / Math.sqrt(3));
    return {
      ...entry,
      distanceFromIdeal: Number(dist.toFixed(3)),
      priorityScore: Number(priority.toFixed(3)),
      isWeak: entry.accuracy < WEAK_THRESHOLD,
    };
  });

  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  const weakTopics = scored.filter((s) => s.isWeak).map((s) => s.topic);

  return {
    entries: scored,
    matrix,
    weakTopics: weakTopics.length ? weakTopics : scored.slice(0, 2).map((s) => s.topic),
    suggested: false,
    hasActivity: true,
  };
}

async function getWeakTopics(studentId) {
  const { weakTopics } = await collectTopicStats(studentId);
  return weakTopics;
}

module.exports = {
  collectTopicStats,
  getWeakTopics,
  WEAK_THRESHOLD,
};
