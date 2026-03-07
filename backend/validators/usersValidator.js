const Joi = require('joi');

const createSchema = Joi.object({
  full_name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password_hash: Joi.string().min(8).required(),
  role_id: Joi.number().integer().required(),
  phone_number: Joi.string().allow(null, '').max(20),
  avatar_url: Joi.string().uri().allow(null, ''),
  is_active: Joi.number().valid(0, 1).optional(),
  theme_preference: Joi.string().valid('light', 'dark').optional()
});

const updateSchema = Joi.object({
  full_name: Joi.string().min(1).max(100),
  email: Joi.string().email(),
  password_hash: Joi.string().min(8),
  role_id: Joi.number().integer(),
  phone_number: Joi.string().allow(null, '').max(20),
  avatar_url: Joi.string().uri().allow(null, ''),
  is_active: Joi.number().valid(0, 1),
  theme_preference: Joi.string().valid('light', 'dark')
}).min(1);

function respondValidationError(res, err) {
  return res.status(400).json({ error: 'validation', details: err.details.map(d => d.message) });
}

function validateCreate(req, res, next) {
  const { error } = createSchema.validate(req.body, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
}

function validateUpdate(req, res, next) {
  const { error } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
}

module.exports = { validateCreate, validateUpdate };
