import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc Yeni Kullanıcı Kaydı
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, birthDate, gradeLevel } = req.body;

  // Input validation
  if (!firstName || !lastName || !email || !password || !role || !birthDate) {
    res.status(400);
    throw new Error('Lütfen tüm zorunlu alanları doldurun.');
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Geçerli bir e-posta adresi girin.');
  }

  // Password strength validation
  if (password.length < 8) {
    res.status(400);
    throw new Error('Şifre en az 8 karakter olmalıdır.');
  }
  if (!/[A-Z]/.test(password)) {
    res.status(400);
    throw new Error('Şifre en az bir büyük harf içermelidir.');
  }
  if (!/[a-z]/.test(password)) {
    res.status(400);
    throw new Error('Şifre en az bir küçük harf içermelidir.');
  }
  if (!/[0-9]/.test(password)) {
    res.status(400);
    throw new Error('Şifre en az bir rakam içermelidir.');
  }

  // Name validation
  if (firstName.length < 2 || lastName.length < 2) {
    res.status(400);
    throw new Error('Ad ve soyad en az 2 karakter olmalıdır.');
  }

  // Role validation
  if (!['student', 'teacher'].includes(role)) {
    res.status(400);
    throw new Error('Geçersiz rol türü.');
  }

  // Grade level validation for students
  if (role === 'student' && !gradeLevel) {
    res.status(400);
    throw new Error('Öğrenciler için sınıf seviyesi zorunludur.');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Bu e-posta adresi zaten kullanılıyor.');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    isStudent: role === 'student',
    isTeacher: role === 'teacher',
    birthDate,
    gradeLevel: role === 'student' ? gradeLevel : undefined, // Sadece öğrenciyse gradeLevel ekle
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: {
        isStudent: user.isStudent,
        isTeacher: user.isTeacher,
        isStaff: user.isStaff,
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Geçersiz kullanıcı verisi.');
  }
});

/**
 * @desc Kullanıcı Girişi
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    res.status(400);
    throw new Error('E-posta ve şifre gereklidir.');
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Geçerli bir e-posta adresi girin.');
  }

  // Şifre dahil tüm kullanıcı bilgilerini çek
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: {
        isStudent: user.isStudent,
        isTeacher: user.isTeacher,
        isStaff: user.isStaff,
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(401); // Unauthorized
    throw new Error('Geçersiz e-posta veya şifre.');
  }
});

export { registerUser, loginUser };
