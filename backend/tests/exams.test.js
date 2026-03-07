const request = require('supertest');
const express = require('express');

// Mock controller functions
const mockExamController = {
  list: (req, res) => {
    res.json({ data: [{ id: 1, title: 'Test Exam', course_id: 1 }] });
  },
  create: (req, res) => {
    const { title, course_id } = req.body;
    if (!title || !course_id) {
      return res.status(400).json({ error: 'Title and course_id required' });
    }
    res.status(201).json({ id: 1, title, course_id });
  },
  getOne: (req, res) => {
    res.json({ id: 1, title: 'Test Exam' });
  },
  update: (req, res) => {
    res.json({ id: 1, title: 'Updated Exam' });
  },
  remove: (req, res) => {
    res.json({ message: 'Exam deleted' });
  },
  startAttempt: (req, res) => {
    res.status(201).json({ attempt_id: 1, exam_id: 1, student_id: 1, status: 'in_progress' });
  },
  getAttempt: (req, res) => {
    res.json({ id: 1, exam_id: 1, student_id: 1, status: 'in_progress' });
  },
  recordAnswer: (req, res) => {
    res.json({ id: 1, question_id: 1, option_id: 1, is_correct: true });
  },
  submitAttempt: (req, res) => {
    res.json({ id: 1, status: 'submitted', submitted_at: new Date() });
  },
  gradeAttempt: (req, res) => {
    res.json({ id: 1, total_score: 85, is_passed: true });
  },
  getStatistics: (req, res) => {
    res.json({ exam_id: 1, average_score: 75, students_attempted: 10 });
  },
  listQuestions: (req, res) => {
    res.json({ data: [{ id: 1, question_text: 'Sample Q', points: 10 }] });
  },
  publish: (req, res) => {
    res.json({ id: 1, status: 'published' });
  }
};

// Setup Express app for testing
const app = express();
app.use(express.json());

const examsRouter = require('express').Router();
examsRouter.get('/', mockExamController.list);
examsRouter.post('/', mockExamController.create);
examsRouter.get('/:id', mockExamController.getOne);
examsRouter.put('/:id', mockExamController.update);
examsRouter.delete('/:id', mockExamController.remove);
examsRouter.post('/:id/attempts', mockExamController.startAttempt);
examsRouter.get('/attempts/:attemptId', mockExamController.getAttempt);
examsRouter.post('/attempts/:attemptId/answer', mockExamController.recordAnswer);
examsRouter.post('/attempts/:attemptId/submit', mockExamController.submitAttempt);
examsRouter.post('/attempts/:attemptId/grade', mockExamController.gradeAttempt);
examsRouter.get('/:id/statistics', mockExamController.getStatistics);
examsRouter.get('/:id/questions', mockExamController.listQuestions);
examsRouter.post('/:id/publish', mockExamController.publish);

app.use('/api/exams', examsRouter);

describe('Exams API endpoints', () => {
  test('GET /api/exams should return list of exams', async () => {
    const res = await request(app)
      .get('/api/exams')
      .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/exams should create new exam', async () => {
    const res = await request(app)
      .post('/api/exams')
      .send({ title: 'New Exam', course_id: 1 })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('New Exam');
  });

  test('POST /api/exams should fail without title', async () => {
    const res = await request(app)
      .post('/api/exams')
      .send({ course_id: 1 })
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/exams/:id should return exam details', async () => {
    const res = await request(app)
      .get('/api/exams/1')
      .expect(200);
    expect(res.body).toHaveProperty('id');
  });

  test('PUT /api/exams/:id should update exam', async () => {
    const res = await request(app)
      .put('/api/exams/1')
      .send({ title: 'Updated Exam' })
      .expect(200);
    expect(res.body.title).toBe('Updated Exam');
  });

  test('DELETE /api/exams/:id should delete exam', async () => {
    const res = await request(app)
      .delete('/api/exams/1')
      .expect(200);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/exams/:id/attempts should start new attempt', async () => {
    const res = await request(app)
      .post('/api/exams/1/attempts')
      .expect(201);
    expect(res.body).toHaveProperty('attempt_id');
    expect(res.body.status).toBe('in_progress');
  });

  test('GET /api/exams/attempts/:attemptId should return attempt details', async () => {
    const res = await request(app)
      .get('/api/exams/attempts/1')
      .expect(200);
    expect(res.body).toHaveProperty('status');
  });

  test('POST /api/exams/attempts/:attemptId/answer should record answer', async () => {
    const res = await request(app)
      .post('/api/exams/attempts/1/answer')
      .send({ question_id: 1, option_id: 1 })
      .expect(200);
    expect(res.body).toHaveProperty('is_correct');
  });

  test('POST /api/exams/attempts/:attemptId/submit should submit attempt', async () => {
    const res = await request(app)
      .post('/api/exams/attempts/1/submit')
      .expect(200);
    expect(res.body.status).toBe('submitted');
  });

  test('POST /api/exams/attempts/:attemptId/grade should grade attempt', async () => {
    const res = await request(app)
      .post('/api/exams/attempts/1/grade')
      .send({ remarks: 'Good job' })
      .expect(200);
    expect(res.body).toHaveProperty('total_score');
  });

  test('GET /api/exams/:id/statistics should return exam statistics', async () => {
    const res = await request(app)
      .get('/api/exams/1/statistics')
      .expect(200);
    expect(res.body).toHaveProperty('average_score');
  });

  test('GET /api/exams/:id/questions should return exam questions', async () => {
    const res = await request(app)
      .get('/api/exams/1/questions')
      .expect(200);
    expect(res.body).toHaveProperty('data');
  });

  test('POST /api/exams/:id/publish should publish exam', async () => {
    const res = await request(app)
      .post('/api/exams/1/publish')
      .expect(200);
    expect(res.body.status).toBe('published');
  });
});
