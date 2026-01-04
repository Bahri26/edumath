// middlewares/errorHandler.js

/**
 * Global Hata Yakalama Middleware'i.
 * Controller'lar tarafından next(error) ile fırlatılan tüm hataları burada yakalarız.
 */
const errorHandler = (err, req, res, next) => {
    // Sunucu tarafında hatayı logla (Debug için önemli)
    console.error(err.stack); 

    // HTTP durum kodunu belirle (Servis katmanından geleni kullan, yoksa 500)
    const statusCode = err.statusCode || 500;

    // Frontend'e JSON cevabı dön
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Sunucu İç Hatası',
        // Geliştirme ortamında stack trace'i göster
        stack: process.env.NODE_ENV === 'development' ? err.stack : null 
    });
};

module.exports = errorHandler;
// 🚨 KRİTİK: Middleware fonksiyonu dışa aktarıldı.