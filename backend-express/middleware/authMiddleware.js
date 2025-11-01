// backend-express/middleware/authMiddleware.js (TAM VE GÜNCEL SON HAL)

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Kullanıcı modelini import et

// Bu fonksiyon, korumalı route'lara erişimden önce çalışır.
const protect = async (req, res, next) => {
  let token;

  // 1. Header'da 'Authorization' alanını kontrol et
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 2. Token'ı Doğrula (Verify)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Kullanıcıyı ID'sine göre bul ve req objesine ekle
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      res.status(401).json({ message: 'Yetkilendirme başarısız, geçersiz token.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Yetkilendirme başarısız, token bulunamadı.' });
  }
};

// Rol bazlı yetkilendirme (Yüksek mertebeden fonksiyon)
const checkRole = (role) => (req, res, next) => {
    // protect middleware'i zaten çalışıp req.user'ı ekledi
    if (!req.user) {
        return res.status(401).json({ message: 'Önce giriş yapmalısınız.' });
    }

    let isAuthorized = false;
    
    // Rol kontrolü (isTeacher, isStudent, isStaff kontrolü)
    if (role === 'teacher' && req.user.isTeacher) {
        isAuthorized = true;
    } else if (role === 'student' && req.user.isStudent) {
        isAuthorized = true;
    } else if (role === 'admin' && req.user.isStaff) { // isStaff alanı admin rolü için varsayılmıştır
        isAuthorized = true;
    }

    if (isAuthorized) {
        next(); // Yetkisi varsa devam et
    } else {
        res.status(403).json({ message: `Erişim reddedildi. ${role} yetkisi gereklidir.` });
    }
};

// --- KRİTİK DÜZELTME: İhtiyaç duyulan rolleri checkRole ile tanımla ---
const teacherCheck = checkRole('teacher'); // resultRoutes.js için zorunlu
const studentCheck = checkRole('student');
// --- KRİTİK DÜZELTME SONU ---


module.exports = { 
    protect, 
    checkRole, 
    teacherCheck, // <-- resultRoutes.js'deki hatayı çözen dışa aktarım
    studentCheck
};