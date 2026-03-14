const request = require('supertest');
const express = require('express');

jest.mock('../repos/questionsRepo', () => ({
  findById: jest.fn(async () => ({ content_text: 'Örnek temel soru' }))
}));

jest.mock('../repos/question_optionsRepo', () => ({
  getQuestionOptions: jest.fn(async () => [])
}));

describe('AI API endpoints', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const app = express();
  let aiRouter;
  let aiContentRouter;

  beforeAll(() => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = '';
    aiRouter = require('../routes/ai');
    aiContentRouter = require('../routes/ai_content');
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/ai', aiRouter);
    app.use('/api/ai-content', aiContentRouter);
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  test('POST /api/ai/analyze-mistake should return explanation', async () => {
    const res = await request(app)
      .post('/api/ai/analyze-mistake')
      .send({
        questionText: '2 + 2 kaçtır?',
        studentAnswer: '5',
        correctAnswer: '4',
        topic: 'Temel Aritmetik'
      })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.explanation');
  });

  test('POST /api/ai/hint should return hint', async () => {
    const res = await request(app)
      .post('/api/ai/hint')
      .send({ questionText: 'x + 3 = 10', topic: 'Cebir' })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.hint');
  });

  test('GET /api/ai/companion should return companion payload', async () => {
    const res = await request(app)
      .get('/api/ai/companion')
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.message');
    expect(res.body).toHaveProperty('data.action_text');
  });

  test('POST /api/ai/student-analysis should return analytics payload', async () => {
    const res = await request(app)
      .post('/api/ai/student-analysis')
      .send({
        studentName: 'Ali',
        examAverage: 62,
        weakTopics: ['Oran-Orantı', 'Eşitsizlik'],
        hintUsage: 5,
        streakDays: 3,
        recentResults: [55, 60, 71]
      })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.riskScore');
    expect(res.body).toHaveProperty('data.riskLevel');
  });

  test('POST /api/ai/generate-variants should return variants from baseQuestionText', async () => {
    const res = await request(app)
      .post('/api/ai/generate-variants')
      .send({
        baseQuestionText: 'Bir dikdörtgenin kısa kenarı 4, uzun kenarı 7 ise alanı nedir?',
        topic: 'Geometri',
        variantCount: 2,
        difficulty: 2
      })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data.variants)).toBe(true);
    expect(res.body.data.variants.length).toBeGreaterThan(0);
  });

  test('POST /api/ai/analyze-vision should require imageBase64', async () => {
    await request(app)
      .post('/api/ai/analyze-vision')
      .send({})
      .expect(400);
  });

  test('POST /api/ai/analyze-vision should return extracted-like payload in fallback mode', async () => {
    const res = await request(app)
      .post('/api/ai/analyze-vision')
      .send({
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
        mimeType: 'image/png'
      })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.content_text');
    expect(res.body).toHaveProperty('data.options');
  });

  // new learning endpoints
  test('GET /api/ai-content/learning for explanation should return helper object or error', async () => {
    const res = await request(app)
      .get('/api/ai-content/learning?topic=Test&mode=explanation')
      .expect(200);
    if (res.body.error) {
      expect(res.body.error).toMatch(/gemini/i);
    } else {
      expect(res.body).toHaveProperty('topic', 'Test');
      expect(res.body).toHaveProperty('mode', 'explanation');
    }
  });

  test('GET /api/ai-content/learning for flashcards should respond with JSON result', async () => {
    const res = await request(app)
      .get('/api/ai-content/learning?topic=Test&mode=flashcards')
      .expect(200);
    if (res.body.error) {
      expect(res.body.error).toMatch(/gemini/i);
    } else {
      expect(res.body).toHaveProperty('topic', 'Test');
      expect(res.body).toHaveProperty('mode', 'flashcards');
    }
  });

  test('GET /api/ai-content/learning for fillblank should respond appropriately', async () => {
    const res = await request(app)
      .get('/api/ai-content/learning?topic=Test&mode=fillblank')
      .expect(200);
    if (res.body.error) {
      expect(res.body.error).toMatch(/gemini/i);
    } else {
      expect(res.body).toHaveProperty('topic', 'Test');
      expect(res.body).toHaveProperty('mode', 'fillblank');
    }
  });

  test('GET /api/ai-content/learning for miniquiz should respond appropriately', async () => {
    const res = await request(app)
      .get('/api/ai-content/learning?topic=Test&mode=miniquiz')
      .expect(200);
    if (res.body.error) {
      expect(res.body.error).toMatch(/gemini/i);
    } else {
      expect(res.body).toHaveProperty('topic', 'Test');
      expect(res.body).toHaveProperty('mode', 'miniquiz');
    }
  });

  test('GET /api/ai-content/ai-content should return frontend-compatible fields', async () => {
    const res = await request(app)
      .get('/api/ai-content/ai-content?topic=Matematik')
      .expect(200);

    expect(res.body).toHaveProperty('topic');
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('explanation');
    expect(res.body).toHaveProperty('did_you_know');
    expect(res.body).toHaveProperty('image_url');
  });
});
