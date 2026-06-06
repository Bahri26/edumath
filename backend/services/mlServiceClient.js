/**
 * Edumath Python ml-service HTTP istemcisi.
 * ML_SERVICE_URL tanımlı değilse yerel ml-matrix fallback kullanılır.
 */

const DEFAULT_TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 8000);

function normalizeBaseUrl(raw) {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function getBaseUrl() {
  return normalizeBaseUrl(process.env.ML_SERVICE_URL || '');
}

function getApiKey() {
  return String(process.env.ML_SERVICE_API_KEY || '').trim();
}

function isConfigured() {
  return Boolean(getBaseUrl());
}

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const key = getApiKey();
  if (key) {
    headers['X-API-Key'] = key;
  }
  return headers;
}

function toMlTopicEntry(entry) {
  let accuracy = Number(entry.accuracy);
  if (!Number.isFinite(accuracy)) accuracy = 0;
  if (accuracy > 1) accuracy /= 100;

  let mastery = Number(entry.mastery);
  if (!Number.isFinite(mastery)) mastery = accuracy;
  if (mastery > 1) mastery /= 100;

  return {
    topic: String(entry.topic || 'Genel'),
    total: Number(entry.total) || 0,
    correct: Number(entry.correct) || 0,
    accuracy,
    avgTimeMs: Number(entry.avgTimeMs) || 0,
    mastery,
    suggested: Boolean(entry.suggested),
  };
}

function fromMlTopicRow(row) {
  let accuracy = Number(row.accuracy);
  if (!Number.isFinite(accuracy)) accuracy = 0;
  if (accuracy <= 1) accuracy = Math.round(accuracy * 1000) / 10;

  let mastery = Number(row.mastery);
  if (!Number.isFinite(mastery)) mastery = accuracy;
  if (mastery <= 1) mastery = Math.round(mastery * 100);

  return {
    ...row,
    accuracy: accuracy > 1 ? accuracy / 100 : accuracy,
    mastery,
  };
}

async function request(path, body, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const base = getBaseUrl();
  if (!base) {
    throw new Error('ML_SERVICE_URL tanımlı değil');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}${path}`, {
      method: body == null ? 'GET' : 'POST',
      headers: buildHeaders(),
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!res.ok) {
      const detail = data.detail || data.message || text || res.statusText;
      throw new Error(`ML servis ${res.status}: ${detail}`);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function checkHealth({ timeoutMs = 3000 } = {}) {
  if (!isConfigured()) {
    return { configured: false, reachable: false, status: 'disabled' };
  }

  try {
    const data = await request('/health', null, { timeoutMs });
    return {
      configured: true,
      reachable: true,
      status: 'up',
      url: getBaseUrl(),
      service: data.service || 'edumath-ml-service',
      version: data.version || null,
    };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      status: 'down',
      url: getBaseUrl(),
      error: err.message,
    };
  }
}

async function analyzeTopics(entries, { limit = 5, weakThreshold } = {}) {
  const payload = {
    entries: (entries || []).map(toMlTopicEntry),
    limit,
  };
  if (weakThreshold != null) {
    payload.weakThreshold = weakThreshold;
  }

  const data = await request('/analyze/topics', payload);
  const topics = Array.isArray(data.topics) ? data.topics.map(fromMlTopicRow) : [];

  return {
    weakTopics: Array.isArray(data.weakTopics) ? data.weakTopics : [],
    topics,
    threshold: data.threshold,
    count: data.count,
  };
}

async function enrichQuestion(payload = {}) {
  const data = await request('/questions/enrich', {
    text: payload.text || '',
    questionText: payload.questionText || '',
    introText: payload.introText || '',
    stepLabels: payload.stepLabels || '',
    ocrText: payload.ocrText || '',
    ocrPreview: payload.ocrPreview || '',
    topic: payload.topic || '',
    difficulty: payload.difficulty || '',
    correctAnswer: payload.correctAnswer || '',
    solution: payload.solution || '',
    options: Array.isArray(payload.options) ? payload.options : [],
  }, { timeoutMs: Number(process.env.ML_SERVICE_TIMEOUT_MS || 12000) });

  return data?.data || null;
}

async function solveQuestion(payload = {}) {
  const data = await request('/questions/solve', {
    text: payload.text || '',
    questionText: payload.questionText || '',
    introText: payload.introText || '',
    stepLabels: payload.stepLabels || '',
    ocrPreview: payload.ocrPreview || payload.ocrText || '',
    options: Array.isArray(payload.options) ? payload.options : [],
  });
  return data?.data || null;
}

async function parseQuestionText(ocrText, defaults = {}) {
  const data = await request('/questions/parse-text', { ocrText, defaults });
  return data?.data || null;
}

function getStatusSync() {
  return {
    configured: isConfigured(),
    url: getBaseUrl() || null,
    hasApiKey: Boolean(getApiKey()),
  };
}

module.exports = {
  isConfigured,
  getBaseUrl,
  checkHealth,
  analyzeTopics,
  enrichQuestion,
  solveQuestion,
  parseQuestionText,
  getStatusSync,
  toMlTopicEntry,
  fromMlTopicRow,
};
