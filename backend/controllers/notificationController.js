const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');

function recipientWantsNotifications(user) {
  return user?.notifications !== false;
}

async function findStudentsByClassLevel(classLevel) {
  if (!classLevel) return [];

  const users = await User.find({
    role: 'student',
    grade: classLevel,
  }).select('_id notifications');

  if (users.length > 0) return users;

  // Roster üzerinden sınıf eşlemesi (User.grade boş olabilir)
  const roster = await Student.find({ grade: classLevel }).select('userId').lean();
  const ids = roster.map((s) => s.userId).filter(Boolean);
  if (!ids.length) return [];

  return User.find({
    _id: { $in: ids },
    role: 'student',
  }).select('_id notifications');
}

// 1. KULLANICININ BİLDİRİMLERİNİ GETİR
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, read } = req.query;
    const skip = (page - 1) * limit;

    const filter = { recipientId: req.user.id };
    if (read !== undefined) {
      filter.isRead = read === 'true';
    }

    const notifications = await Notification.find(filter)
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / Math.max(parseInt(limit, 10), 1)),
        totalItems: total,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Bildirimler alınırken hata oluştu',
      error: err.message,
    });
  }
};

// 2. OKUNDU OLARAK İŞARETLE
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bildirim okundu işaretlendi',
      data: notification,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Bildirim işaretlenirken hata oluştu',
      error: err.message,
    });
  }
};

// 3. TÜMÜNÜ OKUNDU YAP
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    res.status(200).json({
      success: true,
      message: 'Tüm bildirimler okundu işaretlendi',
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Bildirimler işaretlenirken hata oluştu',
      error: err.message,
    });
  }
};

// 4. BİLDİRİM SİL
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bildirim silindi',
      data: notification,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Bildirim silinirken hata oluştu',
      error: err.message,
    });
  }
};

// 5. TÜM BİLDİRİMLERİ SİL
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipientId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: 'Tüm bildirimler silindi',
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Bildirimler silinirken hata oluştu',
      error: err.message,
    });
  }
};

/** Diğer controller'lardan çağrılan kayıt yardımcısı */
exports.createNotificationRecord = async (
  recipientId,
  senderId,
  type,
  title,
  message,
  metadata = {},
  actionUrl = null,
  related = {},
) => {
  try {
    const recipient = await User.findById(recipientId).select('notifications');
    if (!recipientWantsNotifications(recipient)) return null;

    const notification = new Notification({
      recipientId,
      senderId,
      type,
      title,
      message,
      metadata,
      actionUrl,
      relatedId: related.relatedId || undefined,
      relatedModel: related.relatedModel || undefined,
    });

    await notification.save();
    return notification;
  } catch (err) {
    console.error('Bildirim oluşturulurken hata:', err);
    return null;
  }
};

// Öğretmen atama oluşturduğunda sınıf öğrencilerine bildirim
exports.notifyStudentsForAssignment = async (assignmentData) => {
  try {
    const students = await findStudentsByClassLevel(assignmentData.classLevel);
    const recipients = students.filter(recipientWantsNotifications);

    if (!recipients.length) {
      return { success: true, notifiedCount: 0 };
    }

    const dueLabel = assignmentData.dueDate
      ? new Date(assignmentData.dueDate).toLocaleDateString('tr-TR')
      : 'belirtilmedi';

    const notifications = recipients.map((student) => ({
      recipientId: student._id,
      senderId: assignmentData.createdBy,
      type: 'assignment',
      title: `Yeni ödev: ${assignmentData.title}`,
      message: `${assignmentData.title} eklendi. Son tarih: ${dueLabel}`,
      relatedId: assignmentData._id,
      relatedModel: 'Assignment',
      actionUrl: '/student/assignments',
      metadata: {
        assignmentTitle: assignmentData.title,
        dueDate: assignmentData.dueDate,
      },
    }));

    await Notification.insertMany(notifications);
    return { success: true, notifiedCount: recipients.length };
  } catch (err) {
    console.error('Öğrencilere ödev bildirimi gönderilirken hata:', err);
    return { success: false, error: err.message };
  }
};

// Öğretmen sınav yayınladığında sınıf öğrencilerine bildirim
exports.notifyStudentsForExam = async (examData) => {
  try {
    const students = await findStudentsByClassLevel(examData.classLevel);
    const recipients = students.filter(recipientWantsNotifications);

    if (!recipients.length) {
      return { success: true, notifiedCount: 0 };
    }

    const notifications = recipients.map((student) => ({
      recipientId: student._id,
      senderId: examData.createdBy,
      type: 'exam',
      title: `Yeni sınav: ${examData.title}`,
      message: examData.duration
        ? `${examData.title} yayınlandı (${examData.duration} dk).`
        : `${examData.title} yayınlandı.`,
      relatedId: examData._id,
      relatedModel: 'Exam',
      actionUrl: '/student/quizzes',
      metadata: {
        examTitle: examData.title,
        duration: examData.duration,
      },
    }));

    await Notification.insertMany(notifications);
    return { success: true, notifiedCount: recipients.length };
  } catch (err) {
    console.error('Öğrencilere sınav bildirimi gönderilirken hata:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Mesaj geldiğinde alıcıya bildirim.
 * Aynı konuşmada okunmamış bildirim varsa güncellenir (spam önleme).
 */
exports.notifyForMessage = async ({
  recipientId,
  senderId,
  senderName,
  conversationId,
  preview,
  recipientRole,
}) => {
  try {
    const recipient = await User.findById(recipientId).select('notifications role');
    if (!recipientWantsNotifications(recipient)) return null;

    const role = recipientRole || recipient?.role || 'student';
    const actionUrl = `/${role}/messages`;
    const title = `Yeni mesaj: ${senderName || 'Bir kullanıcı'}`;
    const message = String(preview || '').slice(0, 120) || 'Yeni bir mesajınız var.';

    const existing = await Notification.findOne({
      recipientId,
      type: 'message',
      relatedId: conversationId,
      isRead: false,
    });

    if (existing) {
      existing.title = title;
      existing.message = message;
      existing.senderId = senderId;
      existing.actionUrl = actionUrl;
      existing.createdAt = new Date();
      await existing.save();
      return existing;
    }

    return exports.createNotificationRecord(
      recipientId,
      senderId,
      'message',
      title,
      message,
      { conversationId },
      actionUrl,
      { relatedId: conversationId, relatedModel: 'Message' },
    );
  } catch (err) {
    console.error('Mesaj bildirimi oluşturulurken hata:', err);
    return null;
  }
};

// Test / manuel bildirim (HTTP)
exports.createNotification = async (req, res) => {
  try {
    const newNotif = new Notification({
      recipientId: req.user.id,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'system',
      actionUrl: req.body.actionUrl || null,
    });
    await newNotif.save();
    res.status(201).json({ success: true, data: newNotif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
