// Gerekli bağımlılıkları import ediyoruz
import asyncHandler from 'express-async-handler'; // Express'te asenkron hataları yönetmek için (kurulu olduğunu varsayıyorum)
import User from '../models/User.js'; // Kullanıcı modeli
import generateToken from '../utils/generateToken.js'; // JWT token oluşturma utility'si

/**
 * @desc Yeni Kullanıcı Kaydı
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Kullanıcının zaten var olup olmadığını kontrol et
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400); // Bad Request
    throw new Error('Bu e-posta adresi zaten kullanılıyor.');
  }

  // 2. Yeni kullanıcı oluştur
  // Şifrenin hash'lenmesi, User modelinin pre('save') hook'u içinde gerçekleşecek.
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // 3. Başarılıysa kullanıcı verilerini ve JWT token'ı döndür
    res.status(201).json({ // 201 Created
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id), // Kullanıcı ID'si ile token oluştur
    });
  } else {
    res.status(400);
    throw new Error('Geçersiz kullanıcı verisi.');
  }
});

export { registerUser };