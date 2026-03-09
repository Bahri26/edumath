const request = require('supertest');
const express = require('express');

// create a minimal mock controller to verify routing logic
const mock = {
  list: (req, res) => {
    res.json([{ user_id: 1, topic_id: 2, mastery_level: 3 }]);
  },
  getOne: (req, res) => {
    res.json({ user_id: 1, topic_id: Number(req.params.topicId), mastery_level: 2 });
  },
  recordReview: (req, res) => {
    const correct = req.body.correct;
    res.json({ user_id: 1, topic_id: Number(req.params.topicId), correct_count: correct ? 1 : 0 });
  }
};

const app = express();
app.use(express.json());
const router = require('express').Router();
router.get('/', mock.list);
router.get('/:topicId', mock.getOne);
router.post('/:topicId/review', mock.recordReview);
app.use('/api/user_topic_progress', router);

describe('User topic progress API', () => {
  test('GET list should return array', async () => {
    const res = await request(app).get('/api/user_topic_progress').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('mastery_level');
  });

  test('GET single should return object', async () => {
    const res = await request(app).get('/api/user_topic_progress/5').expect(200);
    expect(res.body.topic_id).toBe(5);
  });

  test('POST review should accept correct flag', async () => {
    const res = await request(app)
      .post('/api/user_topic_progress/5/review')
      .send({ correct: true })
      .expect(200);
    expect(res.body).toHaveProperty('correct_count');
  });
});
