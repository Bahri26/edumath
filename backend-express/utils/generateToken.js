// backend-express/utils/generateToken.js

const jwt = require('jsonwebtoken');

// Token'ın ne kadar süre geçerli olacağını tanımlayalım
const MAX_AGE = 3 * 24 * 60 * 60; // 3 gün (saniye cinsinden)

const generateToken = (id) => {
  // jwt.sign(payload, secretKey, options)
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: MAX_AGE,
  });
};

module.exports = generateToken;