const Joi = require('joi');

// ===== EXAM CREATION & UPDATE =====
const examCreateSchema = Joi.object({
  course_id: Joi.number().integer().required().messages({
    'number.isEmpty': 'Kurs ID gereklidir',
    'number.base': 'Kurs ID sayı olmalıdır'
  }),
  title: Joi.string().max(255).required().messages({
    'string.empty': 'Sınav başlığı gereklidir',
    'string.max': 'Başlık 255 karakteri aşmamalıdır'
  }),
  description: Joi.string().allow(null, '').messages({
    'string.base': 'Açıklama metin olmalıdır'
  }),
  exam_type: Joi.string().valid('quiz', 'midterm', 'final', 'practice').default('quiz').messages({
    'any.only': 'Geçerli sınav türü: quiz, midterm, final, practice'
  }),
  total_points: Joi.number().integer().min(1).default(100).messages({
    'number.base': 'Puan sayı olmalıdır',
    'number.min': 'Puan minimum 1 olmalıdır'
  }),
  passing_score: Joi.number().integer().min(0).max(100).default(60).messages({
    'number.base': 'Geçme puanı sayı olmalıdır',
    'number.min': 'Geçme puanı negatif olamaz',
    'number.max': 'Geçme puanı 100\'ü aşmamalıdır'
  }),
  duration_minutes: Joi.number().integer().min(1).default(60).messages({
    'number.base': 'Süre dakika cinsinden sayı olmalıdır',
    'number.min': 'Süre minimum 1 dakika olmalıdır'
  }),
  start_date: Joi.date().iso().allow(null).messages({
    'date.base': 'Başlangıç tarihi geçerli bir tarih olmalıdır',
    'date.iso': 'Tarih ISO formatında olmalıdır'
  }),
  end_date: Joi.date().iso().allow(null).messages({
    'date.base': 'Bitiş tarihi geçerli bir tarih olmalıdır',
    'date.iso': 'Tarih ISO formatında olmalıdır'
  }),
  show_answers: Joi.boolean().default(false),
  is_randomized: Joi.boolean().default(false)
});

const examUpdateSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow(null, ''),
  exam_type: Joi.string().valid('quiz', 'midterm', 'final', 'practice'),
  total_points: Joi.number().integer().min(1),
  passing_score: Joi.number().integer().min(0).max(100),
  duration_minutes: Joi.number().integer().min(1),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
  show_answers: Joi.boolean(),
  is_randomized: Joi.boolean()
}).min(1);

// ===== EXAM QUESTIONS =====
const linkQuestionSchema = Joi.object({
  question_id: Joi.number().integer().required().messages({
    'number.base': 'Soru ID sayı olmalıdır',
    'number.required': 'Soru ID gereklidir'
  }),
  points: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Puan sayı olmalıdır',
    'number.min': 'Puan minimum 1 olmalıdır'
  }),
  order: Joi.number().integer().min(0).default(0)
});

const reorderQuestionsSchema = Joi.object({
  questions: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      order: Joi.number().integer().min(0).required()
    })
  ).required().messages({
    'array.base': 'Sorular bir dizi olmalıdır'
  })
});

// ===== EXAM ATTEMPTS =====
const recordAnswerSchema = Joi.object({
  question_id: Joi.number().integer().required().messages({
    'number.required': 'Soru ID gereklidir'
  }),
  option_id: Joi.number().integer().allow(null),
  text_answer: Joi.string().allow(null, ''),
  file_url: Joi.string().uri().allow(null, '')
}).min(1);

const gradeAttemptSchema = Joi.object({
  remarks: Joi.string().allow(null, ''),
  answers: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      is_correct: Joi.boolean(),
      points_earned: Joi.number().integer().min(0),
      answer_explanation: Joi.string().allow(null, '')
    })
  ).allow(null)
});

// Middleware validators
function validateCreate(req, res, next) {
  const { error, value } = examCreateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateUpdate(req, res, next) {
  const { error, value } = examUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateLinkQuestion(req, res, next) {
  const { error, value } = linkQuestionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateRecordAnswer(req, res, next) {
  const { error, value } = recordAnswerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateGradeAttempt(req, res, next) {
  const { error, value } = gradeAttemptSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

module.exports = {
  examCreateSchema,
  examUpdateSchema,
  linkQuestionSchema,
  reorderQuestionsSchema,
  recordAnswerSchema,
  gradeAttemptSchema,
  validateCreate,
  validateUpdate,
  validateLinkQuestion,
  validateRecordAnswer,
  validateGradeAttempt
};
