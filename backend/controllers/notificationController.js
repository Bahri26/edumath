const Notification = require('../models/Notification');
const User = require('../models/User');

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
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Bildirimler alınırken hata oluştu',
      error: err.message 
    });
  }
};

// 2. OKUNDU OLARAK İŞARETLE
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bildirim okundu işaretle',
      data: notification
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Bildirim işaretlenirken hata oluştu',
      error: err.message 
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
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Tüm bildirimler okundu işaretle',
      data: result
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Bildirimler işaretlenirken hata oluştu',
      error: err.message 
    });
  }
};

// 4. BİLDİRİM SİL
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bildirim silindi',
      data: notification
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Bildirim silinirken hata oluştu',
      error: err.message 
    });
  }
};

// 5. TÜM BİLDİRİMLERİ SİL
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipientId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Tüm bildirimler silindi',
      data: result
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Bildirimler silinirken hata oluştu',
      error: err.message 
    });
  }
};

// İç Fonksiyon: Bildirim Oluştur (diğer controller'lardan çağrılır)
exports.createNotification = async (recipientId, senderId, type, title, message, metadata = {}, actionUrl = null) => {
  try {
    const notification = new Notification({
      recipientId,
      senderId,
      type,
      title,
      message,
      metadata,
      actionUrl
    });

    await notification.save();
    return notification;
  } catch (err) {
    console.error('Bildirim oluşturulurken hata:', err);
    return null;
  }
};

// Öğretmen atama oluşturduğunda tüm öğrencilere bildirim gönder
exports.notifyStudentsForAssignment = async (assignmentData) => {
  try {
    const students = await User.find({
      role: 'student',
      classLevel: assignmentData.classLevel
    });

    const notifications = students.map(student => ({
      recipientId: student._id,
      senderId: assignmentData.createdBy,
      type: 'assignment',
      title: `Yeni Ödev: ${assignmentData.title}`,
      message: `${assignmentData.title} adlı ödev eklendi. Son tarih: ${new Date(assignmentData.dueDate).toLocaleDateString('tr-TR')}`,
      relatedId: assignmentData._id,
      relatedModel: 'Assignment',
      actionUrl: `/student/assignments`,
      metadata: {
        assignmentTitle: assignmentData.title,
        dueDate: assignmentData.dueDate
      }
    }));

    await Notification.insertMany(notifications);
    return { success: true, notifiedCount: students.length };
  } catch (err) {
    console.error('Öğrencilere bildirim gönderilirken hata:', err);
    return { success: false, error: err.message };
  }
};

// 5. TEST İÇİN MANUEL BİLDİRİM OLUŞTUR (POST)
exports.createNotification = async (req, res) => {
  try {
    // req.user.id -> Kendine bildirim atar (Test için)
    const newNotif = new Notification({
      recipient: req.user.id,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'info'
    });
    await newNotif.save();
    res.status(201).json(newNotif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};