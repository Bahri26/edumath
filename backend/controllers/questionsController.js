const repo = require('../repos/questionsRepo');
const question_optionsRepo = require('../repos/question_optionsRepo');
const knex = require('../db/knex');

// Helper function to map subject to language
function subjectToLanguage(subject) {
  if (!subject) return null;
  const subjectLower = String(subject).toLowerCase();
  
  if (subjectLower.includes('matematik')) return 'math';
  if (subjectLower.includes('computer') || subjectLower.includes('bilgisayar') || 
      subjectLower.includes('programming') || subjectLower.includes('programlama')) {
    return 'java'; // Computer Science uses 'java' in questions table
  }
  return null;
}

function getTeacherSubject(req) {
  return req?.user?.subject || req?.user?.dbUser?.subject || null;
}

function subjectCategory(subject) {
  const s = String(subject || '').toLocaleLowerCase('tr-TR');
  if (!s) return null;
  if (s.includes('matematik')) return 'math';
  if (s.includes('computer') || s.includes('bilgisayar') || s.includes('program') || s.includes('yazılım') || s.includes('java') || s.includes('cs')) return 'cs';
  return null;
}

function filterQuestionsByTeacherSubject(rows, subject) {
  if (!Array.isArray(rows) || !subject) return rows;

  const teacherCategory = subjectCategory(subject);
  const teacherSubject = String(subject).toLocaleLowerCase('tr-TR');

  const computerIndicators = ['computer', 'bilgisayar', 'program', 'programlama', 'coding', 'java', 'python', 'cs', 'algoritma', 'ap csa'];
  const mathIndicators = ['matematik', 'math', 'cebir', 'geometri', 'trigonometri', 'fonksiyon', 'sayı', 'örüntü', 'kesir', 'oran', 'problem', 'işlem'];

  return rows.filter((q) => {
    const text = [q?.topic, q?.subject, q?.content_text, q?.language].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');

    // exact subject match wins
    if (text.includes(teacherSubject)) return true;

    if (teacherCategory === 'math') {
      const isComputer = computerIndicators.some((k) => text.includes(k));
      const isMath = mathIndicators.some((k) => text.includes(k));

      // For math teachers, only exclude strong computer-science signals.
      // If no explicit computer signal exists, keep the question visible to avoid false negatives.
      if (isComputer) return false;
      if (isMath) return true;
      return true;
    }

    if (teacherCategory === 'cs') {
      return computerIndicators.some((k) => text.includes(k));
    }

    return true;
  });
}

