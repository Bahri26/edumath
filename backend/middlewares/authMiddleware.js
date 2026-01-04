const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. Token'ı al (Header'dan)
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim! Token yok." });
  }

  try {
    // 2. Token'ı çöz
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "gizli_anahtar_123");
    
    // 3. Kullanıcı bilgisini isteğe ekle (req.user artık kullanılabilir)
    req.user = decoded; 
    
    next();
  } catch (err) {
    res.status(401).json({ message: "Geçersiz Token." });
  }
};