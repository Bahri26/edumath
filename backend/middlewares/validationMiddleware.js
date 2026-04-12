// middlewares/validationMiddleware.js
// Joi ile gelen istekleri doğrulamak için basit middleware

module.exports = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz istek verisi',
        details: error.details.map(d => ({ message: d.message, path: d.path }))
      });
    }
    // Temizlenmiş veriyi geri yaz
    req[property] = value;
    next();
  };
};
