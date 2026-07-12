#!/usr/bin/env node
/**
 * E2E smoke: öğretmen soru ekler → sınav oluşturur → öğrenci çözer.
 *
 * Usage:
 *   node scripts/tools/smokeTeacherStudentExam.js
 *
 * Env:
 *   SMOKE_API_URL (default http://localhost:8000)
 *   SMOKE_TEACHER_EMAIL / SMOKE_TEACHER_PASSWORD
 *     or E2E_TEACHER_* / SEED_TEACHER_* / teacher@edumath.local
 *   SMOKE_STUDENT_EMAIL / SMOKE_STUDENT_PASSWORD (aynı fallback)
 *   SMOKE_CLASS_LEVEL (default 9. Sınıf — öğrenci grade ile uyumlu olmalı)
 *
 * Credentials yoksa exit 0 + skip (CI’da kırılmaz).
 * SMOKE_REQUIRE_AUTH=1 ise credentials zorunlu (exit 1).
 */
const base = (process.env.SMOKE_API_URL || process.env.E2E_API_URL || 'http://localhost:8000').replace(
  /\/$/,
  '',
);
const QUESTION_COUNT = 21;
const classLevel = process.env.SMOKE_CLASS_LEVEL || '9. Sınıf';

function cred(role) {
  const upper = role.toUpperCase();
  const email =
    process.env[`SMOKE_${upper}_EMAIL`] ||
    process.env[`E2E_${upper}_EMAIL`] ||
    process.env[`SEED_${upper}_EMAIL`] ||
    (role === 'teacher' ? 'teacher@edumath.local' : 'student@edumath.local');
  const password =
    process.env[`SMOKE_${upper}_PASSWORD`] ||
    process.env[`E2E_${upper}_PASSWORD`] ||
    process.env[`SEED_${upper}_PASSWORD`] ||
    'password123';
  const hasExplicit =
    process.env[`SMOKE_${upper}_EMAIL`] ||
    process.env[`E2E_${upper}_EMAIL`] ||
    process.env[`SEED_${upper}_EMAIL`];
  return { email, password, hasExplicit: Boolean(hasExplicit) };
}

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg, detail) {
  console.error(`  ✗ ${msg}${detail ? `: ${detail}` : ''}`);
  process.exitCode = 1;
}

async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  const token = res.data?.token || res.data?.accessToken;
  if (!res.ok || !token) {
    throw new Error(`login ${email}: ${res.data?.message || res.status}`);
  }
  return token;
}

function buildQuestions(n, stamp) {
  const list = [];
  for (let i = 1; i <= n; i += 1) {
    list.push({
      text: `[SMOKE ${stamp}] ${i}. Soru — 2+2 kaçtır?`,
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      solution: '2+2=4',
      subject: 'Matematik',
      topic: 'Smoke Test',
      classLevel,
      difficulty: 'Kolay',
      type: 'multiple-choice',
      source: 'SMOKE',
    });
  }
  return list;
}

async function cleanup(token, examId, questionIds) {
  if (examId) {
    await request(`/api/exams/${examId}`, { method: 'DELETE', token });
  }
  for (const id of questionIds) {
    await request(`/api/questions/${id}`, { method: 'DELETE', token });
  }
}

async function main() {
  const teacher = cred('teacher');
  const student = cred('student');
  const requireAuth = process.env.SMOKE_REQUIRE_AUTH === '1';

  console.log(`Teacher↔student exam smoke: ${base}\n`);

  if (requireAuth && (!teacher.email || !teacher.password || !student.email || !student.password)) {
    fail('Credentials required (SMOKE_REQUIRE_AUTH=1)');
    return;
  }

  let teacherToken;
  let studentToken;
  try {
    teacherToken = await login(teacher.email, teacher.password);
    pass(`Teacher login (${teacher.email})`);
    studentToken = await login(student.email, student.password);
    pass(`Student login (${student.email})`);
  } catch (err) {
    if (!requireAuth && !teacher.hasExplicit && !student.hasExplicit) {
      console.log(`  ○ Skip auth flow (seed users unreachable): ${err.message}`);
      console.log('  Set SMOKE_TEACHER_* / SMOKE_STUDENT_* to run the full smoke.');
      return;
    }
    fail('Login', err.message);
    return;
  }

  const stamp = Date.now();
  const title = `SMOKE-EXAM-${stamp}`;
  let examId = null;
  const questionIds = [];

  try {
    const batch = await request('/api/questions/batch', {
      method: 'POST',
      token: teacherToken,
      body: { questions: buildQuestions(QUESTION_COUNT, stamp) },
    });
    if (!batch.ok || !Array.isArray(batch.data?.data)) {
      fail('Teacher batch-create questions', batch.data?.message || batch.status);
      return;
    }
    for (const q of batch.data.data) {
      if (q._id) questionIds.push(String(q._id));
    }
    if (questionIds.length !== QUESTION_COUNT) {
      fail('Question count', `expected ${QUESTION_COUNT}, got ${questionIds.length}`);
      return;
    }
    pass(`Teacher created ${QUESTION_COUNT} questions`);

    const exam = await request('/api/exams', {
      method: 'POST',
      token: teacherToken,
      body: {
        name: title,
        description: 'Automated smoke exam',
        classLevel,
        duration: 25,
        questions: questionIds,
      },
    });
    examId = exam.data?.data?._id || exam.data?._id;
    if (!exam.ok || !examId) {
      fail('Teacher create exam', exam.data?.message || exam.status);
      return;
    }
    pass(`Teacher created exam ${title}`);

    const take = await request(`/api/exams/${examId}/take`, { token: studentToken });
    if (!take.ok) {
      fail('Student take exam', take.data?.message || take.status);
      return;
    }
    const qs = take.data?.questions || take.data?.data?.questions || [];
    if (!Array.isArray(qs) || qs.length === 0) {
      fail('Student take exam', 'no questions in payload');
      return;
    }
    pass(`Student opened exam (${qs.length} questions)`);

    const answers = {};
    for (const q of qs) {
      const id = String(q._id || q.id);
      // take endpoint strips correctAnswer — use known smoke key
      answers[id] = '4';
    }

    const submit = await request(`/api/exams/${examId}/submit`, {
      method: 'POST',
      token: studentToken,
      body: {
        answers,
        totalTimeSpentSeconds: 90,
        questionTimes: {},
        hintsUsedQuestionIds: [],
      },
    });
    if (!submit.ok) {
      fail('Student submit exam', submit.data?.message || submit.status);
      return;
    }
    const score = submit.data?.score;
    if (typeof score !== 'number') {
      fail('Student submit exam', `missing score: ${JSON.stringify(submit.data)}`);
      return;
    }
    pass(`Student submitted exam (score ${score})`);

    if (score !== 100) {
      fail('Expected perfect score on smoke answers', `got ${score}`);
      return;
    }
    pass('Score 100 as expected');
  } finally {
    await cleanup(teacherToken, examId, questionIds);
    if (examId || questionIds.length) {
      pass('Cleanup exam + questions');
    }
  }

  if (process.exitCode) return;
  console.log('\nSmoke teacher→student exam OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
