/**
 * E2E: Öğretmen → şablon (matching + sequence) → havuza kayıt →
 * doğrudan DB'de küçük egzersiz + sınav oluştur → öğrenci teslimleri → sonuç kontrolü.
 *
 * Çalıştır: node scripts/e2eInteractiveExamExercise.js
 * Önkoşullar: Backend ayakta (PORT), .env içinde SEED_* ve MONGODB_URI ayarlı.
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const Exercise = require('../../models/Exercise');
const Exam = require('../../models/Exam');
const User = require('../../models/User');

const BASE = `http://127.0.0.1:${process.env.PORT || 8000}/api`;

const dbConnect = async () => {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI yok.');
  await mongoose.connect(uri, { dbName });
};

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`login ${email}: ${data.message || res.status}`);
  }
  return data.token;
}

async function teacherGenerateMatching(token, classLevel, difficulty) {
  const res = await fetch(`${BASE}/pattern-templates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ templateKey: 'interactive_matching', classLevel, difficulty, count: 1 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `generate matching ${res.status}`);
  return (data.questions || [])[0];
}

async function teacherGenerateSequence(token, classLevel, difficulty) {
  const res = await fetch(`${BASE}/pattern-templates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ templateKey: 'interactive_sequence', classLevel, difficulty, count: 1 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `generate sequence ${res.status}`);
  return (data.questions || [])[0];
}

async function saveQuestion(token, q, classLevelFallback) {
  const payload = {
    text: q.text,
    options: (q.options || []).map((o) => o?.text ?? o),
    correctAnswer: q.correctAnswer,
    solution: q.solution || '',
    subject: q.subject || 'Matematik',
    topic: q.topic || 'Örüntüler',
    classLevel: q.classLevel || classLevelFallback,
    difficulty: q.difficulty || 'Orta',
    type: q.type || 'multiple-choice',
    interactiveType: q.interactiveType || 'none',
    interactionData: q.interactionData || null,
    assessmentMeta: q.assessmentMeta || undefined,
    source: 'AI',
    imagePath: q.image || '',
  };
  const res = await fetch(`${BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `save question ${res.status}`);
  return data.data;
}

function buildMatchingAnswer(correctPairs) {
  return JSON.stringify(correctPairs || {});
}

function buildSequenceAnswer(correctOrder) {
  return JSON.stringify({ order: [...(correctOrder || [])], locked: true });
}

async function main() {
  let exercise = null;
  let exam = null;
  const teacherEmail = process.env.SEED_TEACHER_EMAIL;
  const teacherPass = process.env.SEED_TEACHER_PASSWORD;
  const studentEmail = process.env.SEED_STUDENT_EMAIL;
  const studentPass = process.env.SEED_STUDENT_PASSWORD;
  if (!teacherEmail || !teacherPass || !studentEmail || !studentPass) {
    throw new Error('SEED_TEACHER_* / SEED_STUDENT_* .env içinde tanımlı olmalı.');
  }

  await dbConnect();

  try {
    const studentUser = await User.findOne({ email: studentEmail }).select('grade classLevel name').lean();
    const classLevel = studentUser?.grade || studentUser?.classLevel || '5. Sınıf';
    const difficulty = 'Orta';

    const teacherToken = await login(teacherEmail, teacherPass);
    const studentToken = await login(studentEmail, studentPass);

    const rawMatch = await teacherGenerateMatching(teacherToken, classLevel, difficulty);
    const rawSeq = await teacherGenerateSequence(teacherToken, classLevel, difficulty);

    const qMatch = await saveQuestion(teacherToken, rawMatch, classLevel);
    const qSeq = await saveQuestion(teacherToken, rawSeq, classLevel);

    const teacherDoc = await User.findOne({ email: teacherEmail }).select('_id').lean();
    const teacherId = teacherDoc?._id;
    if (!teacherId) throw new Error('Öğretmen kullanıcı bulunamadı.');

    const ts = Date.now();
    const matchId = qMatch._id.toString();
    const seqId = qSeq._id.toString();

    exercise = await Exercise.create({
      name: `E2E-IX-${ts}`,
      description: 'Otomatik etkileşimli E2E',
      classLevel,
      subject: 'Matematik',
      difficulty: [difficulty],
      questions: [matchId, seqId],
      totalQuestions: 2,
      createdBy: teacherId,
      gameMode: 'practice',
      pointsPerQuestion: 10,
      isActive: true,
    });

    exam = await Exam.create({
      title: `E2E-IX-EXAM-${ts}`,
      description: 'E2E interactive',
      classLevel,
      duration: 15,
      questions: [matchId, seqId],
      createdBy: teacherId,
      status: 'active',
      subject: 'Matematik',
    });

    const correctPairs = qMatch.interactionData?.correctPairs || {};
    const correctOrder = qSeq.interactionData?.correctOrder || [];
    const answersExercise = {
      [matchId]: buildMatchingAnswer(correctPairs),
      [seqId]: buildSequenceAnswer(correctOrder),
    };

    const exSubmit = await fetch(`${BASE}/exercises/${exercise._id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ answers: answersExercise }),
    });
    const exBody = await exSubmit.json().catch(() => ({}));
    if (!exSubmit.ok) {
      throw new Error(`Egzersiz submit: ${exBody.message || exSubmit.status}`);
    }
    if (exBody.correctCount !== 2 || exBody.data?.correctCount !== 2) {
      throw new Error(`Egzersiz beklenen 2/2 doğru, alınan: ${JSON.stringify(exBody)}`);
    }

    const examSubmit = await fetch(`${BASE}/exams/${exam._id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ answers: answersExercise }),
    });
    const examBody = await examSubmit.json().catch(() => ({}));
    if (!examSubmit.ok) {
      throw new Error(`Sınav submit: ${examBody.message || examSubmit.status}`);
    }
    if (examBody.score !== 100 || (Array.isArray(examBody.weakTopics) && examBody.weakTopics.length > 0)) {
      throw new Error(`Sınav beklenen skor 100 ve boş weakTopics, alınan: ${JSON.stringify(examBody)}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          classLevel,
          exercise: { correctCount: exBody.correctCount, score: exBody.score },
          exam: { score: examBody.score, weakTopics: examBody.weakTopics },
        },
        null,
        2
      )
    );
  } finally {
    try {
      if (exercise?._id) await Exercise.deleteOne({ _id: exercise._id });
      if (exam?._id) await Exam.deleteOne({ _id: exam._id });
    } catch {
      /* ignore */
    }
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
