const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const getPrisma = require('./prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'gizli_yenile_anahtar_123';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || '30');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateAccessToken = (user) => {
  const id = user.id || user._id;
  const role = user.role;
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};
const generateRefreshToken = (user) => {
  const id = user.id || user._id;
  return jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d` });
};

async function registerUser({ name, email, password, role = 'student', grade, status = 'pending' }) {
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Bu e-posta zaten kayıtlı.'), { statusCode: 400 });

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  const salt = await bcrypt.genSalt(rounds);
  const hashed = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, grade, status, mustChangePassword: false },
  });

  return user;
}

async function loginUser(email, password) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Kullanıcı bulunamadı.'), { statusCode: 400 });

  if (user.status === 'pending') throw Object.assign(new Error('Hesabınız admin onayı bekliyor.'), { statusCode: 403 });
  if (user.status === 'disabled') throw Object.assign(new Error('Hesabınız devre dışı bırakılmış.'), { statusCode: 403 });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw Object.assign(new Error('Şifre hatalı.'), { statusCode: 400 });

  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const hashed = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId: user.id, hashedToken: hashed, expiresAt } });

  return { token, refreshToken, user };
}

async function refreshAccessToken(refreshToken) {
  const prisma = getPrisma();
  if (!refreshToken) throw Object.assign(new Error('refreshToken gerekli.'), { statusCode: 400 });

  let payload;
  try { payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET); } 
  catch { throw Object.assign(new Error('Geçersiz veya süresi dolmuş refresh token.'), { statusCode: 401 }); }

  const hashed = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { hashedToken: hashed } });
  if (!stored) throw Object.assign(new Error('Refresh token bulunamadı.'), { statusCode: 401 });
  if (stored.revoked) throw Object.assign(new Error('Refresh token iptal edilmiş.'), { statusCode: 401 });
  if (stored.expiresAt < new Date()) throw Object.assign(new Error('Refresh token süresi dolmuş.'), { statusCode: 401 });

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw Object.assign(new Error('Kullanıcı bulunamadı.'), { statusCode: 401 });

  // Rotation
  const newRefresh = generateRefreshToken(user);
  const newHashed = hashToken(newRefresh);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.update({ where: { hashedToken: hashed }, data: { revoked: true, replacedByToken: newHashed } });
  await prisma.refreshToken.create({ data: { userId: user.id, hashedToken: newHashed, expiresAt: newExpiresAt } });

  const newAccess = generateAccessToken(user);
  return { token: newAccess, refreshToken: newRefresh };
}

async function revokeRefreshToken(refreshToken) {
  const prisma = getPrisma();
  if (!refreshToken) throw Object.assign(new Error('refreshToken gerekli.'), { statusCode: 400 });
  const hashed = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { hashedToken: hashed } });
  if (!stored) return { message: 'Zaten çıkış yapıldı.' };
  await prisma.refreshToken.update({ where: { hashedToken: hashed }, data: { revoked: true } });
  return { message: 'Çıkış yapıldı.' };
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  revokeRefreshToken,
};
