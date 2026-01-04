const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const validate = require('../middlewares/validationMiddleware');
const User = require('../models/User'); // User modelini çağırıyoruz
const RefreshToken = require('../models/RefreshToken');
const mailer = require('../services/mailerService');

const JWT_SECRET = process.env.JWT_SECRET || "gizli_anahtar_123";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "gizli_yenile_anahtar_123";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || '30');

// Helpers
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateAccessToken = (user) => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
const generateRefreshToken = (user) => jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d` });

// Joi şemaları
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'teacher', 'admin').default('student'),
  grade: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

const requestResetSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required()
});

const requestVerifySchema = Joi.object({
  email: Joi.string().email().required()
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().required()
});
// Public reset request schema
const publicResetRequestSchema = Joi.object({
  email: Joi.string().email().required(),
  note: Joi.string().max(500).optional()
});
const PasswordResetRequest = require('../models/PasswordResetRequest');

// --- KAYIT OL ---
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role, grade } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta zaten kayıtlı." });
    }

    // Şifreleme
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kayıt
    const newUser = new User({
      name, email, password: hashedPassword, role, grade,
      status: 'pending', // Admin onayı gerekli
      mustChangePassword: false
    });
    await newUser.save();

    res.status(201).json({ message: "Kayıt oluşturuldu, admin onayı bekleniyor." });
  } catch (error) {
    console.error("Register Hatası:", error); // Terminalde hatayı gösterir
    res.status(500).json({ message: "Sunucu hatası: " + error.message });
  }
});

// --- GİRİŞ YAP ---
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı." });

    // Hesap durumu kontrolü
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Hesabınız admin onayı bekliyor.' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Hesabınız devre dışı bırakılmış.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı." });

    // Access & Refresh token üret
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Refresh token'ı DB'ye (hash'lenmiş olarak) kaydet ve expiry ayarla
    const hashed = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user: user._id, hashedToken: hashed, expiresAt });

    res.json({ 
      token: accessToken, 
      refreshToken, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword } 
    });
  } catch (error) {
    console.error("Login Hatası:", error);
    res.status(500).json({ message: "Giriş hatası: " + error.message });
  }
});

// --- REFRESH TOKEN ---
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken gerekli.' });

    // JWT doğrula
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş refresh token.' });
    }

    // DB'de token var mı ve revoked değil mi?
    const hashed = hashToken(refreshToken);
    const stored = await RefreshToken.findOne({ user: payload.id, hashedToken: hashed });
    if (!stored) return res.status(401).json({ message: 'Refresh token bulunamadı.' });
    if (stored.revoked) return res.status(401).json({ message: 'Refresh token iptal edilmiş.' });
    if (stored.expiresAt < new Date()) return res.status(401).json({ message: 'Refresh token süresi dolmuş.' });

    // Rotation: eski token'ı revoke et, yeni refresh token oluştur
    const newRefresh = generateRefreshToken({ _id: payload.id });
    const newHashed = hashToken(newRefresh);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
    stored.revoked = true;
    stored.replacedByToken = newHashed;
    await stored.save();
    await RefreshToken.create({ user: payload.id, hashedToken: newHashed, expiresAt: newExpiresAt });

    // Yeni access token üret
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    const newAccess = generateAccessToken(user);

    res.json({ token: newAccess, refreshToken: newRefresh });
  } catch (error) {
    console.error('Refresh Hatası:', error);
    res.status(500).json({ message: 'Refresh hatası: ' + error.message });
  }
});

// --- LOGOUT (Refresh token revoke) ---
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken gerekli.' });

    const hashed = hashToken(refreshToken);
    const stored = await RefreshToken.findOne({ hashedToken: hashed });
    if (!stored) return res.status(200).json({ message: 'Zaten çıkış yapıldı.' });
    stored.revoked = true;
    await stored.save();
    res.json({ message: 'Çıkış yapıldı.' });
  } catch (error) {
    console.error('Logout Hatası:', error);
    res.status(500).json({ message: 'Logout hatası: ' + error.message });
  }
});

// --- REQUEST PASSWORD RESET ---
router.post('/request-password-reset', validate(requestResetSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'Eğer e-posta kayıtlı ise talimat gönderildi.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(rawToken);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika
    user.passwordResetToken = hashed;
    user.passwordResetExpires = expires;
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await mailer.sendMail({
      to: email,
      subject: 'Şifre Sıfırlama Talimatı',
      text: `Şifrenizi sıfırlamak için bağlantı: ${resetLink}\nBu bağlantı 15 dakika geçerlidir.`,
      html: `<p>Şifrenizi sıfırlamak için <a href="${resetLink}">bu bağlantıyı</a> kullanın.</p><p>Bağlantı 15 dakika geçerlidir.</p>`
    });

    res.json({ message: 'Eğer e-posta kayıtlı ise talimat gönderildi.' });
  } catch (error) {
    console.error('Request Password Reset Hatası:', error);
    res.status(500).json({ message: 'İstek hatası: ' + error.message });
  }
});

// --- RESET PASSWORD ---
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Geçersiz talep.' });

    const hashed = hashToken(token);
    if (!user.passwordResetToken || user.passwordResetToken !== hashed) {
      return res.status(400).json({ message: 'Geçersiz veya daha önce kullanılmış token.' });
    }
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ message: 'Token süresi dolmuş.' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Güvenlik: mevcut refresh token'ları iptal et
    await RefreshToken.updateMany({ user: user._id, revoked: false }, { $set: { revoked: true } });

    res.json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error) {
    console.error('Reset Password Hatası:', error);
    res.status(500).json({ message: 'Sıfırlama hatası: ' + error.message });
  }
});

// --- REQUEST EMAIL VERIFY ---
router.post('/request-email-verify', validate(requestVerifySchema), async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'Eğer e-posta kayıtlı ise doğrulama gönderildi.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(rawToken);
    user.emailVerificationToken = hashed;
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${baseUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await mailer.sendMail({
      to: email,
      subject: 'E-posta Doğrulama',
      text: `E-postanızı doğrulamak için bağlantı: ${verifyLink}`,
      html: `<p>E-postanızı doğrulamak için <a href="${verifyLink}">bu bağlantıyı</a> kullanın.</p>`
    });

    res.json({ message: 'Eğer e-posta kayıtlı ise doğrulama gönderildi.' });
  } catch (error) {
    console.error('Request Email Verify Hatası:', error);
    res.status(500).json({ message: 'Doğrulama isteği hatası: ' + error.message });
  }
});

// --- VERIFY EMAIL ---
router.post('/verify-email', validate(verifyEmailSchema), async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Geçersiz talep.' });

    const hashed = hashToken(token);
    if (!user.emailVerificationToken || user.emailVerificationToken !== hashed) {
      return res.status(400).json({ message: 'Geçersiz token.' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'E-posta doğrulandı.' });
  } catch (error) {
    console.error('Verify Email Hatası:', error);
    res.status(500).json({ message: 'Doğrulama hatası: ' + error.message });
  }
});

// --- PUBLIC: CREATE PASSWORD RESET REQUEST (No auth required) ---
router.post('/password-reset-request', validate(publicResetRequestSchema), async (req, res) => {
  try {
    const { email, note } = req.body;
    await PasswordResetRequest.create({ email, note });
    res.json({ message: 'Şifre sıfırlama talebiniz alındı. Yönetici onayı sonrası bilgilendirileceksiniz.' });
  } catch (error) {
    console.error('Create Reset Request Hatası:', error);
    res.status(500).json({ message: 'Talep hatası: ' + error.message });
  }
});

module.exports = router;