// controllers/authController.js

const authService = require('../services/authService');
const { validationResult } = require('express-validator'); // Rota seviyesindeki validasyon hatalarını yakalamak için

// -----------------------------------------------------------------
// 1. Kullanıcı Kaydı (Register) Controller
// -----------------------------------------------------------------
const register = async (req, res, next) => {
  // Try-catch bloğu kullanıyoruz, servis katmanından fırlatılan hataları yakalamak için.
  try {
    // 1. Validasyon Kontrolü: routes/authRoutes.js'te tanımlanan hataları yakalar
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validasyon hatası.', 
        errors: errors.array() 
      });
    }

    // 2. Servis Çağrısı: Tüm iş mantığı ve veritabanı işlemi Service katmanında yapılır
    const userData = req.body;
    const user = await authService.registerUser(userData);

    // 3. Başarılı Cevap: 201 Created (Yeni bir kaynak oluşturulduğu için)
    res.status(201).json({
      success: true,
      data: user,
      message: 'Kayıt işlemi başarıyla tamamlandı.'
    });

  } catch (error) {
    // 4. Hata Yönetimi: Servisten gelen hataları HTTP durum koduyla geri döndür
    // Serviste 400/401 olarak işaretlediğimiz hataları kullanırız, yoksa 500 döneriz.
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Sunucu hatası: Kayıt işlemi tamamlanamadı.'
    });
    // Global error handler'ı kullanmak istersen 'next(error)' diyebilirsin.
  }
};


// -----------------------------------------------------------------
// 2. Kullanıcı Girişi (Login) Controller
// -----------------------------------------------------------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validasyon Kontrolü (Email ve şifrenin varlığı kontrol edilir)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lütfen tüm alanları doldurunuz.', 
        errors: errors.array() 
      });
    }
    
    // 2. Servis Çağrısı
    const user = await authService.loginUser(email, password);

    // 3. Başarılı Cevap: 200 OK
    res.status(200).json({
      success: true,
      data: user,
      message: 'Giriş başarılı.'
    });

  } catch (error) {
    // 4. Hata Yönetimi
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Sunucu hatası: Giriş yapılamadı.'
    });
  }
};

module.exports = { 
  register, 
  login 
};