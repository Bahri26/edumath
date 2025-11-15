const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin').normalizeEmail(),
  body('password').isString().trim().notEmpty().withMessage('Şifre boş olamaz'),
  validate,
];

const registerValidation = [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır')
    .matches(/[A-Z]/)
    .withMessage('Şifre en az bir büyük harf içermelidir')
    .matches(/[a-z]/)
    .withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[0-9]/)
    .withMessage('Şifre en az bir rakam içermelidir'),
  body('firstName').trim().isLength({ min: 2 }).withMessage('Ad en az 2 karakter olmalıdır'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Soyad en az 2 karakter olmalıdır'),
  body('role').isIn(['student', 'teacher']).withMessage('Geçersiz rol türü'),
  body('birthDate').notEmpty().withMessage('Doğum tarihi zorunludur'),
  body('gradeLevel')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Öğrenciler için sınıf seviyesi zorunludur'),
  validate,
];

module.exports = { loginValidation, registerValidation };
