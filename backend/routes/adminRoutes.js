const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Joi = require('joi');
const auth = require('../middlewares/authMiddleware');
const hasRole = require('../middlewares/roleMiddleware');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AdminAudit = require('../models/AdminAudit');
const RefreshToken = require('../models/RefreshToken');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// List pending requests
router.get('/password-reset-requests', auth, hasRole(['admin']), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const items = await PasswordResetRequest.find({ status }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (error) {
    console.error('List Reset Requests Hatası:', error);
    res.status(500).json({ message: 'Listeleme hatası: ' + error.message });
  }
});

// Approve a request: issue token on user
router.post('/password-reset-requests/:id/approve', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const reqDoc = await PasswordResetRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Talep bulunamadı.' });
    if (reqDoc.status !== 'pending') return res.status(400).json({ message: 'Talep zaten işlenmiş.' });

    const user = await User.findOne({ email: reqDoc.email });
    if (!user) return res.status(404).json({ message: 'E-posta ile eşleşen kullanıcı bulunamadı.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(rawToken);
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.passwordResetToken = hashed;
    user.passwordResetExpires = expires;
    await user.save();

    reqDoc.status = 'approved';
    reqDoc.approverUser = req.user.id;
    reqDoc.tokenIssued = true;
    reqDoc.issuedTokenHash = hashed;
    reqDoc.expiresAt = expires;
    await reqDoc.save();
    // Audit log
    try {
      await AdminAudit.create({
        actorId: req.user.id,
        action: 'approve_reset',
        targetUserId: user._id,
        targetEmail: user.email,
        requestId: reqDoc._id,
        metadata: { expiresAt: expires }
      });
    } catch {}

    // Create notification for token-based reset
    try {
      await Notification.create({
        recipientId: user._id,
        senderId: req.user.id,
        title: 'Şifre Sıfırlama Onayı',
        message: 'Şifre sıfırlama talebiniz onaylandı. Bu kod ile şifrenizi güncelleyebilirsiniz.',
        type: 'system',
        actionUrl: '/reset-password',
        metadata: { rawToken, expiresAt: expires, email: user.email }
      });
    } catch (e) { console.warn('Notification create failed:', e?.message); }

    res.json({ message: 'Talep onaylandı.', rawToken, expiresAt: expires });
  } catch (error) {
    console.error('Approve Reset Request Hatası:', error);
    res.status(500).json({ message: 'Onay hatası: ' + error.message });
  }
});

// Approve a request by setting a new password directly
router.post('/password-reset-requests/:id/approve-set-password', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, mustChange } = req.body;
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Yeni şifre gereklidir.' });
    }
    // Strong password policy: min 8, upper, lower, number, special
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strong.test(newPassword)) {
      return res.status(400).json({ message: 'Şifre en az 8 karakter olmalı ve büyük/küçük harf, rakam ve sembol içermelidir.' });
    }

    const reqDoc = await PasswordResetRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Talep bulunamadı.' });
    if (reqDoc.status !== 'pending') return res.status(400).json({ message: 'Talep zaten işlenmiş.' });

    const user = await User.findOne({ email: reqDoc.email });
    if (!user) return res.status(404).json({ message: 'E-posta ile eşleşen kullanıcı bulunamadı.' });

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = !!mustChange;
    // Eski reset token varsa temizle
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    reqDoc.status = 'approved';
    reqDoc.approverUser = req.user.id;
    reqDoc.tokenIssued = false;
    reqDoc.issuedTokenHash = undefined;
    reqDoc.expiresAt = undefined;
    await reqDoc.save();

    // Create notification for direct password assignment
    try {
      await Notification.create({
        recipientId: user._id,
        senderId: req.user.id,
        title: 'Şifreniz Güncellendi',
        message: 'Şifreniz admin tarafından güncellendi. Yeni şifre ile giriş yapabilirsiniz.',
        type: 'system',
        actionUrl: '/login',
        metadata: { email: user.email }
      });
    } catch (e) { console.warn('Notification create failed:', e?.message); }

    // Audit log
    try {
      await AdminAudit.create({
        actorId: req.user.id,
        action: 'set_password',
        targetUserId: user._id,
        targetEmail: user.email,
        requestId: reqDoc._id,
        metadata: { mustChange: !!mustChange }
      });
    } catch {}

    res.json({ message: 'Talep onaylandı ve yeni şifre kullanıcıya atandı.' });
  } catch (error) {
    console.error('Approve Reset Request (Set Password) Hatası:', error);
    res.status(500).json({ message: 'Onay/şifre atama hatası: ' + error.message });
  }
});

// Deny a request
router.post('/password-reset-requests/:id/deny', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const reqDoc = await PasswordResetRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Talep bulunamadı.' });
    if (reqDoc.status !== 'pending') return res.status(400).json({ message: 'Talep zaten işlenmiş.' });

    reqDoc.status = 'denied';
    reqDoc.approverUser = req.user.id;
    await reqDoc.save();

    // Audit log
    try {
      await AdminAudit.create({
        actorId: req.user.id,
        action: 'deny_reset',
        targetEmail: reqDoc.email,
        requestId: reqDoc._id
      });
    } catch {}

    res.json({ message: 'Talep reddedildi.' });
  } catch (error) {
    console.error('Deny Reset Request Hatası:', error);
    res.status(500).json({ message: 'Reddetme hatası: ' + error.message });
  }
});

