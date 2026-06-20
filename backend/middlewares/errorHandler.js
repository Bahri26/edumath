// middlewares/errorHandler.js

/**
 * Global Hata Yakalama Middleware'i.
 * Controller'lar tarafından next(error) ile fırlatılan tüm hataları burada yakalarız.
 */
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const isProd = process.env.NODE_ENV === 'production';

    res.status(statusCode).json({
        success: false,
        message: isProd && statusCode >= 500
            ? 'Sunucu iç hatası. Lütfen daha sonra tekrar deneyin.'
            : (err.message || 'Sunucu İç Hatası'),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorHandler;
// 🚨 KRİTİK: Middleware fonksiyonu dışa aktarıldı.