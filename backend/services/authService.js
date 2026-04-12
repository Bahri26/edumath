const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper: JWT Token Oluştur
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'gizli_anahtar_123',
    { expiresIn: '7d' }
  );
};

// 1. KULLANICI KAYDI (Register)
exports.registerUser = async (userData) => {
  try {
    const { name, email, password, role } = userData;

    // Email zaten kayıtlı mı kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Bu email zaten kayıtlıdır');
      error.statusCode = 400;
      throw error;
    }

    // Yeni kullanıcı oluştur
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'student'
    });

    await newUser.save();

    // Token oluştur
    const token = generateToken(newUser);

    // Döndür (şifre hariç)
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;

    return {
      user: userWithoutPassword,
      token,
      message: 'Kayıt işlemi başarılı'
    };
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    throw error;
  }
};

// 2. KULLANICI GİRİŞİ (Login)
exports.loginUser = async (email, password) => {
  try {
    // Email ve şifre boş mı kontrol et
    if (!email || !password) {
      const error = new Error('Email ve şifre gereklidir');
      error.statusCode = 400;
      throw error;
    }

    // Kullanıcı bul (şifreyi dahil et)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      const error = new Error('Kullanıcı bulunamadı');
      error.statusCode = 401;
      throw error;
    }

    // Şifre doğru mu kontrol et
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      const error = new Error('Şifre yanlış');
      error.statusCode = 401;
      throw error;
    }

    // Token oluştur
    const token = generateToken(user);

    // Döndür (şifre hariç)
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return {
      user: userWithoutPassword,
      token,
      message: 'Giriş başarılı'
    };
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    throw error;
  }
};

module.exports = exports;