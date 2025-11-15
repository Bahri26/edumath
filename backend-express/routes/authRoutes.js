// backend-express/routes/authRoutes.js (GÜNCEL HALİ)

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { loginValidation, registerValidation } = require('../middleware/validation');
const { sanitizeInput } = require('../utils/sanitize');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

// --- KAYIT (REGISTER) ENDPOINT ---
// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
  
  // ÖNEMLİ: server.js'de express.json() ayarlı olduğu için req.body dolu gelmeli.
  console.log("Alınan Kayıt Verisi (req.body):", req.body); 

  // Frontend'den gelen tüm alanları al
  const sanitized = sanitizeInput(req.body);
  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    role, 
    birthDate,
    gradeLevel
  } = sanitized;

  try {
    // 1. E-posta adresi zaten var mı diye kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
    }
    
    // 2. Role string'ini boolean alanlara çevir
    const isStudent = role === 'student';
    const isTeacher = role === 'teacher';

    // 3. Yeni kullanıcıyı oluştur
    const newUser = new User({
      email,
      password,
      firstName, 
      lastName,  
      isStudent, // Boolean rol
      isTeacher, // Boolean rol
      birthDate, // YENİ
      // Sadece öğrenciyse sınıf düzeyini ayarla
      gradeLevel: isStudent ? gradeLevel : undefined 
    });

    // 4. Kullanıcıyı kaydet (Bu aşamada 'pre-save' hook ve validasyonlar çalışır)
    await newUser.save(); 

    // 5. Başarılı yanıtı döndür (201 Created)
    res.status(201).json({ message: `Kullanıcı '${newUser.email}' başarıyla oluşturuldu.` });

  } catch (error) {
    // Model validasyon hatasını (örn: "Doğum tarihi zorunludur") yakala
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        let errorMessage = messages.join(' | '); 
        return res.status(400).json({ message: errorMessage }); 
    }
    
    // Diğer tüm sunucu hatalarını 500 olarak döndür
    console.error('Kayıt sırasında bilinmeyen sunucu hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası. Lütfen backend terminalini kontrol edin.' });
  }
});

// --- LOGIN (GİRİŞ) ENDPOINT ---
// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  const { email, password } = sanitizeInput(req.body);

    if (!email || !password) {
        return res.status(400).json({ message: 'E-posta ve şifre alanları zorunludur.' });
    }

    try {
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
      }

      const roles = {
          isStudent: user.isStudent,
          isTeacher: user.isTeacher,
          isAdmin: user.isAdmin 
      };
      
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
          // Geriye uyumluluk için eski alan
          token: accessToken,
          accessToken,
          refreshToken,
          user: {
              id: user._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              fullName: user.fullName,
              roles: roles,
              gradeLevel: user.gradeLevel
          }
      });

    } catch (error) {
        console.error('Login hatası:', error);
        res.status(500).json({ message: 'Giriş sırasında bir hata oluştu.' });
    }
});


module.exports = router;

// Refresh token endpoint'i
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token gerekli' });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    const newAccessToken = generateAccessToken(decoded.id);
    return res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Geçersiz refresh token' });
  }
});