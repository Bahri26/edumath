const Joi = require('joi');

// ===== QUESTION CREATION & UPDATE =====
const questionCreateSchema = Joi.object({
  course_id: Joi.number().integer().allow(null),
  question_text: Joi.string().required().messages({
    'string.empty': 'Soru metni gereklidir'
  }),
  question_type: Joi.string().valid('multiple_choice', 'short_answer', 'essay', 'true_false', 'matching', 'fill_blank').required().messages({
    'any.only': 'Geçerli soru türü seçiniz',
    'string.required': 'Soru türü gereklidir'
  }),
  difficulty_level: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  topic_id: Joi.number().integer().allow(null),
  learning_objective: Joi.string().allow(null, ''),
  tags: Joi.array().items(Joi.string()).allow(null),
  bloom_level: Joi.string().valid('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create').allow(null),
  explanation: Joi.string().allow(null, ''),
  image_url: Joi.string().uri().allow(null, ''),
  options: Joi.array().items(
    Joi.object({
      option_text: Joi.string().required(),
      is_correct: Joi.boolean().default(false),
      explanation: Joi.string().allow(null, '')
    })
  ).when('question_type', {
    is: Joi.string().valid('multiple_choice', 'true_false'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const questionUpdateSchema = Joi.object({
  question_text: Joi.string(),
  question_type: Joi.string().valid('multiple_choice', 'short_answer', 'essay', 'true_false', 'matching', 'fill_blank'),
  difficulty_level: Joi.string().valid('easy', 'medium', 'hard'),
  topic_id: Joi.number().integer().allow(null),
  learning_objective: Joi.string().allow(null, ''),
  tags: Joi.array().items(Joi.string()).allow(null),
  bloom_level: Joi.string().valid('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create').allow(null),
  explanation: Joi.string().allow(null, ''),
  image_url: Joi.string().uri().allow(null, '')
}).min(1);

// ===== QUESTION OPTIONS =====
const addOptionSchema = Joi.object({
  option_text: Joi.string().required().messages({
    'string.empty': 'Seçenek metni gereklidir',
    'string.required': 'Seçenek metni gereklidir'
  }),
  is_correct: Joi.boolean().default(false),
  explanation: Joi.string().allow(null, ''),
  order: Joi.number().integer().min(0).default(0)
});

const updateOptionSchema = Joi.object({
  option_text: Joi.string(),
  is_correct: Joi.boolean(),
  explanation: Joi.string().allow(null, ''),
  order: Joi.number().integer().min(0)
}).min(1);

const reorderOptionsSchema = Joi.object({
  options: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      order: Joi.number().integer().min(0).required()
    })
  ).required().messages({
    'array.base': 'Seçenekler bir dizi olmalıdır'
  })
});

// ===== BULK IMPORT =====
const bulkImportSchema = Joi.object({
  questions: Joi.array().items(
    Joi.object({
      question_text: Joi.string().required(),
      question_type: Joi.string().valid('multiple_choice', 'short_answer', 'essay', 'true_false').required(),
      difficulty_level: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
      topic_id: Joi.number().integer().allow(null),
      options: Joi.array().items(
        Joi.object({
          option_text: Joi.string().required(),
          is_correct: Joi.boolean().default(false)
        })
      ).when('question_type', {
        is: Joi.string().valid('multiple_choice', 'true_false'),
        then: Joi.required()
      })
    })
  ).min(1).required().messages({
    'array.min': 'Minimum 1 soru gereklidir'
  })
});

// ===== SEARCH =====
const searchSchema = Joi.object({
  q: Joi.string().allow(''),
  type: Joi.string().valid('multiple_choice', 'short_answer', 'essay', 'true_false').allow(null),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').allow(null),
  topic_id: Joi.number().integer().allow(null),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// Middleware validators
function validateCreate(req, res, next) {
  const { error, value } = questionCreateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateUpdate(req, res, next) {
  const { error, value } = questionUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateAddOption(req, res, next) {
  const { error, value } = addOptionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateUpdateOption(req, res, next) {
  const { error, value } = updateOptionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

function validateBulkImport(req, res, next) {
  const { error, value } = bulkImportSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.validated = value;
  next();
}

module.exports = {
  questionCreateSchema,
  questionUpdateSchema,
  addOptionSchema,
  updateOptionSchema,
  reorderOptionsSchema,
  bulkImportSchema,
  searchSchema,
  validateCreate,
  validateUpdate,
  validateAddOption,
  validateUpdateOption,
  validateBulkImport
};
