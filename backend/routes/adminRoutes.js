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
const AdminInternalNote = require('../models/AdminInternalNote');
const UserActivity = require('../models/UserActivity');
const AdminUserWatch = require('../models/AdminUserWatch');
const { recordAdminAudit } = require('../services/activityLogger');
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
      await recordAdminAudit(req, {
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
      await recordAdminAudit(req, {
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
      await recordAdminAudit(req, {
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
      User.find(filter).select('name email role status createdAt grade branch branchApproval').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
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
      await recordAdminAudit(req, {
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
      await recordAdminAudit(req, { actorId: req.user.id, action: 'admin_set_password', targetUserId: user._id, targetEmail: user.email });
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

// --- ADMIN AUDIT LOG (read-only) ---
router.get('/audits', auth, hasRole(['admin']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.action && String(req.query.action).trim()) {
      filter.action = String(req.query.action).trim();
    }
    const q = req.query.q && String(req.query.q).trim();
    if (q) {
      filter.$or = [
        { targetEmail: { $regex: q, $options: 'i' } },
        { action: { $regex: q, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      AdminAudit.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email')
        .lean(),
      AdminAudit.countDocuments(filter),
    ]);
    res.json({ items, pagination: { page, limit, total } });
  } catch (error) {
    console.error('Admin audits list error:', error);
    res.status(500).json({ message: 'Denetim kayıtları alınamadı: ' + error.message });
  }
});

// --- KULLANICI AKTİVİTELERİ ---
router.get('/activities/summary', auth, hasRole(['admin']), async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [last24h, byCategory, watchedCount] = await Promise.all([
      UserActivity.countDocuments({ createdAt: { $gte: since } }),
      UserActivity.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      AdminUserWatch.countDocuments(),
    ]);
    res.json({
      last24h,
      watchedUsers: watchedCount,
      byCategory: byCategory.map((r) => ({ category: r._id, count: r.count })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Özet alınamadı: ' + error.message });
  }
});

router.get('/activities', auth, hasRole(['admin']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.category && String(req.query.category).trim()) {
      filter.category = String(req.query.category).trim();
    }
    if (req.query.action && String(req.query.action).trim()) {
      filter.action = { $regex: String(req.query.action).trim(), $options: 'i' };
    }
    if (req.query.userId && String(req.query.userId).trim()) {
      filter.userId = String(req.query.userId).trim();
    }
    if (String(req.query.watchOnly).toLowerCase() === 'true') {
      const watched = await AdminUserWatch.find().distinct('userId');
      if (watched.length === 0) {
        return res.json({ items: [], pagination: { page, limit, total: 0 } });
      }
      if (filter.userId) {
        const inWatch = watched.some((w) => String(w) === String(filter.userId));
        if (!inWatch) {
          return res.json({ items: [], pagination: { page, limit, total: 0 } });
        }
      } else {
        filter.userId = { $in: watched };
      }
    }
    const q = req.query.q && String(req.query.q).trim();
    if (q) {
      filter.$or = [
        { userEmail: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { action: { $regex: q, $options: 'i' } },
        { targetLabel: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      UserActivity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role status')
        .lean(),
      UserActivity.countDocuments(filter),
    ]);

    res.json({ items, pagination: { page, limit, total } });
  } catch (error) {
    console.error('Activities list error:', error);
    res.status(500).json({ message: 'Aktiviteler alınamadı: ' + error.message });
  }
});

router.get('/watchlist', auth, hasRole(['admin']), async (req, res) => {
  try {
    const items = await AdminUserWatch.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role status grade branch')
      .populate('addedBy', 'name email')
      .lean();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Takip listesi alınamadı: ' + error.message });
  }
});

router.post('/watchlist', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { userId, note = '' } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId gerekli.' });
    const user = await User.findById(userId).select('_id name email');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    const item = await AdminUserWatch.findOneAndUpdate(
      { userId: user._id },
      { $set: { note: String(note).slice(0, 500), addedBy: req.user.id } },
      { upsert: true, new: true }
    )
      .populate('userId', 'name email role status')
      .lean();

    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ message: 'Takibe eklenemedi: ' + error.message });
  }
});

router.delete('/watchlist/:userId', auth, hasRole(['admin']), async (req, res) => {
  try {
    await AdminUserWatch.deleteOne({ userId: req.params.userId });
    res.json({ message: 'Takip listesinden çıkarıldı.' });
  } catch (error) {
    res.status(500).json({ message: 'Silinemedi: ' + error.message });
  }
});

// --- ADMIN INTERNAL NOTES (vaka / işlem notları) ---
router.get('/internal-notes', auth, hasRole(['admin']), async (req, res) => {
  try {
    const refType = req.query.refType;
    const refId = req.query.refId;
    if (!['user', 'password_reset_request'].includes(refType) || !refId) {
      return res.status(400).json({ message: 'Geçerli refType ve refId gerekli.' });
    }
    const items = await AdminInternalNote.find({ refType, refId })
      .sort({ createdAt: -1 })
      .populate('authorId', 'name email')
      .lean();
    res.json({ items });
  } catch (error) {
    console.error('Internal notes list error:', error);
    res.status(500).json({ message: 'Notlar alınamadı: ' + error.message });
  }
});

const internalNoteCreateSchema = Joi.object({
  refType: Joi.string().valid('user', 'password_reset_request').required(),
  refId: Joi.string().required(),
  body: Joi.string().min(1).max(4000).required(),
});

router.post('/internal-notes', auth, hasRole(['admin']), async (req, res) => {
  try {
    const { error, value } = internalNoteCreateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Geçersiz not verisi', details: error.details });
    }
    if (value.refType === 'user') {
      const u = await User.findById(value.refId);
      if (!u) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    } else {
      const pr = await PasswordResetRequest.findById(value.refId);
      if (!pr) return res.status(404).json({ message: 'Talep bulunamadı.' });
    }
    const note = await AdminInternalNote.create({
      refType: value.refType,
      refId: value.refId,
      authorId: req.user.id,
      body: value.body.trim(),
    });
    try {
      await recordAdminAudit(req, {
        actorId: req.user.id,
        action: 'admin_internal_note',
        targetUserId: value.refType === 'user' ? value.refId : undefined,
        requestId: value.refType === 'password_reset_request' ? value.refId : undefined,
        metadata: { refType: value.refType, noteId: note._id },
      });
    } catch {}
    const item = await AdminInternalNote.findById(note._id).populate('authorId', 'name email').lean();
    res.status(201).json({ item });
  } catch (error) {
    console.error('Internal note create error:', error);
    res.status(500).json({ message: 'Not kaydedilemedi: ' + error.message });
  }
});

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
      await recordAdminAudit(req, { actorId: req.user.id, action: 'approve_branch', targetUserId: user._id, targetEmail: user.email, metadata: { branch: user.branch } });
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
    try { await recordAdminAudit(req, { actorId: req.user.id, action: 'deny_branch', targetUserId: user._id, targetEmail: user.email, metadata: { branch: user.branch } }); } catch {}
    try { await Notification.create({ recipientId: user._id, senderId: req.user.id, title: 'Branş Talebi Reddedildi', message: 'Branş talebiniz reddedildi. Lütfen tekrar deneyin.', type: 'system' }); } catch {}
    res.json({ message: 'Branş talebi reddedildi.' });
  } catch (error) {
    console.error('Deny Branch Hatası:', error);
    res.status(500).json({ message: 'Reddetme hatası: ' + error.message });
  }
});

// Export after all route registrations to avoid ordering issues

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
    try { await recordAdminAudit(req, { actorId: req.user.id, action: 'create_user', targetUserId: user._id, targetEmail: user.email, metadata: { role: user.role } }); } catch {}
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
    try { await recordAdminAudit(req, { actorId: req.user.id, action: 'update_user', targetUserId: user._id, targetEmail: user.email, metadata: value }); } catch {}
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
    try { await recordAdminAudit(req, { actorId: req.user.id, action: 'delete_user', targetUserId: user._id, targetEmail: user.email }); } catch {}
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
    try { await recordAdminAudit(req, { actorId: req.user.id, action: 'disable_user', targetUserId: user._id, targetEmail: user.email }); } catch {}
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
    try { await recordAdminAudit(req, { actorId: req.user.id, action: 'enable_user', targetUserId: user._id, targetEmail: user.email }); } catch {}
    res.json({ message: 'Kullanıcı aktif hale getirildi.' });
  } catch (err) {
    console.error('Enable User Hatası:', err);
    res.status(500).json({ message: 'Kullanıcı aktif etme hatası: ' + err.message });
  }
});

module.exports = router;
