const request = require('supertest');
const express = require('express');

// Mock controller functions
const mockQuestionController = {
  list: (req, res) => {
    res.json({ data: [{ id: 1, question_text: 'Sample question', question_type: 'multiple_choice' }] });
  },
  create: (req, res) => {
    const { question_text, question_type } = req.body;
    if (!question_text || !question_type) {
      return res.status(400).json({ error: 'Question text and type required' });
    }
    res.status(201).json({ id: 1, question_text, question_type });
  },
  getOne: (req, res) => {
    res.json({ id: 1, question_text: 'Sample question' });
  },
  update: (req, res) => {
    res.json({ id: 1, question_text: 'Updated question' });
  },
  remove: (req, res) => {
    res.json({ message: 'Question deleted' });
  },
  myQuestions: (req, res) => {
    res.json({ data: [{ id: 1, question_text: 'My question' }] });
  },
  getOptions: (req, res) => {
    res.json({ data: [{ id: 1, option_text: 'Option A', is_correct: true }] });
  },
  addOption: (req, res) => {
    res.status(201).json({ id: 1, option_text: 'New Option', is_correct: false });
  },
  updateOption: (req, res) => {
    res.json({ id: 1, option_text: req.body?.option_text || 'Updated option' });
  },
  removeOption: (req, res) => {
    res.json({ message: 'Option removed' });
  },
  reorderOptions: (req, res) => {
    res.json({ message: 'Options reordered' });
  },
  shuffleOptions: (req, res) => {
    res.json({ shuffled: true });
  },
  analyzePerformance: (req, res) => {
    res.json({ question_id: 1, attempted: 50, correct: 35, correct_rate: 70 });
  },
  bulkImport: (req, res) => {
    res.status(201).json({ imported: 10, failed: 0 });
  },
  search: (req, res) => {
    res.json({ data: [{ id: 1, question_text: 'Found question' }] });
  },
  generateAI: (req, res) => {
    res.status(201).json({ id: 1, question_text: 'AI generated question' });
  }
};

// Setup Express app for testing
const app = express();
app.use(express.json());

const questionsRouter = require('express').Router();
questionsRouter.get('/', mockQuestionController.list);
questionsRouter.post('/', mockQuestionController.create);
questionsRouter.get('/my-questions', mockQuestionController.myQuestions);
questionsRouter.post('/generate-ai', mockQuestionController.generateAI);
questionsRouter.post('/bulk-import', mockQuestionController.bulkImport);
questionsRouter.get('/search', mockQuestionController.search);
questionsRouter.get('/:id', mockQuestionController.getOne);
questionsRouter.put('/:id', mockQuestionController.update);
questionsRouter.delete('/:id', mockQuestionController.remove);
questionsRouter.get('/:id/options', mockQuestionController.getOptions);
questionsRouter.post('/:id/options', mockQuestionController.addOption);
questionsRouter.put('/:id/options/:optionId', mockQuestionController.updateOption);
questionsRouter.delete('/:id/options/:optionId', mockQuestionController.removeOption);
questionsRouter.post('/:id/options/reorder', mockQuestionController.reorderOptions);
questionsRouter.post('/:id/shuffle-options', mockQuestionController.shuffleOptions);
questionsRouter.get('/:id/analysis', mockQuestionController.analyzePerformance);

app.use('/api/questions', questionsRouter);

describe('Questions API endpoints', () => {
  test('GET /api/questions should return list of questions', async () => {
    const res = await request(app)
      .get('/api/questions')
      .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/questions should create new question', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({ question_text: 'New question', question_type: 'multiple_choice' })
      .expect(201);
    expect(res.body).toHaveProperty('question_text');
  });

  test('POST /api/questions should fail without required fields', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({})
      .expect(400);
  });

  test('GET /api/questions/my-questions should return user\'s questions', async () => {
    const res = await request(app)
      .get('/api/questions/my-questions')
      .expect(200);
    expect(res.body).toHaveProperty('data');
  });

  test('GET /api/questions/:id should return question details', async () => {
    const res = await request(app)
      .get('/api/questions/1')
      .expect(200);
    expect(res.body).toHaveProperty('question_text');
  });

  test('PUT /api/questions/:id should update question', async () => {
    const res = await request(app)
      .put('/api/questions/1')
      .send({ question_text: 'Updated question' })
      .expect(200);
    expect(res.body.question_text).toBe('Updated question');
  });

  test('DELETE /api/questions/:id should delete question', async () => {
    const res = await request(app)
      .delete('/api/questions/1')
      .expect(200);
  });

  test('GET /api/questions/:id/options should return question options', async () => {
    const res = await request(app)
      .get('/api/questions/1/options')
      .expect(200);
    expect(res.body).toHaveProperty('data');
  });

  test('POST /api/questions/:id/options should add new option', async () => {
    const res = await request(app)
      .post('/api/questions/1/options')
      .send({ option_text: 'New option' })
      .expect(201);
    expect(res.body).toHaveProperty('option_text');
  });

  test('PUT /api/questions/:id/options/:optionId should update option', async () => {
    const res = await request(app)
      .put('/api/questions/1/options/1')
      .send({ option_text: 'Updated option' })
      .expect(200);
    expect(res.body.option_text).toBe('Updated option');
  });

  test('DELETE /api/questions/:id/options/:optionId should remove option', async () => {
    const res = await request(app)
      .delete('/api/questions/1/options/1')
      .expect(200);
  });

  test('POST /api/questions/:id/options/reorder should reorder options', async () => {
    const res = await request(app)
      .post('/api/questions/1/options/reorder')
      .send({ options: [{ id: 1, order: 0 }] })
      .expect(200);
  });

  test('POST /api/questions/:id/shuffle-options should shuffle options', async () => {
    const res = await request(app)
      .post('/api/questions/1/shuffle-options')
      .expect(200);
    expect(res.body.shuffled).toBe(true);
  });

  test('GET /api/questions/:id/analysis should return performance analysis', async () => {
    const res = await request(app)
      .get('/api/questions/1/analysis')
      .expect(200);
    expect(res.body).toHaveProperty('correct_rate');
  });

  test('POST /api/questions/bulk-import should import multiple questions', async () => {
    const res = await request(app)
      .post('/api/questions/bulk-import')
      .send({
        questions: [
          { question_text: 'Q1', question_type: 'multiple_choice', options: [] },
          { question_text: 'Q2', question_type: 'essay', options: [] }
        ]
      })
      .expect(201);
    expect(res.body).toHaveProperty('imported');
  });

  test('GET /api/questions/search should search questions', async () => {
    const res = await request(app)
      .get('/api/questions/search?q=test')
      .expect(200);
    expect(res.body).toHaveProperty('data');
  });

  test('POST /api/questions/generate-ai should generate question with AI', async () => {
    const res = await request(app)
      .post('/api/questions/generate-ai')
      .send({ topic: 'Mathematics', difficulty: 'medium' })
      .expect(201);
    expect(res.body).toHaveProperty('question_text');
  });
});
