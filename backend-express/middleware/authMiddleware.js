// backend-express/middleware/authMiddleware.js (İYİLEŞTİRİLMİŞ)

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama ve kullanıcı kimlik kontrolü
const protect = async (req, res, next) => {
  let token;

  // 1. Header'da 'Authorization' alanını kontrol et
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token'ı ayıkla
      token = req.headers.authorization.split(' ')[1];
      
      // 2. Token'ı Doğrula (Verify)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Kullanıcıyı ID'sine göre bul ve req objesine ekle
      const user = await User.findById(decoded.id).select('-password');
      
      // Kullanıcı silinmiş veya bulunamıyorsa
      if (!user) {
        return res.status(401).json({ 
          message: 'Kullanıcı bulunamadı. Token geçersiz.' 
        });
      }

      // Kullanıcı bilgilerini request'e ekle
      req.user = user;
      
      next(); // Bir sonraki middleware'e geç
      
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      
      // Token expire olmuşsa özel mesaj
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token süresi doldu. Lütfen yeniden giriş yapın.',
          expired: true 
        });
      }
      
      // Token formatı yanlışsa
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Geçersiz token formatı.' 
        });
      }
      
      // Diğer hatalar
      return res.status(401).json({ 
        message: 'Yetkilendirme başarısız, geçersiz token.' 
      });
    }
  } else {
    // ✅ DÜZELTME: Token yoksa return ekledik
    return res.status(401).json({ 
      message: 'Yetkilendirme başarısız, token bulunamadı.' 
    });
  }
};

// Rol bazlı yetkilendirme (Higher-order function)
const checkRole = (...roles) => (req, res, next) => {
  // protect middleware'i zaten çalışıp req.user'ı ekledi
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Önce giriş yapmalısınız.' 
    });
  }

  let isAuthorized = false;
  
  // Birden fazla rol kontrolü (flexible)
  // Hem nested (roles.isTeacher) hem de düz (isTeacher) yapıyı destekle
  if (roles.includes('teacher') && (req.user.roles?.isTeacher || req.user.isTeacher)) {
    isAuthorized = true;
  }
  if (roles.includes('student') && (req.user.roles?.isStudent || req.user.isStudent)) {
    isAuthorized = true;
  }
  if (roles.includes('admin') && (req.user.roles?.isStaff || req.user.isStaff)) {
    isAuthorized = true;
  }

  if (isAuthorized) {
    next(); // Yetkisi varsa devam et
  } else {
    return res.status(403).json({ 
      message: `Erişim reddedildi. Gerekli rol: ${roles.join(' veya ')}` 
    });
  }
};

// Önceden tanımlanmış rol kontrol fonksiyonları
const teacherCheck = checkRole('teacher');
const studentCheck = checkRole('student');
const adminCheck = checkRole('admin');

// Birden fazla rol kabul eden kontroller
const teacherOrAdmin = checkRole('teacher', 'admin');
const anyRole = checkRole('teacher', 'student', 'admin');

module.exports = { 
  protect, 
  checkRole, 
  teacherCheck,
  studentCheck,
  adminCheck,
  teacherOrAdmin,
  anyRole
};