// ===== QUESTIONS CRUD =====
async function list(req, res) {
  const { page = 1, limit = 20, q, type, difficulty, gradeLevel, grade_level, isActive = true, language: langParam, require_options, min_options } = req.query;
  
  try {
    // Only honor explicit language parameter. Teacher subject filtering is applied below with text/category logic.
    const language = langParam;

    const teacherSubject = getTeacherSubject(req);
    if (teacherSubject) {
      const mappedLanguage = subjectToLanguage(teacherSubject);
      console.log(`🔍 [LIST] Teacher subject: ${teacherSubject} → language hint: ${mappedLanguage || 'none'}`);
    }
    
    const requireOptions = String(require_options || '').toLowerCase() === 'false' ? false : true;
    const parsedMinOptions = Number(require_options || min_options);
    const minOptionCount = requireOptions
      ? (Number.isFinite(parsedMinOptions) && parsedMinOptions > 0 ? parsedMinOptions : 2)
      : null;

    const result = await repo.findAll({ 
      page: Number(page), 
      limit: Number(limit), 
      q,
      type,
      difficulty,
      gradeLevel: gradeLevel || grade_level,
      language,
      minOptionCount,
      requireSingleCorrect: requireOptions,
      isActive: isActive === 'false' ? false : true
    });
    const filteredRows = filterQuestionsByTeacherSubject(result.rows, teacherSubject);
    return res.json({ data: filteredRows, total: filteredRows.length });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}

async function myQuestions(req, res) {
  const { page = 1, limit = 1000, q, language: langParam } = req.query;
  try {
    // Keep language filter explicit only; do not implicitly force language by subject.
    const language = langParam;
    const teacherSubject = getTeacherSubject(req);
    
    const result = await repo.findAll({ 
      page: Number(page), 
      limit: Number(limit), 
      q,
      language,
      minOptionCount: 2,
      requireSingleCorrect: true,
      isActive: true
    });
    const filteredRows = filterQuestionsByTeacherSubject(result.rows, teacherSubject);
    return res.json({ data: filteredRows, total: filteredRows.length });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}

async function getOne(req, res) {
  const questionId = Number(req.params.id);
  if (!questionId) return res.status(400).json({ error: 'invalid question id' });
  try { 
    const item = await repo.findById(questionId); 
    if (!item) return res.status(404).json({ error: 'question not found' }); 
    res.json(item); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}

async function create(req, res) { 
  try { 
    const payload = {
      ...(req.body || {}),
      creator_id: req.user?.user_id || req.user?.id || req.body?.creator_id || null
    };
    const item = await repo.create(payload); 
    res.status(201).json(item); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  } 
}

async function update(req, res) { 
  const questionId = Number(req.params.id); 
  if (!questionId) return res.status(400).json({ error: 'invalid question id' }); 
  try { 
    const item = await repo.update(questionId, req.body); 
    res.json(item); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  } 
}

async function remove(req, res) { 
  const questionId = Number(req.params.id); 
  if (!questionId) return res.status(400).json({ error: 'invalid question id' }); 
  try { 
    await repo.remove(questionId); 
    res.status(204).end(); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  } 
}

// ===== QUESTION OPTIONS =====
async function getOptions(req, res) {
  const questionId = Number(req.params.id);
  if (!questionId) return res.status(400).json({ error: 'invalid question id' });
  try {
    const options = await question_optionsRepo.getQuestionOptions(questionId);
    res.json({ data: options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addOption(req, res) {
  const questionId = Number(req.params.id);
  const { optionText, isCorrect = false, explanation, sortOrder } = req.body;
  
  if (!questionId || !optionText) {
    return res.status(400).json({ error: 'questionId and optionText required' });
  }

  try {
    const optionId = await question_optionsRepo.addOption(
      questionId,
      optionText,
      isCorrect,
      explanation,
      sortOrder
    );
    const option = await question_optionsRepo.findById(optionId);
    res.status(201).json(option);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateOption(req, res) {
  const optionId = Number(req.params.optionId);
  if (!optionId) return res.status(400).json({ error: 'invalid option id' });
  try {
    const option = await question_optionsRepo.updateOption(
      optionId,
      req.body.optionText,
      req.body.isCorrect,
      req.body.explanation
    );
    res.json(option);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeOption(req, res) {
  const optionId = Number(req.params.optionId);
  if (!optionId) return res.status(400).json({ error: 'invalid option id' });
  try {
    await question_optionsRepo.removeOption(optionId);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reorderOptions(req, res) {
  const questionId = Number(req.params.id);
  const { order } = req.body; // order: [optionId, optionId, ...]
  if (!questionId || !Array.isArray(order)) {
    return res.status(400).json({ error: 'invalid order array' });
  }
  try {
    const options = await question_optionsRepo.reorderOptions(questionId, order);
    res.json({ data: options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function shuffleOptions(req, res) {
  const questionId = Number(req.params.id);
  if (!questionId) return res.status(400).json({ error: 'invalid question id' });
  try {
    const options = await question_optionsRepo.shuffleOptions(questionId);
    res.json({ data: options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ===== ANALYSIS & IMPORT =====
async function analyzePerformance(req, res) {
  const questionId = Number(req.params.id);
  if (!questionId) return res.status(400).json({ error: 'invalid question id' });
  try {
    const stats = await repo.analyzePerformance(questionId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function bulkImport(req, res) {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'questions array required' });
  }

  try {
    const imported = await repo.bulkImport(questions);
    res.status(201).json({ 
      imported: imported.length,
      data: imported
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function search(req, res) {
  const { q, type, difficulty, limit = 20, language: langParam } = req.query;
  try {
    // Keep language filter explicit only; do not implicitly force language by subject.
    const language = langParam;
    const teacherSubject = getTeacherSubject(req);
    
    const result = await repo.findAll({
      page: 1,
      limit: Number(limit),
      q,
      type,
      difficulty: difficulty ? Number(difficulty) : null,
      language,
      isActive: true
    });
    const filteredRows = filterQuestionsByTeacherSubject(result.rows, teacherSubject);
    res.json({ data: filteredRows, total: filteredRows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ===== AI GENERATOR (Lightweight) =====
async function generateAI(req, res) {
  try {
    const { topic = 'Genel', count = 5, difficulty = 'mixed' } = req.body || {};
    const n = Math.min(Math.max(Number(count) || 5, 1), 50);
    const created = [];

    for (let i = 0; i < n; i++) {
      const content = `${topic} örnek soru ${i + 1}`;
      let difficulty_level = 1;
      
      if (difficulty === 'mixed') {
        difficulty_level = Math.floor(Math.random() * 3) + 1;
      } else if (['easy', 'kolay', '1'].includes(String(difficulty).toLowerCase())) {
        difficulty_level = 1;
      } else if (['medium', 'orta', '2'].includes(String(difficulty).toLowerCase())) {
        difficulty_level = 2;
      } else if (['hard', 'zor', '3'].includes(String(difficulty).toLowerCase())) {
        difficulty_level = 3;
      }

      const qdata = {
        content_text: content,
        type: 'multiple_choice',
        difficulty_level,
        creator_id: req.user?.user_id || req.user?.id || null
      };
      
      const q = await repo.create(qdata);
      created.push(q);
    }
    
    return res.status(201).json({ 
      count: created.length,
      data: created 
    });
  } catch (err) {
    console.error('generateAI error', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { 
  list, myQuestions, getOne, create, update, remove,
  getOptions, addOption, updateOption, removeOption, reorderOptions, shuffleOptions,
  analyzePerformance, bulkImport, search,
  generateAI
};
