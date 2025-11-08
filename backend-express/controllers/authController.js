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
