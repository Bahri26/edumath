const Joi = require('joi');

// ===== SURVEY CREATION & UPDATE =====
const surveyCreateSchema = Joi.object({
  course_id: Joi.number().integer().allow(null),
  title: Joi.string().max(255).required().messages({
    'string.empty': 'Anket başlığı gereklidir',
    'string.max': 'Başlık 255 karakteri aşmamalıdır'
  }),
  description: Joi.string().allow(null, '').messages({
    'string.base': 'Açıklama metin olmalıdır'
  }),
  survey_type: Joi.string().valid('feedback', 'assessment', 'evaluation', 'custom').default('feedback').messages({
    'any.only': 'Geçerli anket türü: feedback, assessment, evaluation, custom'
  }),
  is_anonymous: Joi.boolean().default(true),
  requires_login: Joi.boolean().default(false),
  start_date: Joi.date().iso().allow(null).messages({
    'date.base': 'Başlangıç tarihi geçerli bir tarih olmalıdır'
  }),
  end_date: Joi.date().iso().allow(null).messages({
    'date.base': 'Bitiş tarihi geçerli bir tarih olmalıdır'
  }),
  settings: Joi.object().allow(null).messages({
    'object.base': 'Ayarlar nesne olmalıdır'
  })
});

const surveyUpdateSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow(null, ''),
  survey_type: Joi.string().valid('feedback', 'assessment', 'evaluation', 'custom'),
  is_anonymous: Joi.boolean(),
  requires_login: Joi.boolean(),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
  settings: Joi.object().allow(null)
}).min(1);

// ===== SURVEY QUESTIONS =====
const addQuestionSchema = Joi.object({
  question_id: Joi.number().integer().required().messages({
    'number.required': 'Soru ID gereklidir',
    'number.base': 'Soru ID sayı olmalıdır'
  }),
  order: Joi.number().integer().min(0).default(0),
  is_required: Joi.boolean().default(true)
});

const updateQuestionSchema = Joi.object({
  order: Joi.number().integer().min(0),
  is_required: Joi.boolean()
}).min(1);

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

// ===== SURVEY RESPONSES =====
const submitAnswersSchema = Joi.object({
  answers: Joi.array().items(
    Joi.object({
      question_id: Joi.number().integer().required(),
      option_id: Joi.number().integer().allow(null),
      text_answer: Joi.string().allow(null, ''),
      rating: Joi.number().integer().min(1).max(5).allow(null)
    })
  ).required().messages({
    'array.base': 'Cevaplar bir dizi olmalıdır'
  })
});

const createResponseSchema = Joi.object({
  respondent_id: Joi.number().integer().allow(null),
  external_respondent_id: Joi.string().allow(null, '')
});

// Middleware validators
function validateCreate(req, res, next) {
  const { error, value } = surveyCreateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateUpdate(req, res, next) {
  const { error, value } = surveyUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateAddQuestion(req, res, next) {
  const { error, value } = addQuestionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateUpdateQuestion(req, res, next) {
  const { error, value } = updateQuestionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateSubmitAnswers(req, res, next) {
  const { error, value } = submitAnswersSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

module.exports = {
  surveyCreateSchema,
  surveyUpdateSchema,
  addQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
  submitAnswersSchema,
  createResponseSchema,
  validateCreate,
  validateUpdate,
  validateAddQuestion,
  validateUpdateQuestion,
  validateSubmitAnswers
};
