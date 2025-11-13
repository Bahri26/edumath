// backend-express/controllers/surveyController.js
const Survey = require('../models/Survey');
const Class = require('../models/Class');

// GET /api/surveys
exports.listSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('targetClass', 'name');
    res.json(surveys.map(s => ({
      id: s._id,
      title: s.title,
      targetClass: s.targetClass ? s.targetClass.name : null,
      status: s.status,
      responseCount: s.responses?.length || 0,
      createdAt: s.createdAt
    })));
  } catch (err) {
    console.error('Survey list error', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/surveys
exports.createSurvey = async (req, res) => {
  try {
    const { title, targetClass, status, questions } = req.body;
    if (!title) return res.status(400).json({ message: 'Başlık zorunludur.' });
    // Sanitize questions (optional)
    let cleanQuestions = [];
    if (Array.isArray(questions)) {
      cleanQuestions = questions.map(q => ({
        qid: q.qid || (q._id || undefined),
        text: typeof q.text === 'string' ? q.text : '',
        type: ['text', 'single', 'multi'].includes(q.type) ? q.type : 'text',
        options: Array.isArray(q.options) ? q.options.filter(o => typeof o === 'string') : []
      })).filter(q => q.text?.trim());
    }
    const survey = await Survey.create({
      title,
      targetClass: targetClass || null,
      status: status || 'active',
      createdBy: req.user._id,
      responses: [],
      questions: cleanQuestions
    });
    const populated = await survey.populate('targetClass', 'name');
    res.status(201).json({
      id: populated._id,
      title: populated.title,
      targetClass: populated.targetClass ? populated.targetClass.name : null,
      status: populated.status,
      responseCount: 0,
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error('Survey create error', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/surveys/:id
exports.getSurvey = async (req, res) => {
  try {
    const s = await Survey.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('targetClass', 'name');
    if (!s) return res.status(404).json({ message: 'Anket bulunamadı.' });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PUT /api/surveys/:id
exports.updateSurvey = async (req, res) => {
  try {
    const { title, targetClass, status, questions } = req.body;
    const s = await Survey.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!s) return res.status(404).json({ message: 'Anket bulunamadı.' });
    if (title !== undefined) s.title = title;
    if (targetClass !== undefined) s.targetClass = targetClass;
    if (status !== undefined) s.status = status;
    if (questions !== undefined) {
      if (Array.isArray(questions)) {
        s.questions = questions.map(q => ({
          qid: q.qid || (q._id || undefined),
          text: typeof q.text === 'string' ? q.text : '',
          type: ['text', 'single', 'multi'].includes(q.type) ? q.type : 'text',
          options: Array.isArray(q.options) ? q.options.filter(o => typeof o === 'string') : []
        })).filter(q => q.text?.trim());
      } else if (questions === null) {
        s.questions = [];
      }
    }
    await s.save();
    const populated = await s.populate('targetClass', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/surveys/:id
exports.deleteSurvey = async (req, res) => {
  try {
    const s = await Survey.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!s) return res.status(404).json({ message: 'Anket bulunamadı.' });
    res.json({ message: 'Silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/surveys/:id/results
exports.getSurveyResults = async (req, res) => {
  try {
    const s = await Survey.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!s) return res.status(404).json({ message: 'Anket bulunamadı.' });
    res.json({ count: s.responses?.length || 0, responses: s.responses || [] });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/surveys/available (student)
exports.listAvailableSurveys = async (req, res) => {
  try {
    // find classes where this student is enrolled
    const classes = await Class.find({ students: req.user._id }).select('_id');
    const classIds = classes.map(c => c._id);

    const surveys = await Survey.find({ status: 'active', $or: [ { targetClass: null }, { targetClass: { $in: classIds } } ] })
      .sort({ createdAt: -1 })
      .populate('targetClass', 'name');

    res.json(surveys.map(s => ({
      id: s._id,
      title: s.title,
      targetClass: s.targetClass ? s.targetClass.name : null,
      status: s.status,
      createdAt: s.createdAt
    })));
  } catch (err) {
    console.error('Available surveys error', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/surveys/:id/public (student)
exports.getSurveyPublic = async (req, res) => {
  try {
    const classes = await Class.find({ students: req.user._id }).select('_id');
    const classIds = classes.map(c => c._id.toString());
    const s = await Survey.findById(req.params.id).populate('targetClass', 'name');
    if (!s || s.status !== 'active') return res.status(404).json({ message: 'Anket bulunamadı.' });
    if (s.targetClass && !classIds.includes(s.targetClass._id.toString())) {
      return res.status(403).json({ message: 'Bu ankete erişiminiz yok.' });
    }
    res.json({ id: s._id, title: s.title, targetClass: s.targetClass ? s.targetClass.name : null, questions: s.questions || [] });
  } catch (err) {
    console.error('Survey public get error', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/surveys/:id/answer (student)
exports.submitSurveyAnswer = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, value }]
    const s = await Survey.findById(req.params.id);
    if (!s || s.status !== 'active') return res.status(404).json({ message: 'Anket bulunamadı.' });
    // Restrict to one response per student
    const already = (s.responses || []).find(r => String(r.studentId) === String(req.user._id));
    if (already) return res.status(409).json({ message: 'Bu ankete zaten yanıt verdiniz.' });
    s.responses.push({ studentId: req.user._id, answers: Array.isArray(answers) ? answers : [] });
    await s.save();
    res.status(201).json({ message: 'Yanıt kaydedildi.' });
  } catch (err) {
    console.error('Submit survey answer error', err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