// --- USERS: List pending registrations ---
router.get('/users', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { status = 'pending', role = 'all', q = '', page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (role && role !== 'all') filter.role = role;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      User.find(filter).select('name email role status createdAt').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    res.json({ items, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    console.error('List Users Hatası:', error);
    res.status(500).json({ message: 'Kullanıcı listeleme hatası: ' + error.message });
  }
});

// --- USERS: Approve registration (optional temp password) ---
router.post('/users/:id/approve', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { tempPassword } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    user.status = 'active';
    if (tempPassword) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(tempPassword, salt);
      user.mustChangePassword = true;
    }
    await user.save();
    // Notification
    try {
      await Notification.create({
        recipientId: user._id,
        senderId: req.user.id,
        title: 'Hesabınız Onaylandı',
        message: 'Hesabınız admin tarafından onaylandı. Giriş yapabilirsiniz.',
        type: 'system',
        actionUrl: '/login',
        metadata: { email: user.email }
      });
    } catch {}
    // Audit
    try {
      await AdminAudit.create({
        actorId: req.user.id,
        action: 'approve_user',
        targetUserId: user._id,
        targetEmail: user.email,
        metadata: { mustChangePassword: user.mustChangePassword }
      });
    } catch {}
    res.json({ message: 'Kullanıcı onaylandı.', mustChangePassword: user.mustChangePassword });
  } catch (error) {
    console.error('Approve User Hatası:', error);
    res.status(500).json({ message: 'Onay hatası: ' + error.message });
  }
});

// --- USERS: Set temporary password (force change) ---
router.post('/users/:id/set-password', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'Yeni şifre gereklidir.' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = true;
    await user.save();
    try {
      await AdminAudit.create({ actorId: req.user.id, action: 'admin_set_password', targetUserId: user._id, targetEmail: user.email });
    } catch {}
    res.json({ message: 'Geçici şifre atandı. Kullanıcı ilk girişten sonra şifreyi değiştirmelidir.' });
  } catch (error) {
    console.error('Set Password Hatası:', error);
    res.status(500).json({ message: 'Şifre atama hatası: ' + error.message });
  }
});

// --- ADMIN STATS ---
router.get('/stats', auth, hasRole(['admin']), async (req, res) => {
  try {
    const [pendingResetCount, pendingUserCount, studentsCount, teachersCount, adminsCount, activeUsersCount, disabledUsersCount, unreadNotifs] = await Promise.all([
      PasswordResetRequest.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'disabled' }),
      Notification.countDocuments({ recipientId: req.user.id, isRead: false })
    ]);

    const recentResetRequests = await PasswordResetRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 }).limit(5).select('email note createdAt');
    const recentPendingUsers = await User.find({ status: 'pending' })
      .sort({ createdAt: -1 }).limit(5).select('name email role createdAt');

    res.json({
      metrics: {
        pendingResetCount,
        pendingUserCount,
        studentsCount,
        teachersCount,
        adminsCount,
        activeUsersCount,
        disabledUsersCount,
        unreadNotifications: unreadNotifs
      },
      recent: {
        resetRequests: recentResetRequests,
        pendingUsers: recentPendingUsers
      }
    });
  } catch (error) {
    console.error('Admin stats hatası:', error);
    res.status(500).json({ message: 'İstatistik hatası: ' + error.message });
  }
});

// Export after all route registrations to avoid ordering issues

// --- BRANŞ ONAY AKIŞI ---
// Liste: onay bekleyen öğretmen branş talepleri
router.get('/branch-requests', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    const filter = { role: 'teacher', branchApproval: 'pending' };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { branch: { $regex: q, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      User.find(filter).select('name email branch branchApproval createdAt').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    res.json({ items, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    console.error('List Branch Requests Hatası:', error);
    res.status(500).json({ message: 'Listeleme hatası: ' + error.message });
  }
});

// Onayla: öğretmen branşını aktif et
router.post('/branch-requests/:id/approve', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    if (user.role !== 'teacher') return res.status(400).json({ message: 'Sadece öğretmen talepleri onaylanabilir.' });
    if (!user.branch) return res.status(400).json({ message: 'Branş belirtilmemiş.' });
    user.branchApproval = 'approved';
    await user.save();
    try {
      await AdminAudit.create({ actorId: req.user.id, action: 'approve_branch', targetUserId: user._id, targetEmail: user.email, metadata: { branch: user.branch } });
    } catch {}
    try {
      await Notification.create({ recipientId: user._id, senderId: req.user.id, title: 'Branş Onayı', message: `Branşınız (${user.branch}) admin tarafından onaylandı.`, type: 'system' });
    } catch {}
    res.json({ message: 'Branş onaylandı.' });
  } catch (error) {
    console.error('Approve Branch Hatası:', error);
    res.status(500).json({ message: 'Onay hatası: ' + error.message });
  }
});

