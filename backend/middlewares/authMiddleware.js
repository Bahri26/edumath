const jwt = require('jsonwebtoken');

function extractBearerToken(req) {
  const auth = req.header('Authorization') || req.header('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const alt = req.header('X-Access-Token') || req.header('x-access-token');
  if (alt) return String(alt).trim();
  return '';
}

module.exports = (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    const wantsHtml = String(req.headers?.accept || '').includes('text/html');
    return res.status(401).json({
      message: wantsHtml
        ? 'Oturum gerekli. Lütfen https://edumath-client.onrender.com adresinden giriş yapın; API adresini tarayıcıda doğrudan açmayın.'
        : 'Yetkisiz erişim! Token yok. Lütfen yeniden giriş yapın.',
      code: 'NO_TOKEN',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || String(secret).trim() === '') {
      return res.status(500).json({ message: 'Sunucu yapılandırma hatası: JWT_SECRET eksik.' });
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Geçersiz Token. Lütfen yeniden giriş yapın.', code: 'INVALID_TOKEN' });
  }
};
