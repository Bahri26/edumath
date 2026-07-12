import { e2eCredentials } from './auth.js';

export async function apiRequest(path, { method = 'GET', token, body, apiUrl } = {}) {
  const base = (apiUrl || e2eCredentials('student').apiUrl).replace(/\/$/, '');
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
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${data?.message || text}`);
  }
  return data;
}

export async function loginToken(role = 'student') {
  const { email, password, apiUrl } = e2eCredentials(role);
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    apiUrl,
    body: { email, password },
  });
  const token = data.token || data.accessToken;
  if (!token) throw new Error('login missing token');
  return { token, apiUrl, user: data.user || data };
}

/**
 * Teacher creates 21 MC questions + exam; returns ids for cleanup.
 */
export async function createSmokeExamPack({ classLevel = '9. Sınıf' } = {}) {
  const { token, apiUrl } = await loginToken('teacher');
  const stamp = Date.now();
  const title = `E2E-UI-EXAM-${stamp}`;
  const questions = Array.from({ length: 21 }, (_, i) => ({
    text: `[E2E ${stamp}] ${i + 1}. 2+2=?`,
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    solution: '4',
    subject: 'Matematik',
    topic: 'E2E Smoke',
    classLevel,
    difficulty: 'Kolay',
    type: 'multiple-choice',
    source: 'E2E',
  }));

  const batch = await apiRequest('/api/questions/batch', {
    method: 'POST',
    token,
    apiUrl,
    body: { questions },
  });
  const ids = (batch.data || []).map((q) => String(q._id));
  if (ids.length !== 21) throw new Error(`expected 21 questions, got ${ids.length}`);

  const exam = await apiRequest('/api/exams', {
    method: 'POST',
    token,
    apiUrl,
    body: {
      name: title,
      description: 'Playwright smoke exam',
      classLevel,
      duration: 25,
      questions: ids,
    },
  });
  const examId = String(exam.data?._id || exam._id);
  return { title, examId, questionIds: ids, teacherToken: token, apiUrl };
}

export async function cleanupSmokeExamPack({ teacherToken, apiUrl, examId, questionIds }) {
  if (examId) {
    await apiRequest(`/api/exams/${examId}`, { method: 'DELETE', token: teacherToken, apiUrl }).catch(() => {});
  }
  for (const id of questionIds || []) {
    await apiRequest(`/api/questions/${id}`, { method: 'DELETE', token: teacherToken, apiUrl }).catch(() => {});
  }
}