// Reddet: öğretmen branş talebini iptal et
router.post('/branch-requests/:id/deny', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    if (user.role !== 'teacher') return res.status(400).json({ message: 'Sadece öğretmen talepleri reddedilebilir.' });
    user.branchApproval = 'none';
    await user.save();
    try { await AdminAudit.create({ actorId: req.user.id, action: 'deny_branch', targetUserId: user._id, targetEmail: user.email, metadata: { branch: user.branch } }); } catch {}
    try { await Notification.create({ recipientId: user._id, senderId: req.user.id, title: 'Branş Talebi Reddedildi', message: 'Branş talebiniz reddedildi. Lütfen tekrar deneyin.', type: 'system' }); } catch {}
    res.json({ message: 'Branş talebi reddedildi.' });
  } catch (error) {
    console.error('Deny Branch Hatası:', error);
    res.status(500).json({ message: 'Reddetme hatası: ' + error.message });
  }
});

module.exports = router;
 
// --- USERS: Admin CRUD (create, update, delete, enable/disable) ---
// Validation schemas
const userCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'teacher', 'admin').required(),
  grade: Joi.string().optional(),
  branch: Joi.string().optional(),
  status: Joi.string().valid('active', 'pending', 'disabled').optional(),
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('student', 'teacher', 'admin').optional(),
  grade: Joi.string().optional(),
  branch: Joi.string().optional(),
  branchApproval: Joi.string().valid('none', 'pending', 'approved').optional(),
  status: Joi.string().valid('active', 'pending', 'disabled').optional(),
  theme: Joi.string().valid('light', 'dark').optional(),
  language: Joi.string().valid('TR', 'EN').optional(),
  notifications: Joi.boolean().optional(),
  bio: Joi.string().max(500).optional(),
  phone: Joi.string().max(50).optional(),
}).min(1);

// Create user (admin)
router.post('/users', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { error, value } = userCreateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı verisi', details: error.details });
    }
    const existing = await User.findOne({ email: value.email });
    if (existing) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
    }
    const user = new User({
      name: value.name,
      email: value.email,
      password: value.password,
      role: value.role,
      grade: value.grade,
      branch: value.branch,
      status: value.status || 'active',
      mustChangePassword: true,
    });
    await user.save();
    try { await AdminAudit.create({ actorId: req.user.id, action: 'create_user', targetUserId: user._id, targetEmail: user.email, metadata: { role: user.role } }); } catch {}
    res.status(201).json({ message: 'Kullanıcı oluşturuldu.', user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    console.error('Create User Hatası:', err);
    res.status(500).json({ message: 'Kullanıcı oluşturma hatası: ' + err.message });
  }
});

// Update user (admin)
router.patch('/users/:id', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { error, value } = userUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Geçersiz güncelleme verisi', details: error.details });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    if (value.email && value.email !== user.email) {
      const exists = await User.findOne({ email: value.email });
      if (exists) return res.status(400).json({ message: 'E-posta başka bir kullanıcı tarafından kullanılıyor.' });
    }

    Object.assign(user, value);
    await user.save();
    try { await AdminAudit.create({ actorId: req.user.id, action: 'update_user', targetUserId: user._id, targetEmail: user.email, metadata: value }); } catch {}
    res.json({ message: 'Kullanıcı güncellendi.', user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    console.error('Update User Hatası:', err);
    res.status(500).json({ message: 'Kullanıcı güncelleme hatası: ' + err.message });
  }
});

// Delete user (admin)
router.delete('/users/:id', auth, hasRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    await RefreshToken.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    try { await AdminAudit.create({ actorId: req.user.id, action: 'delete_user', targetUserId: user._id, targetEmail: user.email }); } catch {}
    res.json({ message: 'Kullanıcı silindi.' });
  } catch (err) {
    console.error('Delete User Hatası:', err);
    res.status(500).json({ message: 'Kullanıcı silme hatası: ' + err.message });
  }
});

// Disable user (set status=disabled)
router.post('/users/:id/disable', auth, hasRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    user.status = 'disabled';
    await user.save();
    try { await AdminAudit.create({ actorId: req.user.id, action: 'disable_user', targetUserId: user._id, targetEmail: user.email }); } catch {}
    res.json({ message: 'Kullanıcı devre dışı bırakıldı.' });
  } catch (err) {
    console.error('Disable User Hatası:', err);
    res.status(500).json({ message: 'Kullanıcı devre dışı bırakma hatası: ' + err.message });
  }
});

// Enable user (set status=active)
router.post('/users/:id/enable', auth, hasRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    user.status = 'active';
    await user.save();
    try { await AdminAudit.create({ actorId: req.user.id, action: 'enable_user', targetUserId: user._id, targetEmail: user.email }); } catch {}
    res.json({ message: 'Kullanıcı aktif hale getirildi.' });
  } catch (err) {
    console.error('Enable User Hatası:', err);
    res.status(500).json({ message: 'Kullanıcı aktif etme hatası: ' + err.message });
  }
});
