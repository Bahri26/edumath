const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Exercise = require('../models/Exercise');
const Assignment = require('../models/Assignment');
const LearningEvent = require('../models/LearningEvent');
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
  }

  const entries = Object.entries(topicMap).map(([topic, s]) => {
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

  if (entries.length === 0) {
    return { entries: [], matrix: null, weakTopics: [] };
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
