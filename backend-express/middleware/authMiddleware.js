// backend-express/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Kullanıcı modelini import et

// Bu fonksiyon, korumalı route'lara erişimden önce çalışır.
const protect = async (req, res, next) => {
  let token;

  // 1. Header'da 'Authorization' alanını kontrol et
  // Format: "Bearer TOKEN_STRING"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token'ı al (Bearer kısmını atla)
      token = req.headers.authorization.split(' ')[1];

      // 2. Token'ı Doğrula (Verify)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Kullanıcıyı ID'sine göre bul ve req objesine ekle (Şifresiz olarak)
      // Bu, korumalı route'larda 'req.user' ile kullanıcıya erişmemizi sağlar.
      req.user = await User.findById(decoded.id).select('-password');

      // 4. Bir sonraki middleware'e veya route handler'a geç
      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      // Geçersiz token veya token süresi dolmuşsa 401 döndür
      res.status(401).json({ message: 'Yetkilendirme başarısız, geçersiz token.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Yetkilendirme başarısız, token bulunamadı.' });
  }
};

// Rol bazlı yetkilendirme (Öğretmen mi? Öğrenci mi?)
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
    } else if (role === 'admin' && req.user.isStaff) {
        isAuthorized = true;
    }

    if (isAuthorized) {
        next(); // Yetkisi varsa devam et
    } else {
        // Yetkisi yoksa 403 Forbidden döndür
        res.status(403).json({ message: `Erişim reddedildi. ${role} yetkisi gereklidir.` });
    }
};

module.exports = { protect, checkRole };