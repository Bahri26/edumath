const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middlewares/authMiddleware');
const hasRole = require('../middlewares/roleMiddleware');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AdminAudit = require('../models/AdminAudit');

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

module.exports = router;
